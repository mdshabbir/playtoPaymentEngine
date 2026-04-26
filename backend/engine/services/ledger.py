from django.db.models import BigIntegerField, Case, Sum, Value, When
from django.db.models.functions import Coalesce

from engine.models import LedgerEntry, Merchant


def get_balances(merchant: Merchant) -> dict[str, int]:
    amounts = LedgerEntry.objects.filter(merchant=merchant).aggregate(
        credits=Coalesce(
            Sum(
                Case(
                    When(entry_type=LedgerEntry.EntryType.CREDIT, then="amount_paise"),
                    default=Value(0),
                    output_field=BigIntegerField(),
                )
            ),
            Value(0),
        ),
        holds=Coalesce(
            Sum(
                Case(
                    When(entry_type=LedgerEntry.EntryType.PAYOUT_HOLD, then="amount_paise"),
                    default=Value(0),
                    output_field=BigIntegerField(),
                )
            ),
            Value(0),
        ),
        releases=Coalesce(
            Sum(
                Case(
                    When(entry_type=LedgerEntry.EntryType.PAYOUT_RELEASE, then="amount_paise"),
                    default=Value(0),
                    output_field=BigIntegerField(),
                )
            ),
            Value(0),
        ),
        debits=Coalesce(
            Sum(
                Case(
                    When(entry_type=LedgerEntry.EntryType.PAYOUT_DEBIT, then="amount_paise"),
                    default=Value(0),
                    output_field=BigIntegerField(),
                )
            ),
            Value(0),
        ),
    )

    available = amounts["credits"] - amounts["holds"] + amounts["releases"] - amounts["debits"]
    held = amounts["holds"] - amounts["releases"] - amounts["debits"]
    return {"available_balance_paise": int(available), "held_balance_paise": int(held)}

