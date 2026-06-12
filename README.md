# GOALGORITHM — FIFA Challenge Scoring System

Full-stack tournament scoring platform for evaluating AI match prediction teams. Organizers upload rosters, teams submit predictions, and the system automatically computes scores across three phases — producing a final leaderboard out of **100 marks**.

> This system does **not** build or train AI prediction models. It is the evaluation infrastructure that objectively measures how well each participating team's AI model performed.

---

## System Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Frontend (Vanilla JS)               │
│  dashboard  teams  matches  predictions  scoring      │
│  leaderboard  analytics  technical  presentation      │
│                  Light/Dark Theme                     │
└──────────────────────┬───────────────────────────────┘
                       │  HTTP (REST API)
                       ▼
┌──────────────────────────────────────────────────────┐
│              Backend (Python FastAPI)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐  │
│  │ Routes   │ │ Schemas  │ │ Services & Scoring   │  │
│  │ (auth/   │ │ (Pydantic│ │ Engine               │  │
│  │  teams/  │ │  v2)     │ │  - Base Score        │  │
│  │  predict/│ │          │ │  - Multiplier        │  │
│  │  scoring/│ │          │ │  - Normalization     │  │
│  │  leader- │ │          │ │  - Technical Eval    │  │
│  │  board)  │ │          │ │  - Presentation Eval │  │
│  └────┬─────┘ └──────────┘ └──────────┬───────────┘  │
│       │                               │              │
│       └───────────┬───────────────────┘              │
│                   ▼                                  │
│        ┌──────────────────────┐                      │
│        │  SQLAlchemy ORM      │                      │
│        │  + Alembic Migrations│                      │
│        └──────────┬───────────┘                      │
└───────────────────┼──────────────────────────────────┘
                    ▼
         ┌─────────────────────┐
         │  PostgreSQL 16      │
         │  (or SQLite dev)    │
         └─────────────────────┘
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | Vanilla JavaScript (SPA), CSS3 with custom properties, Light/Dark theme |
| **Backend** | Python 3.12+, FastAPI, Uvicorn |
| **Validation** | Pydantic v2 |
| **ORM** | SQLAlchemy 2.0 |
| **Migrations** | Alembic |
| **Database** | PostgreSQL 16 (production), SQLite (development/test) |
| **Auth** | JWT (Bearer tokens), role-based access control |
| **Containerization** | Docker + Docker Compose |
| **Testing** | pytest, httpx (TestClient) |
| **Parsing** | csv (stdlib), openpyxl (XLSX), xlrd (XLS) |

---

## Major Features

### Authentication & Roles
- **JWT-based authentication** — secure Bearer token login/registration
- **Organizer role** — full admin access: upload rosters, manage matches, enter results, trigger scoring, view all data
- **Team Leader role** — limited access: manage team profile, submit predictions, view own scores
- **Role-based dashboards** — Organizer Dashboard vs Team Leader Dashboard with different capabilities

### Team Management
**Team Structure:**
- **Team ID** — Fixed identifiers (A, B, C, D, E) used for grouping and internal mapping
- **Team Name** — Custom name chosen by teams, displayed throughout the UI

**Excel/CSV team member upload:**
- **Supported Formats** — Supports `.csv`, `.xls`, and `.xlsx` files
- **Input Columns** — Expects `SL No`, `EmployeeID`, `Name`, `Seniority`, `Gender`, `Football Knowledge`, `Group`
- **Extraction** — Stores/uses only `EmployeeID`, `Name`, and `Group` (which maps to Team ID)
- **CSV management lock** — Once uploaded, teams are flagged `is_csv_managed = true`; manual member additions/removals are blocked to prevent roster corruption

### Model Submission
- **Supported ML Files** — accepts `.zip`, `.tar.gz`, `.py`, and `.ipynb` files up to 50MB
- **Upload Workflow** — secure endpoints mapping uploads to the authenticated team leader
- **Time Window Locking** — API strictly blocks uploads when the organizer-defined window is closed
- **Organizer Controls** — dedicated frontend module to dynamically configure window `start_time`, `end_time`, and `is_enabled`

