# GOALGORITHM — GOALGORITHM Scoring System

Full-stack tournament scoring platform for evaluating AI match prediction teams. Organizers upload rosters, teams submit predictions, and the system automatically computes scores across three phases — producing a final leaderboard out of **100 marks**.

> This system does **not** build or train AI prediction models. It is the evaluation infrastructure that objectively measures how well each participating team's AI model performed.

---

## System Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Frontend (React SPA)                │
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
| **Frontend** | React 18 (SPA), Vite, React Router DOM, CSS3 custom properties, Light/Dark theme |
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
- **Phase 3: Presentation Evaluation** — Team presentation delivery, AI explanation, and Q&A. Evaluated across **multiple rounds** by an active panel of judges (scored /50 per round). Each round applies a Grade multiplier (A=3×, B=2×, C=1×). The total weighted score is combined and normalized to a **20-mark** scale `(total_weighted / 300) × 20`.

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
- **React Single Page Application** — Vite-powered SPA with `react-router-dom` for client-side routing
- **Organizer Dashboard** — Stat cards (teams, predictions, top score), leaderboard preview, recent teams list, quick action buttons
- **Team Leader Dashboard** — Profile management, member list, CSV-managed badge, limited metrics
- **Light/Dark Mode** — Modern GOALGORITHM themes with a persistent UI toggle natively in React
- **Responsive Grid Layout** — Card-based UI with staggered animations, robust empty states when data is absent, skeleton loading states
- **Robust Error Handling** — Catch blocks intercept API errors and display user-friendly contextual alerts

---

## Visibility & Access Control

The platform enforces strict role-based data isolation across both the FastAPI backend and React frontend.

**ORGANIZER:**
- Full system management access
- View all teams, match schedules, and rosters
- Unrestricted access to all prediction logs, score breakdowns, evaluations, and the comprehensive analytics dashboard
- Can download any team's uploaded model files
- Control model upload windows and scoring configurations

**TEAM_LEADER:**
- Manage only their own team's profile and roster
- Submit their own prediction models and match prediction JSONs
- **Restricted Scoring View:** Cannot see daily scores, evaluation breakdowns, match prediction metrics of competitors, or analytics
- Can only view their own team's overall final standing and total score
- View the general Match schedule to plan predictions

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
│   │   ├── api/                ← HTTP REST endpoints
│   │   ├── schemas/            ← Pydantic v2 validation models
│   │   ├── models/             ← SQLAlchemy ORM models
│   │   ├── services/           ← Business logic orchestration
│   │   ├── scoring_engine/     ← Pure scoring calculations
│   │   └── database/           ← Connection, session, Base
│   ├── alembic/                ← Database migrations
│   ├── seed.py                 ← Default organizer + teams + matches
│   ├── requirements.txt
│   └── tests/                  ← pytest suite
│
├── react-frontend/
│   ├── index.html              ← React SPA entry point
│   ├── vite.config.js          ← Vite build configuration
│   ├── package.json            ← NPM dependencies
│   ├── src/
│   │   ├── App.jsx             ← React App & Router provider
│   │   ├── api/                ← Axios instances & API service methods
│   │   ├── components/         ← Reusable UI components (Layout, Modals, Cards)
│   │   ├── contexts/           ← React Context providers (AuthContext)
│   │   ├── pages/              ← Page-level components matching routes
│   │   └── index.css           ← Global styles and CSS variables
└── docs/                       ← Backend/project documentation
    ├── TECHNICAL_DOCUMENTATION.md
    ├── TEST_PLAN.md
    ├── architecture/           ← Core system architecture docs
    └── api/                    ← API endpoint specifications
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
| `/api/v1/matches` | GET/POST | List/create matches |
| `/api/v1/matches/upload-csv` | POST | Upload matches CSV schedule |
| `/api/v1/predictions` | POST/GET | Submit/list predictions (JSON format) |
| `/api/v1/actual-results` | POST | Enter actual match result |
| `/api/v1/calculate-match-score` | POST | Trigger match scoring calculation |
| `/api/v1/technical-score` | POST | Submit technical evaluation |
| `/api/v1/presentation-score` | POST | Submit presentation scores |
| `/api/v1/leaderboard/calculate` | POST | Generate the final ranking leaderboard |
| `/api/v1/team-leader/model` | POST/GET | Upload/view team model files |
| `/api/v1/admin/models` | GET | Admin: list and download all submitted models |
| `/api/v1/admin/scoring-config` | GET/PUT | Manage advanced scoring configuration |

