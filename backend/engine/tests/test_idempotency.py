import uuid

from django.test import TransactionTestCase
from rest_framework.test import APIClient

from engine.models import BankAccount, LedgerEntry, Merchant, Payout


class IdempotencyTests(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        self.client = APIClient()
        self.merchant = Merchant.objects.create(name="Demo", email="demo@example.com")
        self.bank = BankAccount.objects.create(
            merchant=self.merchant,
            account_holder_name="Demo",
            account_last4="1234",
            ifsc="HDFC0000001",
        )
        LedgerEntry.objects.create(
            merchant=self.merchant,
            entry_type=LedgerEntry.EntryType.CREDIT,
            amount_paise=100_000,
            reference="test credit",
        )

    def test_same_idempotency_key_returns_same_response(self):
        key = str(uuid.uuid4())
        payload = {"amount_paise": 10_000, "bank_account_id": self.bank.id}
        headers = {"HTTP_X_MERCHANT_ID": str(self.merchant.id), "HTTP_IDEMPOTENCY_KEY": key}

        first = self.client.post("/api/v1/payouts", payload, format="json", **headers)
        second = self.client.post("/api/v1/payouts", payload, format="json", **headers)

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 201)
        self.assertEqual(first.json(), second.json())
        self.assertEqual(Payout.objects.count(), 1)

