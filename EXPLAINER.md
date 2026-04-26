# EXPLAINER.md

## 1) The Ledger
Balance query lives in `backend/engine/services/ledger.py:get_balances`.

```python
amounts = LedgerEntry.objects.filter(merchant=merchant).aggregate(
    credits=Coalesce(Sum(Case(When(entry_type=LedgerEntry.EntryType.CREDIT, then="amount_paise"), ...)), Value(0)),
    holds=Coalesce(Sum(Case(When(entry_type=LedgerEntry.EntryType.PAYOUT_HOLD, then="amount_paise"), ...)), Value(0)),
    releases=Coalesce(Sum(Case(When(entry_type=LedgerEntry.EntryType.PAYOUT_RELEASE, then="amount_paise"), ...)), Value(0)),
    debits=Coalesce(Sum(Case(When(entry_type=LedgerEntry.EntryType.PAYOUT_DEBIT, then="amount_paise"), ...)), Value(0)),
)
```

Modeling as append-only credit/hold/release/debit entries gives auditable history and deterministic derived balances.

## 2) The Lock
Locking code is in `backend/engine/services/payouts.py:create_payout_request`:

```python
with transaction.atomic():
    merchant = Merchant.objects.select_for_update().get(id=merchant.id)
    ...
    balances = get_balances(merchant)
    if amount_paise > balances["available_balance_paise"]:
        ...
    payout = Payout.objects.create(...)
    LedgerEntry.objects.create(... entry_type=PAYOUT_HOLD ...)
```

This relies on PostgreSQL row-level locking (`SELECT ... FOR UPDATE`) to serialize concurrent payout requests per merchant.

## 3) The Idempotency
Idempotency persistence is in `IdempotencyKey` model and `_create_or_lock_idempotency_row` in `backend/engine/services/payouts.py`.

- First request creates `(merchant, key)` row and later stores the response snapshot.
- Same key + same payload replays stored response.
- Same key + different payload returns conflict.
- Key expires after 24h and is reusable.

If first request is in-flight, second request waits on row lock and then replays saved response.

## 4) The State Machine
Guard is in `backend/engine/state_machine.py`:

```python
ALLOWED_TRANSITIONS = {
    "pending": {"processing"},
    "processing": {"completed", "failed"},
    "completed": set(),
    "failed": set(),
}
```

`failed -> completed` is blocked by `assert_transition_allowed`.

## 5) The AI Audit
AI originally suggested:
- read balance in Python
- then create payout and hold in separate queries without lock

That is race-prone (classic check-then-write bug).

I replaced it with:
- one atomic transaction
- merchant row lock via `select_for_update`
- DB aggregate balance check inside transaction
- hold entry creation before commit

This guarantees two simultaneous 6000 paise requests against a 10000 paise balance cannot both pass.