### Predictions Management
- **Structured JSON submissions** — per-team, per-match predictions with winner, scoreline, probabilities, player predictions
- **Schema validation** — strict Pydantic contracts enforce required fields, data types, value ranges, and enums
- **Duplicate prevention** — unique constraint on `(team_id, match_id)` rejects double submissions with 409
- **Status tracking** — predictions flow through PENDING_VALIDATION → VALIDATED / INVALID states

### Scoring Engine
- **Base Score** — four dimensions computed per match: Winner (5pt), Scoreline Exactness (10pt), Probability Accuracy (5pt), Player Performance (5pt); max **25 pts**
- **Per-match ranking** — all 5 teams ranked by base score each match
- **Grade multiplier** — A = 3× (top rank), B = 2× (middle ranks), C = 1× (bottom rank); tie rules applied
- **Phase 1 normalization** — cumulative earned points normalized to a **60-mark** scale: `(team_total / max_total) × 60`

### Admin Scoring Configuration
- **Editable Thresholds** — organizers can tweak performance bounds and total points allocations without coding
- **Probability/Accuracy Rules** — dynamic configuration of correctness rewards
- **Future Matches Only** — ensures changes only impact newly processed records
- **Seamless Integrations** — fully connected via dedicated backend APIs to a friendly frontend module

### Evaluation Phases
- **Technical Evaluation (Phase 2)** — committee scores 4 sub-dimensions (Code Quality, Backend Quality, Teamwork, AI Explanation), each 0–5, summed to max **20 marks**
- **Presentation Evaluation (Phase 3)** — peer raw scores across 3 dimensions, ranked, graded, multiplied, and normalized to **20 marks**

### Leaderboard
- **Aggregate scores** — Phase 1 + Phase 2 + Phase 3 = Grand Total out of **100 marks**
- **Automatic sorting** — descending by final score with tie-breaking rules
- **Rank display** — #1–5 with visual rank badges

### Analytics
- **Score progression line chart** — per-match earned points over time
- **Phase contribution donut** — visual breakdown of Phase 1/2/3 scores
- **Dimension profile radar** — per-dimension performance bars
- **Per-match comparison** — side-by-side team comparison for individual matches
- **Cross-team comparison** — dropdown-select any team to compare

### Frontend Features
- **Single Page Application** — client-side routing via hash-based Router
- **Organizer Dashboard** — stat cards (teams, predictions, top score), leaderboard preview, recent teams list, quick action buttons
- **Team Leader Dashboard** — profile management, member list, CSV-managed badge
- **Light/Dark theme** — FIFA Executive (light) and FIFA Night Stadium (dark) with persistent toggle
- **Responsive grid layout** — card-based UI with staggered animations, skeleton loading states
- **Toast notifications** — success/error/info feedback for all actions
- **Modal system** — confirmations, forms, detail views

---

## Folder Structure

