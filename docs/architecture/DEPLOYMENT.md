# Deployment Guide

## Prerequisites

- Python 3.12+
- Docker (for containerised deployment)

---

## 1. Environment Configuration

Configuration follows a centralized flow:

```
.env
  ↓
python-dotenv → app/config.py (Settings singleton)
  ↓
FastAPI / SQLAlchemy / Alembic
```

All environment variables are loaded from `backend/.env` by `app/config.py` using `python-dotenv`. The `Settings` object is imported and reused across the application — no module reads `os.environ` directly.

| File | Purpose |
|---|---|
| `backend/.env` | Actual values (git-ignored) |
| `backend/.env.example` | Template with placeholder secrets (committed) |
| `app/config.py` | Loads `.env`, exposes `settings` singleton |

Relevant settings:
- `DATABASE_URL` — full connection string for SQLAlchemy
- `SECRET_KEY` — placeholder for future auth
- `API_PREFIX` — controls route prefix (default `/api/v1`)

### Local vs Container

| Context | `DATABASE_URL` value |
|---|---|
| Local (no Docker) | `postgresql://user:pass@localhost:5432/db` |
| Docker Compose | `postgresql://user:pass@postgres:5432/db` |
| Testing | Override via `DATABASE_URL=sqlite:///...` |

---

## 2. Local Setup

```bash
cd backend
pip install -r requirements.txt

cp .env.example .env
# Edit .env: set DATABASE_URL to local PostgreSQL, or use SQLite for quick testing:
# DATABASE_URL=sqlite:///./dev.db

python -m pytest
uvicorn app.main:app --reload
```

---

## 3. Docker Build

```bash
docker build -t fifa-scoring .
```

---

## 4. Docker Run

```bash
docker run -d --name fifa-api -p 8000:8000 fifa-scoring
```

Verify the container starts:

```bash
curl http://localhost:8000/health
# {"status":"running"}
```

Stop the container:

```bash
docker stop fifa-api
```

---

## 5. Docker Compose

Both the API and PostgreSQL read from the same `backend/.env` file. The Postgres container picks up `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` from the environment.

Start all services:

```bash
docker compose up -d
```

Check service status:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs -f
```

Stop services:

```bash
docker compose down
```

---

## API Endpoints (Docker)

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Health check |
| `/version` | GET | App name + version |
| `/api/v1/predictions` | POST | Submit team prediction |
| `/api/v1/actual-results` | POST | Submit actual match result |
| `/api/v1/calculate-match-score` | POST | Calculate match base score |
| `/api/v1/technical-score` | POST | Calculate technical score |
| `/api/v1/presentation-score` | POST | Calculate presentation score |
| `/api/v1/leaderboard/calculate` | POST | Generate final leaderboard |
