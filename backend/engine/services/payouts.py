from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from datetime import timedelta
import random

from django.db import IntegrityError, transaction
from django.utils import timezone

from engine.models import BankAccount, IdempotencyKey, LedgerEntry, Merchant, Payout
from engine.services.ledger import get_balances
from engine.state_machine import assert_transition_allowed


class IdempotencyConflictError(Exception):
    pass


class InsufficientFundsError(Exception):
    pass


class InvalidBankAccountError(Exception):
    pass


@dataclass
class ServiceResponse:
    status_code: int
    body: dict


def _request_fingerprint(payload: dict) -> str:
    raw = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _set_idempotent_response(record: IdempotencyKey, response: ServiceResponse) -> None:
    record.response_status_code = response.status_code
    record.response_body = response.body
    record.save(update_fields=["response_status_code", "response_body", "updated_at"])


def create_payout_request(
    merchant: Merchant, idempotency_key: str, amount_paise: int, bank_account_id: int
) -> ServiceResponse:
    payload = {"amount_paise": amount_paise, "bank_account_id": bank_account_id}
    fingerprint = _request_fingerprint(payload)
    now = timezone.now()

    with transaction.atomic():
        merchant = Merchant.objects.select_for_update().get(id=merchant.id)
        idem = _create_or_lock_idempotency_row(merchant, idempotency_key, fingerprint, now)

        # Replay exact prior response for same merchant+key+payload within TTL.
        if idem.response_status_code:
            return ServiceResponse(status_code=idem.response_status_code, body=idem.response_body)

        try:
            bank_account = BankAccount.objects.get(id=bank_account_id, merchant=merchant, is_active=True)
        except BankAccount.DoesNotExist as exc:
            response = ServiceResponse(status_code=404, body={"detail": "Bank account not found"})
            _set_idempotent_response(idem, response)
            raise InvalidBankAccountError from exc

        balances = get_balances(merchant)
        if amount_paise > balances["available_balance_paise"]:
            response = ServiceResponse(
                status_code=409,
                body={"detail": "Insufficient available balance"},
            )
            _set_idempotent_response(idem, response)
            raise InsufficientFundsError

        payout = Payout.objects.create(
            merchant=merchant,
            bank_account=bank_account,
            amount_paise=amount_paise,
            status=Payout.Status.PENDING,
        )
        LedgerEntry.objects.create(
            merchant=merchant,
            payout=payout,
            entry_type=LedgerEntry.EntryType.PAYOUT_HOLD,
            amount_paise=amount_paise,
            reference=f"Hold for payout {payout.id}",
        )

        response = ServiceResponse(
            status_code=201,
            body={
                "payout_id": str(payout.id),
                "status": payout.status,
                "amount_paise": payout.amount_paise,
                "merchant_id": merchant.id,
                "created_at": payout.created_at.isoformat(),
            },
        )
        _set_idempotent_response(idem, response)
        return response


def _create_or_lock_idempotency_row(
    merchant: Merchant, idempotency_key: str, fingerprint: str, now
) -> IdempotencyKey:
    expires_at = now + timedelta(hours=24)
    try:
        return IdempotencyKey.objects.create(
            merchant=merchant,
            key=idempotency_key,
            request_fingerprint=fingerprint,
            expires_at=expires_at,
        )
    except IntegrityError:
        existing = IdempotencyKey.objects.select_for_update().get(merchant=merchant, key=idempotency_key)
        if existing.expires_at < now:
            existing.request_fingerprint = fingerprint
            existing.response_status_code = 0
            existing.response_body = {}
            existing.expires_at = expires_at
            existing.save(
                update_fields=[
                    "request_fingerprint",
                    "response_status_code",
                    "response_body",
                    "expires_at",
                    "updated_at",
                ]
            )
            return existing
        if existing.request_fingerprint != fingerprint:
            raise IdempotencyConflictError("Same Idempotency-Key used with different request payload")
        return existing


def process_one_pending_payout() -> bool:
    with transaction.atomic():
        payout = (
            Payout.objects.select_for_update(skip_locked=True)
            .filter(status=Payout.Status.PENDING)
            .order_by("created_at")
            .first()
        )
        if not payout:
            return False

        assert_transition_allowed(payout.status, Payout.Status.PROCESSING)
        payout.status = Payout.Status.PROCESSING
        payout.attempt_count += 1
        payout.last_attempt_at = timezone.now()
        payout.next_retry_at = timezone.now() + timedelta(seconds=5)
        payout.save(update_fields=["status", "attempt_count", "last_attempt_at", "next_retry_at", "updated_at"])

    _simulate_settlement(payout.id)
    return True


def _simulate_settlement(payout_id) -> None:
    roll = random.random()
    if roll < 0.7:
        finalize_payout(payout_id=payout_id, next_status=Payout.Status.COMPLETED)
    elif roll < 0.9:
        finalize_payout(payout_id=payout_id, next_status=Payout.Status.FAILED, failure_reason="Bank settlement failed")
    else:
        # Keep it in processing to be picked by retry watchdog.
        pass


def finalize_payout(payout_id, next_status: str, failure_reason: str = "") -> None:
    with transaction.atomic():
        payout = Payout.objects.select_for_update().select_related("merchant").get(id=payout_id)
        assert_transition_allowed(payout.status, next_status)
        payout.status = next_status
        if next_status == Payout.Status.FAILED:
            payout.failure_reason = failure_reason or "Unknown settlement failure"
            LedgerEntry.objects.create(
                merchant=payout.merchant,
                payout=payout,
                entry_type=LedgerEntry.EntryType.PAYOUT_RELEASE,
                amount_paise=payout.amount_paise,
                reference=f"Release hold for failed payout {payout.id}",
            )
        else:
            LedgerEntry.objects.create(
                merchant=payout.merchant,
                payout=payout,
                entry_type=LedgerEntry.EntryType.PAYOUT_DEBIT,
                amount_paise=payout.amount_paise,
                reference=f"Debit settled payout {payout.id}",
            )
        payout.save(update_fields=["status", "failure_reason", "updated_at"])


def retry_stuck_processing_payouts(max_attempts: int = 3) -> int:
    now = timezone.now()
    processed = 0
    candidates = (
        Payout.objects.filter(status=Payout.Status.PROCESSING)
        .filter(last_attempt_at__lte=now - timedelta(seconds=30))
        .order_by("last_attempt_at")
    )

    for payout_id in candidates.values_list("id", flat=True):
        with transaction.atomic():
            payout = Payout.objects.select_for_update().get(id=payout_id)
            if payout.status != Payout.Status.PROCESSING:
                continue
            if payout.attempt_count >= max_attempts:
                finalize_payout(payout.id, Payout.Status.FAILED, "Max retry attempts reached")
                processed += 1
                continue
            payout.attempt_count += 1
            payout.last_attempt_at = now
            payout.next_retry_at = now + timedelta(seconds=5 * (2 ** (payout.attempt_count - 1)))
            payout.save(update_fields=["attempt_count", "last_attempt_at", "next_retry_at", "updated_at"])
        _simulate_settlement(payout_id)
        processed += 1
    return processed