```
fifa-scoring-system/
├── README.md
├── docker-compose.yml          ← Docker Compose (API + PostgreSQL)
├── Dockerfile                  ← Backend container image
│
├── backend/
│   ├── app/
│   │   ├── main.py             ← FastAPI entry point
│   │   ├── config.py           ← Settings from environment
│   │   ├── api/                ← HTTP route handlers
│   │   │   ├── auth_routes.py        ← Register, login, profile
│   │   │   ├── team_routes.py        ← Teams CRUD, CSV/Excel upload
│   │   │   ├── prediction_routes.py  ← Prediction submission
│   │   │   ├── result_routes.py      ← Actual result ingestion
│   │   │   ├── scoring_routes.py     ← Score calculation triggers
│   │   │   ├── leaderboard_routes.py ← Leaderboard calculation
│   │   │   ├── health_routes.py      ← Health check
│   │   │   └── deps.py              ← Auth dependency injection
│   │   ├── schemas/            ← Pydantic v2 validation models
│   │   ├── models/             ← SQLAlchemy ORM models
│   │   │   ├── user.py, team.py, team_member.py
│   │   │   ├── match.py, prediction.py, actual_result.py
│   │   │   ├── score.py, evaluation.py, leaderboard.py
│   │   │   └── enums.py
│   │   ├── services/           ← Business logic orchestration
│   │   ├── scoring_engine/     ← Pure scoring calculations
│   │   │   ├── base_score/     ← Winner, scoreline, probability, player
│   │   │   ├── multiplier/     ← Ranking & grade assignment
│   │   │   ├── normalization/  ← Phase 1 normalizer
│   │   │   ├── technical_evaluation/
│   │   │   └── presentation_evaluation/
│   │   ├── auth/               ← JWT token creation/validation
│   │   ├── database/           ← Connection, session, Base
│   │   ├── exceptions/         ← Custom exception classes + handlers
│   │   └── utils/              ← Email validator, team name utils
│   ├── alembic/                ← Database migrations
│   ├── seed.py                 ← Default organizer + teams + matches
│   ├── requirements.txt
│   └── tests/                  ← pytest suite (15 test files)
│
├── frontend/
│   ├── index.html              ← SPA entry point
│   ├── login.html, register.html
│   ├── css/                    ← style.css, components.css, themes.css
│   ├── js/
│   │   ├── app.js              ← Router, module init
│   │   ├── api.js              ← HTTP client + service layer
│   │   ├── auth.js             ← Auth utilities
│   │   ├── theme.js            ← Light/Dark toggle
│   │   ├── data/mockData.js    ← Demo/mock data
│   │   └── features/           ← 10 feature modules
│   │       ├── dashboard.js, team-dashboard.js
│   │       ├── teams.js, matches.js, predictions.js
│   │       ├── scoring.js, leaderboard.js, analytics.js
│   │       ├── technical.js, presentation.js
│   └── docs/                   ← Frontend documentation
│
└── docs/                       ← Backend/project documentation
    ├── TECHNICAL_DOCUMENTATION.md
    ├── TEST_PLAN.md
    ├── features/               ← 10 feature specification docs
    ├── api/                    ← API endpoint docs
    ├── database/               ← Database design docs
    ├── architecture/           ← Architecture docs
    └── reviews/                ← FINAL_REVIEW.md
```

---

## Backend API Overview

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/auth/register` | POST | Register team leader account |
| `/api/v1/auth/login` | POST | Login, receive JWT |
| `/api/v1/auth/me` | GET | Current user profile |
| `/api/v1/teams` | GET | List all teams |
| `/api/v1/teams/upload-members-csv` | POST | Upload CSV/Excel roster |
| `/api/v1/teams/my-team` | GET/PUT | View/update own team |
| `/api/v1/teams/my-team/members` | POST | Add team member |
| `/api/v1/teams/my-team/members/{id}` | DELETE | Remove team member |
| `/api/v1/teams/{team_id}/members` | GET | List team members |
| `/api/v1/predictions` | POST | Submit prediction |
| `/api/v1/actual-results` | POST | Enter match result |
| `/api/v1/calculate-match-score` | POST | Trigger match scoring |
| `/api/v1/technical-score` | POST | Submit technical evaluation |
| `/api/v1/presentation-score` | POST | Submit presentation scores |
| `/api/v1/leaderboard/calculate` | POST | Generate leaderboard |
| `/api/v1/upload-window` | GET/PUT | Manage model upload window |
| `/api/v1/teams/my-team/model` | POST/GET | Upload/view team model |
| `/api/v1/admin/models` | GET | List all submitted models |
| `/api/v1/admin/scoring-config` | GET/PUT | Manage scoring configuration |
| `/api/v1/health` | GET | Health check |

Interactive Swagger docs at `http://localhost:8000/docs`.

---

## Frontend Overview

The frontend is a **vanilla JavaScript SPA** with client-side routing. It communicates with the backend REST API via a centralized HTTP client (`api.js`). All 10 feature pages are registered with a hash-based Router in `app.js`.

