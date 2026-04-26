# Project Timeline

This file gives a transparent, high-level view of how the project evolved.

## Phase 1 - Bootstrap
- Created backend and frontend scaffolds.
- Added Docker-based local environment with PostgreSQL and Redis.
- Added baseline repository documentation.

## Phase 2 - Domain Model and API
- Implemented merchants, bank accounts, payouts, ledger entries, and idempotency records.
- Added payout creation flow and dashboard endpoints.
- Modeled balance computation from append-only ledger entries.

## Phase 3 - Reliability Features
- Added idempotency replay support.
- Added row-level locking to prevent concurrent overdraft.
- Added state-machine validation for payout transitions.
- Added worker logic for processing and retrying stuck payouts.

## Phase 4 - Frontend Dashboard
- Built balance summary cards and payout request form.
- Added payout history and ledger activity views.
- Introduced a more polished dashboard layout with sidebar navigation.

## Phase 5 - Runtime Validation and Fixes
- Validated backend and frontend startup.
- Fixed CORS issues for local Vite development.
- Fixed idempotency replay transaction handling.
- Expanded edge-case backend tests to cover requirement scenarios.

## Phase 6 - Ongoing Improvements
- Cleaned up Docker Compose warning noise.
- Documented the real implementation path and follow-up backlog.