Interactive Swagger docs automatically available at `http://localhost:8000/docs`.

---

## Frontend Overview

The frontend is a **React Single Page Application** built via Vite, superseding the legacy HTML mockups. It communicates tightly with the PostgreSQL-driven backend via REST APIs and `axios`. No mock data is utilized in the production bundle; everything is rendered dynamically with robust empty-state fallbacks.

**Primary Routes:**
- `/dashboard` — Organizer hub (statistics, quick actions)
- `/team-dashboard` — Team Leader home (profile summary, status)
- `/matches` — Interactive match scheduling, prediction inputs (Form & JSON), and result logging
- `/predictions` — Predictions log viewing
- `/scoring` — The primary scoring engine trigger and results matrix
- `/leaderboard` — Aggregate standings out of 100 points
- `/analytics` — Graphical breakdowns of platform-wide trends
- `/technical` — Phase 2 committee evaluation form
- `/presentation` — Phase 3 peer presentation form
- `/submit-predictions` — Secure team file dropzone for `.pkl`, `.onnx`, etc.
- `/prediction-upload` — Organizer portal to retrieve downloaded models

---

## Database Overview

The system runs on **SQLAlchemy 2.0 ORM** with **PostgreSQL 16**.
Data flows seamlessly through a persistent Docker volume, preserving users, teams, predictions, evaluations, and uploaded model artifacts across container lifecycles.

### Scoring Data Flow Pipeline
1. **Team Submissions** — Teams submit match predictions and AI models via the frontend forms/JSON uploads.
2. **Result Entry** — Organizers input actual real-world results post-match.
3. **Scoring Engine** — The Organizer triggers `/api/v1/calculate-match-score`, evaluating predictions against actual outcomes using the defined base-score formula logic.
4. **Evaluations** — Organizers submit Phase 2 & 3 evaluation results.
5. **Leaderboard Compilation** — Phase 1, Phase 2, and Phase 3 are aggregated and normalized into the overarching `LeaderboardModel`.
6. **Analytics Rendering** — Frontend queries the final computed states from PostgreSQL to paint accurate analytics, graphs, and the rank-ordered standings.

---

## How to Run

### Production / Full Stack (Docker Compose)

```bash
docker compose up --build
```
This spawns:
- **FastAPI backend** on port `8000`
- **PostgreSQL 16 DB** on port `5433` (backed by volume persistence)
- **React Frontend SPA** automatically configured inside the environment

### Local Development

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**React Frontend:**
```bash
cd react-frontend
npm install
npm run dev
```

### Database Management
To seed the empty database with foundational `ORGANIZER` accounts and sample match data:
```bash
cd backend
python seed.py
```

### Run Tests
```bash
cd backend
python -m pytest
```

---

## The Three-Phase Evaluation Model

```
Phase 1: AI Prediction Accuracy          → 60 marks  (Automated calculation)
Phase 2: Technical Implementation        → 20 marks  (Committee scored)
Phase 3: Cross-Team Peer Presentation    → 20 marks  (Peer graded + multipliers)
─────────────────────────────────────────────────────────────────────────────
Total Maximum Available Final Score      → 100 marks
```

---

## Related Documentation

- [Technical Documentation Overview](docs/TECHNICAL_DOCUMENTATION.md)
- [System Architecture](docs/architecture/system-architecture.md)
- [React Migration Plan & Notes](docs/architecture/react_migration_plan.md)
- [Deployment Guide](docs/architecture/DEPLOYMENT.md)
