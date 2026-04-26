import uuid

from django.core.validators import MinValueValidator
from django.db import models


class Merchant(models.Model):
    name = models.CharField(max_length=120)
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.name


class BankAccount(models.Model):
    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name="bank_accounts")
    account_holder_name = models.CharField(max_length=120)
    account_last4 = models.CharField(max_length=4)
    ifsc = models.CharField(max_length=16)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Payout(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name="payouts")
    bank_account = models.ForeignKey(BankAccount, on_delete=models.PROTECT, related_name="payouts")
    amount_paise = models.BigIntegerField(validators=[MinValueValidator(1)])
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    attempt_count = models.PositiveSmallIntegerField(default=0)
    next_retry_at = models.DateTimeField(null=True, blank=True)
    last_attempt_at = models.DateTimeField(null=True, blank=True)
    failure_reason = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class LedgerEntry(models.Model):
    class EntryType(models.TextChoices):
        CREDIT = "credit", "Credit"
        PAYOUT_HOLD = "payout_hold", "Payout Hold"
        PAYOUT_RELEASE = "payout_release", "Payout Release"
        PAYOUT_DEBIT = "payout_debit", "Payout Debit"

    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name="ledger_entries")
    payout = models.ForeignKey(Payout, on_delete=models.CASCADE, related_name="ledger_entries", null=True, blank=True)
    entry_type = models.CharField(max_length=24, choices=EntryType.choices)
    amount_paise = models.BigIntegerField(validators=[MinValueValidator(1)])
    reference = models.CharField(max_length=200, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["merchant", "entry_type"]),
            models.Index(fields=["created_at"]),
        ]


class IdempotencyKey(models.Model):
    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name="idempotency_keys")
    key = models.CharField(max_length=64)
    request_fingerprint = models.CharField(max_length=128)
    response_status_code = models.PositiveSmallIntegerField(default=0)
    response_body = models.JSONField(default=dict)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["merchant", "key"], name="uniq_merchant_idempotency_key"),
        ]

