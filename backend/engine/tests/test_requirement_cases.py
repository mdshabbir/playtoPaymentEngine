from datetime import timedelta
from unittest.mock import patch
import uuid

from django.test import TransactionTestCase
from django.utils import timezone
from rest_framework.test import APIClient

from engine.models import BankAccount, IdempotencyKey, LedgerEntry, Merchant, Payout
from engine.services.payouts import create_payout_request, finalize_payout, process_one_pending_payout, retry_stuck_processing_payouts


class RequirementEdgeCaseTests(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        self.client = APIClient()
        self.merchant = Merchant.objects.create(name="Edge Merchant", email="edge@example.com")
        self.bank = BankAccount.objects.create(
            merchant=self.merchant,
            account_holder_name="Edge Merchant",
            account_last4="9999",
            ifsc="HDFC0000009",
        )
        LedgerEntry.objects.create(
            merchant=self.merchant,
            entry_type=LedgerEntry.EntryType.CREDIT,
            amount_paise=500_000,
            reference="seed credit",
        )
        self.headers = {"HTTP_X_MERCHANT_ID": str(self.merchant.id)}

    def test_same_key_with_different_payload_returns_409(self):
        key = str(uuid.uuid4())
        headers = {**self.headers, "HTTP_IDEMPOTENCY_KEY": key}

        first = self.client.post(
            "/api/v1/payouts",
            {"amount_paise": 10_000, "bank_account_id": self.bank.id},
            format="json",
            **headers,
        )
        second = self.client.post(
            "/api/v1/payouts",
            {"amount_paise": 12_000, "bank_account_id": self.bank.id},
            format="json",
            **headers,
        )

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 409)
        self.assertEqual(Payout.objects.count(), 1)

    def test_expired_idempotency_key_is_reused_as_new_request(self):
        key = str(uuid.uuid4())
        first = create_payout_request(
            merchant=self.merchant,
            idempotency_key=key,
            amount_paise=10_000,
            bank_account_id=self.bank.id,
        )
        self.assertEqual(first.status_code, 201)
        first_payout_id = first.body["payout_id"]

        idem = IdempotencyKey.objects.get(merchant=self.merchant, key=key)
        idem.expires_at = timezone.now() - timedelta(seconds=1)
        idem.save(update_fields=["expires_at", "updated_at"])

        second = create_payout_request(
            merchant=self.merchant,
            idempotency_key=key,
            amount_paise=10_000,
            bank_account_id=self.bank.id,
        )
        self.assertEqual(second.status_code, 201)
        self.assertNotEqual(second.body["payout_id"], first_payout_id)
        self.assertEqual(Payout.objects.count(), 2)

    def test_failed_payout_release_entry_is_exactly_once(self):
        response = create_payout_request(
            merchant=self.merchant,
            idempotency_key=str(uuid.uuid4()),
            amount_paise=9_000,
            bank_account_id=self.bank.id,
        )
        payout_id = response.body["payout_id"]

        payout = Payout.objects.get(id=payout_id)
        payout.status = Payout.Status.PROCESSING
        payout.save(update_fields=["status", "updated_at"])

        finalize_payout(payout.id, Payout.Status.FAILED, "forced failure")
        with self.assertRaises(ValueError):
            finalize_payout(payout.id, Payout.Status.FAILED, "double failure attempt")

        self.assertEqual(
            LedgerEntry.objects.filter(
                payout_id=payout.id,
                entry_type=LedgerEntry.EntryType.PAYOUT_RELEASE,
            ).count(),
            1,
        )

    def test_retry_watchdog_marks_failed_at_max_attempts(self):
        payout = Payout.objects.create(
            merchant=self.merchant,
            bank_account=self.bank,
            amount_paise=8_000,
            status=Payout.Status.PROCESSING,
            attempt_count=3,
            last_attempt_at=timezone.now() - timedelta(seconds=40),
        )

        processed = retry_stuck_processing_payouts(max_attempts=3)
        payout.refresh_from_db()

        self.assertEqual(processed, 1)
        self.assertEqual(payout.status, Payout.Status.FAILED)
        self.assertEqual(
            LedgerEntry.objects.filter(
                payout_id=payout.id,
                entry_type=LedgerEntry.EntryType.PAYOUT_RELEASE,
            ).count(),
            1,
        )

    def test_retry_watchdog_increments_attempt_and_backoff(self):
        payout = Payout.objects.create(
            merchant=self.merchant,
            bank_account=self.bank,
            amount_paise=7_000,
            status=Payout.Status.PROCESSING,
            attempt_count=1,
            last_attempt_at=timezone.now() - timedelta(seconds=45),
        )

        with patch("engine.services.payouts._simulate_settlement", return_value=None):
            processed = retry_stuck_processing_payouts(max_attempts=3)

        payout.refresh_from_db()
        self.assertEqual(processed, 1)
        self.assertEqual(payout.attempt_count, 2)
        self.assertIsNotNone(payout.next_retry_at)
        self.assertGreaterEqual(
            payout.next_retry_at,
            payout.last_attempt_at + timedelta(seconds=10),
        )

    def test_process_pending_keeps_processing_if_settlement_crashes(self):
        create_payout_request(
            merchant=self.merchant,
            idempotency_key=str(uuid.uuid4()),
            amount_paise=11_000,
            bank_account_id=self.bank.id,
        )
        payout = Payout.objects.get()

        with patch("engine.services.payouts._simulate_settlement", side_effect=RuntimeError("simulated crash")):
            with self.assertRaises(RuntimeError):
                process_one_pending_payout()

        payout.refresh_from_db()
        self.assertEqual(payout.status, Payout.Status.PROCESSING)
        self.assertEqual(payout.attempt_count, 1)
        self.assertEqual(
            LedgerEntry.objects.filter(
                payout_id=payout.id,
                entry_type=LedgerEntry.EntryType.PAYOUT_DEBIT,
            ).count(),
            0,
        )
        self.assertEqual(
            LedgerEntry.objects.filter(
                payout_id=payout.id,
                entry_type=LedgerEntry.EntryType.PAYOUT_RELEASE,
            ).count(),
            0,
        )
