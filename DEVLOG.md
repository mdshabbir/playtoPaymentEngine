# Development Log

This log summarizes the implementation journey in an honest, feature-by-feature format.

## 1. Project Bootstrap
- Scaffolded backend (Django + DRF + Celery) and frontend (React + Vite + Tailwind).
- Added Docker Compose services for PostgreSQL, Redis, backend, and worker.
- Added base documentation in `README.md` and `EXPLAINER.md`.

## 2. Core Payout Engine
- Implemented domain models: merchant, bank account, payout, ledger entry, idempotency key.
- Added payout API flow with atomic balance checks and hold entry creation.
- Enforced state-machine transitions for payout lifecycle.

## 3. Reliability and Correctness
- Added idempotency replay and conflict handling.
- Added concurrency safeguards with row-level locking.
- Added retry logic for stuck processing payouts.

## 4. Frontend Dashboard
- Implemented dashboard page and key components:
  - balance cards
  - payout form
  - payout history
  - ledger activity
- Added sidebar layout and polished UI states.

## 5. Runtime Fixes and Stabilization
- Fixed CORS for local frontend origins and custom headers.
- Fixed idempotency replay race causing transaction errors.
- Added/expanded backend test coverage for requirement edge cases.

## 6. Validation
- Backend tests run and passing (`engine.tests`).
- Frontend build/dev checks completed.
- API smoke checks done for dashboard and payout creation/replay flows.
