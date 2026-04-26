from django.core.management.base import BaseCommand

from engine.models import BankAccount, LedgerEntry, Merchant


class Command(BaseCommand):
    help = "Seed demo merchants, bank accounts, and credits."

    def handle(self, *args, **options):
        merchants = [
            ("Acme Agency", "acme@example.com", 250_000),
            ("Nova Freelance", "nova@example.com", 120_000),
            ("Orbit Studio", "orbit@example.com", 500_000),
        ]

        for name, email, credit in merchants:
            merchant, _ = Merchant.objects.get_or_create(
                email=email,
                defaults={"name": name},
            )
            BankAccount.objects.get_or_create(
                merchant=merchant,
                account_last4="4242",
                defaults={
                    "account_holder_name": merchant.name,
                    "ifsc": "HDFC0000123",
                    "is_active": True,
                },
            )
            if not merchant.ledger_entries.filter(entry_type=LedgerEntry.EntryType.CREDIT).exists():
                LedgerEntry.objects.create(
                    merchant=merchant,
                    entry_type=LedgerEntry.EntryType.CREDIT,
                    amount_paise=credit,
                    reference="Seed credit",
                )
            self.stdout.write(self.style.SUCCESS(f"Seeded {merchant.name} ({merchant.id})"))

