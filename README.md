# Playto Payout Engine - Founding Engineer Challenge

Minimal payout engine with strong focus on money integrity, concurrency safety, idempotency, and explainable code.

## Tech Stack
- Backend: Django + DRF
- Worker: Celery + Redis
- Database: PostgreSQL
- Frontend: React + Tailwind (Vite)

## Quick Start (Docker)
1. `docker compose up --build`
2. In another terminal: `docker compose exec backend python manage.py seed_merchants`
3. Backend API: `http://localhost:8000/api/v1`
4. Frontend (run separately):
   - `cd frontend`
   - `npm install`
   - `npm run dev`

## Local Backend Setup (without Docker)
1. Create Python venv
2. `pip install -r backend/requirements.txt`
3. Configure env from `.env.example`
4. `cd backend`
5. `python manage.py migrate`
6. `python manage.py seed_merchants`
7. `python manage.py runserver`

## Core Endpoints
- `POST /api/v1/payouts`
  - Headers: `X-Merchant-ID`, `Idempotency-Key`
  - Body: `{ "amount_paise": 6000, "bank_account_id": 1 }`
- `GET /api/v1/dashboard`
- `GET /api/v1/payouts/list`

## Worker Tasks
- `engine.tasks.process_pending_payouts_task`
- `engine.tasks.retry_stuck_payouts_task`

## Tests
From `backend/`:
- `python manage.py test engine.tests.test_idempotency`
- `python manage.py test engine.tests.test_concurrency`
- `python manage.py test engine.tests.test_state_machine`

## Notes
- All money amounts are stored as integer paise (`BigIntegerField`).
- Ledger is append-only and used to derive balances.
- Idempotency keys are merchant-scoped and valid for 24 hours.