**Routes:**
- `#/dashboard` — Organizer Dashboard (stat cards, leaderboard, quick actions)
- `#/team-dashboard` — Team Leader Dashboard (profile, members, scores)
- `#/teams` / `#/org-teams` — Team management with CSV/Excel upload
- `#/matches` — Match list, prediction submission, result entry
- `#/predictions` — Predictions log with filters
- `#/scoring` — Scoring engine with per-team breakdown cards
- `#/leaderboard` — Full ranked leaderboard with phase scores
- `#/analytics` — Charts: progression, phase contribution, dimension profile
- `#/technical` — Technical evaluation form (committee scoring)
- `#/presentation` — Presentation evaluation form with ranked results
- `#/scoring-config` — Advanced scoring rule parameters tuning
- `#/model-submission` — Team leader prediction model upload interface
- `#/model-management` — Organizer-side hub for model downloads and window control

The frontend includes a **demo mode** (`DEMO_MODE = true`) that falls back to mock data when the backend is unavailable.

---

## Database Overview

The system uses **SQLAlchemy 2.0 ORM** with **Alembic** for migrations. Development/testing runs on SQLite; production uses PostgreSQL 16.

### Key Tables

| Table | Purpose |
|---|---|
| `users` | User accounts (organizers, team leaders) |
| `teams` | Team entries mapping fixed Team IDs to custom Team Names |
| `team_members` | Roster members (name, employee_id) |
| `matches` | Match schedule, freeze deadlines |
| `predictions` | Submitted predictions per team per match |
| `player_predictions` | Per-player prediction entries |
| `actual_results` | Actual match outcomes |
| `scores` | Computed base scores per dimension |
| `technical_evaluations` | Phase 2 committee scores |
| `presentation_evaluations` | Phase 3 peer scores |
| `leaderboard` | Final ranked leaderboard entries |

---

## How to Run

### Docker Compose (Recommended)

```bash
docker compose up --build
```

This starts:
- **API server** at `http://localhost:8000`
- **PostgreSQL 16** on port `5433`
- Swagger docs at `http://localhost:8000/docs`

### Backend (Local)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API is available at `http://127.0.0.1:8000/api/v1/` with Swagger at `http://127.0.0.1:8000/docs`.

### Frontend (Local)

Serve the `frontend/` directory with any static server:

```bash
cd frontend
python3 -m http.server 3000
```

Then open `http://localhost:3000` in a browser. The frontend connects to the backend at the URL configured in `js/api.js`.

### Database Seed

```bash
cd backend
python seed.py
```

Creates the default organizer account (if not already present), base teams, and sample matches.

### Run Tests

```bash
cd backend
python -m pytest
```

---

## Default Credentials

Seeded in `backend/seed.py`:

| Role | Username | Email | Password |
|---|---|---|---|
| **Organizer** | `admin` | `admin@fifa-scoring.com` | `admin123` |

Team leader accounts are created via the registration endpoint (`POST /api/v1/auth/register`).

---

## The Three-Phase Evaluation Model

```
Phase 1: AI Prediction Accuracy          → 60 marks  (Formula-driven, automated)
Phase 2: Technical Implementation        → 20 marks  (Committee scored)
Phase 3: Cross-Team Peer Presentation    → 20 marks  (Peer graded + multiplier)
─────────────────────────────────────────────────────────────────────────────
Total                                    → 100 marks
```

---

## Key Design Principles

- **Automated Scoring** — Phase 1 is fully formula-driven, no manual intervention
- **Immutable Predictions** — No updates after match freeze deadline
- **Reproducibility** — Every score computation is traceable and re-runnable
- **Separation of Concerns** — Evaluation logic decoupled from participant model code
- **Strict Input Contracts** — Schema violations result in rejection or score of 0

---

## Related Documentation

- [Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md) — Full system docs index
- [Test Plan](docs/TEST_PLAN.md) — Testing strategy and test cases
- [Backend Architecture](backend/BACKEND_ARCHITECTURE.md)
- [Frontend Architecture](frontend/docs/FRONTEND_ARCHITECTURE.md)
- [Deployment Guide](docs/architecture/DEPLOYMENT.md)
