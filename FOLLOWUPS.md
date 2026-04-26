# Follow-Up Backlog

These are genuine next improvements that would make the project stronger.

## 1. Add frontend test coverage
- Add component and API-state tests for dashboard loading, payout submission, and error handling.

## 2. Improve payout observability
- Add structured logs around payout creation, worker transitions, and retry outcomes.

## 3. Add API pagination and filters
- Support pagination on ledger and payout history endpoints for larger datasets.

## 4. Harden configuration management
- Move more runtime settings into `.env` and document local vs Docker defaults.

## 5. Add CI checks
- Run backend tests and frontend build automatically on every push.
