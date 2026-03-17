# AGENTS.md

## Project Overview

Dify is an open-source platform for developing LLM applications with an intuitive interface combining agentic AI workflows, RAG pipelines, agent capabilities, and model management.

The codebase is split into:

- **Backend API** (`/api`): Python Flask application organized with Domain-Driven Design
- **Frontend Web** (`/web`): Next.js application using TypeScript and React
- **Docker deployment** (`/docker`): Containerized deployment configurations

## Backend Workflow

- Read `api/AGENTS.md` for details
- Run backend CLI commands through `uv run --project api <command>`.
- Integration tests are CI-only and are not expected to run in the local environment.

## Frontend Workflow

- Read `web/AGENTS.md` for details

## Testing & Quality Practices

- Follow TDD: red → green → refactor.
- Use `pytest` for backend tests with Arrange-Act-Assert structure.
- Enforce strong typing; avoid `Any` and prefer explicit type annotations.
- Write self-documenting code; only add comments that explain intent.

## Language Style

- **Python**: Keep type hints on functions and attributes, and implement relevant special methods (e.g., `__repr__`, `__str__`).
- **TypeScript**: Use the strict config, rely on ESLint (`pnpm lint:fix` preferred) plus `pnpm type-check:tsgo`, and avoid `any` types.

## General Practices

- Prefer editing existing files; add new documentation only when requested.
- Inject dependencies through constructors and preserve clean architecture boundaries.
- Handle errors with domain-specific exceptions at the correct layer.

## Project Conventions

- Backend architecture adheres to DDD and Clean Architecture principles.
- Async work runs through Celery with Redis as the broker.
- Frontend user-facing strings must use `web/i18n/en-US/`; avoid hardcoded text.

## Cursor Cloud specific instructions

### Services overview

| Service | Port | How to start |
|---|---|---|
| Backend API | 5001 | `cd api && uv run flask run --host 0.0.0.0 --port=5001 --debug` |
| Celery Worker | — | `cd api && uv run celery -A app.celery worker -P threads -c 1 --loglevel INFO -Q dataset,priority_dataset,...` (see `dev/start-worker`) |
| Frontend Web | 3000 | `cd web && pnpm dev` |
| Docker middleware | 5432,6379,8080,5002,8194 | `cd docker && sudo docker compose -f docker-compose.middleware.yaml --env-file middleware.env -p dify-middlewares-dev up -d` |

### Non-obvious setup notes

- **Node.js >= 24 required** by `web/package.json` engines field. The VM ships with Node 22 by default; run `nvm install 24 && nvm use 24 && nvm alias default 24` first.
- **uv** (Python package manager) must be installed: `curl -LsSf https://astral.sh/uv/install.sh | sh`.
- **Docker** must be installed and running for middleware (PostgreSQL, Redis, Weaviate, Plugin Daemon, Sandbox, SSRF Proxy). In Cloud Agent VMs, use `fuse-overlayfs` storage driver and `iptables-legacy` for Docker-in-Docker compatibility.
- After starting Docker middleware, run `cd api && uv run flask db upgrade` before starting the API.
- **Environment files** must be copied before first run: `api/.env.example` → `api/.env`, `web/.env.example` → `web/.env.local`, `docker/middleware.env.example` → `docker/middleware.env`.
- The initial admin account must be created via `POST /console/api/setup` with email, name, and password fields before the UI is usable.
- Backend lint: `make lint` (runs ruff format + check + import-linter + dotenv-linter). Frontend lint: `cd web && pnpm lint`.
- Backend tests: `make test` (or `uv run --project api --dev pytest api/tests/unit_tests`). Frontend tests: `cd web && pnpm test`.
- Integration tests are CI-only (per `AGENTS.md`); do not attempt to run them locally.
- One frontend test (`date-and-time-picker`) may fail due to VM timezone differences — this is a known pre-existing issue, not a setup problem.
