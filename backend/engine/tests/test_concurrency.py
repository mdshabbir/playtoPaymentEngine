import threading
import uuid

from django.db import connection
from django.test import TransactionTestCase
from rest_framework.test import APIClient

from engine.models import BankAccount, LedgerEntry, Merchant, Payout


class ConcurrencyTests(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        self.merchant = Merchant.objects.create(name="Concurrent", email="concurrent@example.com")
        self.bank = BankAccount.objects.create(
            merchant=self.merchant,
            account_holder_name="Concurrent",
            account_last4="5678",
            ifsc="HDFC0000002",
        )
        LedgerEntry.objects.create(
            merchant=self.merchant,
            entry_type=LedgerEntry.EntryType.CREDIT,
            amount_paise=10_000,
            reference="initial credit",
        )

    def _request(self, results: list[int], idx: int, barrier: threading.Barrier):
        client = APIClient()
        headers = {
            "HTTP_X_MERCHANT_ID": str(self.merchant.id),
            "HTTP_IDEMPOTENCY_KEY": str(uuid.uuid4()),
        }
        payload = {"amount_paise": 6_000, "bank_account_id": self.bank.id}
        barrier.wait()
        response = client.post("/api/v1/payouts", payload, format="json", **headers)
        results[idx] = response.status_code

    def test_two_parallel_payouts_only_one_succeeds(self):
        if not connection.features.has_select_for_update:
            self.skipTest("Database does not support select_for_update")

        results = [0, 0]
        barrier = threading.Barrier(2)
        t1 = threading.Thread(target=self._request, args=(results, 0, barrier))
        t2 = threading.Thread(target=self._request, args=(results, 1, barrier))
        t1.start()
        t2.start()
        t1.join()
        t2.join()

        self.assertCountEqual(results, [201, 409])
        self.assertEqual(Payout.objects.count(), 1)

