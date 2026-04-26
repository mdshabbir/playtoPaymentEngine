# Playto Payout Engine - Founding Engineer Challenge

Minimal payout engine with strong focus on money integrity, concurrency safety, idempotency, and explainable code.

## Project Story
This repository was built as an incremental engineering exercise rather than a one-shot dump. The implementation was split into core backend flows, UI work, runtime fixes, and test hardening.

For the development narrative, see:
- `DEVLOG.md` for the implementation summary
- `TIMELINE.md` for the milestone-by-milestone progression
- `FOLLOWUPS.md` for the next genuine improvements

## Tech Stack
- Backend: Django + DRF
- Worker: Celery + Redis
- Database: PostgreSQL
- Frontend: React + Tailwind (Vite)

## Quick Start (Docker)
1. `docker compose up --build`
2. In another terminal: `docker compose exec backend python manage.py seed_merchants`
3. Backend API: `http://localhost:8000/api/v1`
4. PostgreSQL from host machine: `127.0.0.1:5433`
5. Frontend (run separately):
   - `cd frontend`
   - `npm install`
   - create `frontend/.env` from `frontend/.env.example`
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
- `python manage.py test engine.tests.test_requirement_cases`

Full backend suite from Docker:
- `docker compose exec backend python manage.py test engine.tests --keepdb`

## Frontend Deployment
The frontend is a Vite app and needs a deployed backend URL in production.

Set this in Vercel project environment variables:
- `VITE_API_BASE=https://<your-backend-domain>/api/v1`
- `VITE_MERCHANT_ID=1`
- Important: after adding/updating Vercel env vars, trigger a new deployment. Vite injects these at build time.

Without `VITE_API_BASE`, the app will only work on localhost and production fetches will fail.
This repo also includes a Vercel rewrite for `/api/v1/*` to the Render backend so browser-side CORS is avoided.
If you use the rewrite path, `VITE_API_BASE` can be omitted in production.

## Backend Deployment (Render)
This repo includes a `render.yaml` blueprint for the Django API and Postgres database.

Deploy flow:
1. Push the latest repo state to GitHub.
2. In Render, choose `New -> Blueprint` and connect this repository.
3. Render will create:
   - a web service: `playto-payment-engine-api`
   - a Postgres database: `playto-payment-engine-db`
4. In the Render service environment, set:
   - `CORS_ALLOWED_ORIGINS=https://playto-payment-engine.vercel.app`
   - `CORS_ALLOWED_ORIGIN_REGEXES=^https://.*\.vercel\.app$` (allows Vercel preview deployment URLs)
   - `CSRF_TRUSTED_ORIGINS=https://playto-payment-engine-api.onrender.com,https://playto-payment-engine.vercel.app,https://*.vercel.app`
   - `DJANGO_ALLOWED_HOSTS=playto-payment-engine-api.onrender.com`
   - `DJANGO_SECRET_KEY=<strong-secret-key>`
5. After deploy, copy the Render backend URL and set this in Vercel:
   - `VITE_API_BASE=https://playto-payment-engine-api.onrender.com/api/v1`
   - `VITE_MERCHANT_ID=1`

## Django Secret Key
- `DJANGO_SECRET_KEY` is Django's cryptographic signing secret.
- It is used for signed cookies, CSRF/session token signing, password reset tokens, and other security-sensitive signatures.
- Never use `dev-only-secret-key` in production and never commit a real secret key to git.

Generate one locally:
- `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`

Then set it as an environment variable in your backend host (Render):
- Key: `DJANGO_SECRET_KEY`
- Value: output of the command above

Notes:
- `preDeployCommand` runs migrations and seeds demo merchants safely.
- The deployed API uses `gunicorn`, `dj-database-url`, and `whitenoise` for production readiness.

## Notes
- All money amounts are stored as integer paise (`BigIntegerField`).
- Ledger is append-only and used to derive balances.
- Idempotency keys are merchant-scoped and valid for 24 hours.
- Local Windows PostgreSQL may already occupy `5432`, so Docker Postgres is mapped to host port `5433`.
