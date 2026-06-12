# GOALGORITHM — Complete Project Workflow

## What This Document Covers

A line-by-line walkthrough of every file in the project, what it does, and how data flows through the system from end to end. Start here if you want to understand the full codebase.

---

## Table of Contents

1. [The Big Picture](#1-the-big-picture)
2. [Setup & Startup Flow](#2-setup--startup-flow)
3. [Authentication & User Management](#3-authentication--user-management)
4. [Team Management & Roster Upload](#4-team-management--roster-upload)
5. [Match Predictions](#5-match-predictions)
6. [Actual Results](#6-actual-results)
7. [Scoring Engine (Phase 1)](#7-scoring-engine-phase-1)
8. [Technical Evaluation (Phase 2)](#8-technical-evaluation-phase-2)
9. [Presentation Evaluation (Phase 3)](#9-presentation-evaluation-phase-3)
10. [Leaderboard](#10-leaderboard)
11. [Frontend SPA](#11-frontend-spa)
12. [Testing](#12-testing)
13. [Documentation Map](#13-documentation-map)
14. [Root Files Reference](#14-root-files-reference)

---

## 1. The Big Picture

```
                     ┌──────────────────────┐
                     │  Organizer uploads    │
                     │  CSV/Excel roster     │
                     │  (EmployeeID, Name,   │
                     │   Group A-E)          │
                     └──────────┬───────────┘
                                │
                                ▼
                     ┌──────────────────────┐
                     │  5 Teams Created     │
                     │  Team A, B, C, D, E  │
                     │  Team Leaders register│
                     └──────────┬───────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
         ▼                      ▼                      ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Match #1         │  │ Match #2         │  │ ... 32 matches   │
│ Teams submit     │  │ Teams submit     │  │                  │
│ predictions      │  │ predictions      │  │                  │
│ Organizer enters │  │ Organizer enters │  │                  │
│ actual result    │  │ actual result    │  │                  │
└────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                     │                      │
         └─────────────────────┼──────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Scoring Engine      │
                    │  Per match:          │
                    │  Base Score (max 25) │
                    │  + Rank & Grade      │
                    │  + Multiplier        │
                    │  = Earned Points     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Phase 1 Normalizer  │
                    │  Cumulative earned   │
                    │  → Normalized /60    │
                    └──────────┬───────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Phase 2          │  │ Phase 3          │  │ Leaderboard      │
│ Committee scores │  │ Peer scores      │  │ Phase1+2+3       │
│ /20              │  │ → /20            │  │ = Final /100     │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## 2. Setup & Startup Flow

### What happens when you start the app

#### `Dockerfile`
Multi-stage build. Installs Python 3.12 dependencies from `requirements.txt`, copies the backend code, exposes port 8000, runs `uvicorn app.main:app`.

#### `docker-compose.yml`
Defines two services:
- **`fifa-scoring-api`** — builds from Dockerfile, maps port 8000, reads `backend/.env`
- **`postgres`** — PostgreSQL 16 Alpine, port 5433, healthcheck, persistent volume

#### `backend/requirements.txt`
All Python packages: FastAPI, uvicorn, SQLAlchemy, alembic, psycopg2-binary (PostgreSQL driver), passlib+bcrypt (password hashing), python-jose (JWT), python-multipart (file uploads), openpyxl+xlrd (Excel parsing), pytest+httpx (testing).

#### `backend/.env`
Environment variables: `DATABASE_URL` (defaults to SQLite for dev), `SECRET_KEY` for JWT signing, `ACCESS_TOKEN_EXPIRE_MINUTES` (default 60). See `.env.example` for all options.

#### `backend/app/config.py`
Uses Pydantic `BaseSettings` to load `.env`. Creates a `settings` singleton consumed by every other module: database URL, pool settings, secret key, token expiry, API prefix.

#### `backend/app/main.py`
The **entry point**. Creates the FastAPI app, registers CORS middleware (allows all origins for local dev), includes the master API router at `/api/v1`, registers error handlers. On startup, calls `Base.metadata.create_all(bind=engine)` to auto-create all tables.

**Dependency chain**: `main.py` → imports `app.api` (which imports all route modules) → imports `app.models` (which registers all ORM tables with `Base.metadata`) → imports `app.database.connection` (which creates the engine from `app.config.settings`).

#### `backend/app/database/connection.py`
Creates the SQLAlchemy `engine`. Uses `settings.database_url` — SQLite for dev (`fifa_dev.db`), PostgreSQL for production. Configures connection pooling (pool_size=5, max_overflow=10) and pool pre-ping.

#### `backend/app/database/base.py`
One line: `class Base(DeclarativeBase): pass`. Every ORM model inherits from this.

#### `backend/app/database/session.py`
Creates `SessionLocal = sessionmaker(bind=engine)`. The `get_db()` dependency generator yields a session per request, rolls back on error, closes in `finally`.

#### `backend/seed.py`
CLI script to populate the database. Creates:
- **Organizer user**: `admin@fifa-scoring.com` / `admin123`
- **5 teams**: Team A through Team E
- **3 sample matches**: Brazil vs Argentina, Germany vs France, England vs Portugal

Run it: `python seed.py` (or `python seed.py --force` to re-seed).

---

## 3. Authentication & User Management

### File-by-file flow

#### `backend/app/auth/auth_service.py`
Core auth functions:
- `hash_password(password)` — bcrypt hash via passlib
- `verify_password(plain, hash)` — compares plaintext against hash
- `create_access_token(data)` — creates JWT (HS256) with expiry from settings
- `decode_access_token(token)` — decodes and validates JWT, returns payload or None

#### `backend/app/auth/auth_bearer.py`
`JWTBearer` class — FastAPI dependency that extracts the Bearer token from the `Authorization` header, decodes it, and returns the payload. Returns 401 if missing/invalid, 403 if expired.

#### `backend/app/api/deps.py`
Shared FastAPI dependencies:
- `get_current_user()` — extracts JWT via `security` (the JWTBearer instance), fetches the `UserModel` from DB by user ID
- `get_current_organizer()` — same but checks `role == ORGANIZER`, raises 403 otherwise
- `get_current_team_leader()` — same but checks `role == TEAM_LEADER`
- `get_current_team()` — finds the team associated with the current user

#### `backend/app/api/auth_routes.py`
Three endpoints:
- `POST /auth/register` — validates email domain, creates `UserModel` + `TeamModel` (linking them), returns JWT
- `POST /auth/login` — finds user by email, verifies password, returns JWT + user info
- `GET /auth/me` — returns current user profile (protected)
- `GET /auth/users` — admin-only user list

#### `backend/app/models/user.py`
`UserModel` (table `users`): id (UUID PK), username (unique indexed), email (unique indexed), password_hash, role (UserRole enum), created_at, updated_at. Has a one-to-one `team` relationship.

#### `backend/app/models/enums.py`
All enum classes:
- `UserRole`: TEAM_LEADER, ORGANIZER
- `MatchStatus`: SCHEDULED, FROZEN, COMPLETED, RESULT_ENTERED, SCORED
- `PredictionStatus`: PENDING_VALIDATION, VALIDATED, INVALID, LATE
- `Grade`: A, B, C
- `Winner`: home, away, draw
- `FirstGoalTeam`: home, away, none

#### `backend/app/schemas/auth_schema.py`
Pydantic models for request/response: `RegisterRequest`, `LoginRequest`, `LoginResponse`, `UserInfo`, etc.

#### Frontend auth files

**`frontend/login.html`** — Standalone login page. Sends credentials to `POST /api/v1/auth/login` via `AuthService.login()`. On success, stores JWT + user in localStorage, redirects to `index.html`.

**`frontend/register.html`** — Standalone registration. Calls `POST /api/v1/auth/register`. Client-side email domain hint. Redirects on success.

**`frontend/js/auth.js`** — Client-side `Auth` object. Manages JWT in `localStorage` under `fifa_token`, user info under `fifa_user`. Methods: `login()`, `register()`, `logout()`, `isAuthenticated()`, `isOrganizer()`, `isTeamLeader()`. The `requireAuth()` function redirects to `login.html` if no token.

**`frontend/js/api.js`** — Central HTTP client. Every request auto-attaches the Bearer token. On 401 response, clears session and redirects to login. Exposes service objects: `AuthService`, `TeamService`, `LeaderboardService`, `PredictionService`, `ScoringService`.

---

## 4. Team Management & Roster Upload

### What this feature does

Organizers upload a CSV or Excel file containing employee data. The system parses it, extracts `Name`, `EmployeeID`, and `Group` columns, then assigns each person to Team A, B, C, D, or E based on the Group value. Teams are flagged as "CSV managed" to prevent manual edits from conflicting with the uploaded roster.

### File-by-file flow

#### `backend/app/api/team_routes.py` (lines 221-403)

**Constants & helpers:**
```python
GROUP_TO_TEAM = {'A': 'Team A', 'B': 'Team B', ...}  # line 221-227
_map_group_to_team(group_value)  # line 229-233 — uppercases, strips, looks up in dict
```

**Main upload route — `POST /teams/upload-members-csv` (line 236-403):**

1. **Auth check** (line 242) — only ORGANIZER role allowed
2. **File parsing** by extension:
   - `.csv` (line 252-265) — `csv.DictReader` reads UTF-8 decoded content, normalizes headers to lowercase with underscores
   - `.xlsx` (line 267-297) — `openpyxl.load_workbook(data_only=True)`, skips blank header rows, same header normalisation
   - `.xls` (line 299-334) — `xlrd.open_workbook`, same logic, float integers auto-converted
3. **Column validation** (line 341-348) — must have `Group` and `Name` columns
4. **Row processing** (line 353-393):
   - Maps Group value to team name via `_map_group_to_team()`
   - Unrecognised groups → row skipped
   - Empty Group/Name → row skipped
   - Existing team with manual members → 400 error (can't mix CSV + manual)
   - New team → created with `is_csv_managed = True`
5. **Persistence** (line 395-399):
   - Old members of affected teams deleted
   - New `TeamMemberModel` records inserted in batch
   - Single `db.commit()`

**Locked routes:**
- `POST /my-team/members` (line 93-116) — blocked if `is_csv_managed`
- `DELETE /my-team/members/{member_id}` (line 186-218) — blocked if `is_csv_managed`

#### `backend/app/models/team.py`
`TeamModel` (table `teams`): id, user_id (FK), name, name_normalized (auto-generated via `@validates`), code, team_leader_name, registered_at, is_active, **is_csv_managed** (Boolean, default false). Has `members` relationship to `TeamMemberModel`.

#### `backend/app/models/team_member.py`
`TeamMemberModel` (table `team_members`): id (UUID PK), team_id (FK → teams, CASCADE delete), name, **employee_id** (nullable), created_at.

#### `backend/app/schemas/team_schema.py`
Pydantic models: `TeamMemberCreate`, `TeamMemberResponse`, `TeamUpdate`, `TeamResponse` (includes `is_csv_managed` and members list).

#### `backend/app/utils/team_name_utils.py`
`normalize_team_name(name)` — lowercases, strips, removes spaces/underscores/hyphens. Used by `TeamModel` to auto-populate `name_normalized`.

#### Frontend files

**`frontend/js/features/teams.js`** — Organizer team management page:
- `org-teams` route: renders team cards with member counts, upload button
- `uploadMembersCsv(event)` (line 118-141): reads selected file, validates extension (`.csv`/`.xls`/`.xlsx`), wraps in `FormData`, calls `TeamService.uploadMembersCsv()`, shows toast on success/error, refreshes team list
- `showOrgTeamDetail(teamId)`: modal with member table showing Name + EmployeeID

**`frontend/js/features/team-dashboard.js`** — Team leader's view:
- Renders team profile, member list (with CSV-managed badge), add/remove member forms (blocked if CSV-managed)

**`frontend/members.csv` & `frontend/members.xlsx`** — Sample roster files for testing the upload.

#### `backend/alembic/versions/`
Migration history:
- `58877d976e6e_initial_schema.py` — creates initial tables
- `48d44333ee2f_add_users_team_members_and_team_fields.py` — adds users, team_members, is_csv_managed
- `7cc606d61ec5_add_name_normalized_drop_college_name.py` — adds name_normalized, employee_id, server_default for is_csv_managed

---

## 5. Match Predictions

### What this does

Team leaders submit structured JSON predictions for each match before the freeze deadline. The system validates the data, checks for duplicates, and stores it for scoring.

### File-by-file flow

#### `backend/app/schemas/prediction_schema.py`
Deeply nested Pydantic models:
- `PredictedScoreline` — home/goals >= 0
- `Probabilities` — 3 floats, each 0-100
- `MatchPrediction` — winner (enum), scoreline, probabilities, first_goal_team, goal_scorers, plus **field validators** enforcing business rules
- `PlayerPrediction` — per-player prediction
- `PredictionSubmission` — top-level: team_id, match_id, submission_id, idempotency_key, match_prediction, player_predictions. Has a `model_validator` that enforces the non-empty player list.

#### `backend/app/api/prediction_routes.py`
- `GET /predictions` — organizer sees all, team leader sees own team's
- `POST /predictions` — calls `PredictionService.save_prediction()`

#### `backend/app/services/prediction_service.py`
`PredictionService.save_prediction(db, payload)` — creates `PredictionModel` + `PlayerPredictionModel` records. The service layer handles duplicate checking.

#### `backend/app/models/prediction.py`
Two models:
- `PredictionModel` (table `predictions`): id (UUID PK), team_id FK, match_id FK, submission_id, idempotency_key, status (PredictionStatus enum), predicted_winner, probabilities (JSON), scoreline fields, goal_scorers (JSON), raw_payload (JSON), submitted_at. Has `player_predictions` relationship (cascade delete).
- `PlayerPredictionModel` (table `player_predictions`): id, prediction_id FK, player_id, player_name, predicted_goals, is_captain.

The `raw_payload` column stores the entire original JSON — enabling audit/replay of every submission.

#### `backend/app/services/result_service.py`
`ResultService.save_actual_result(db, payload)` — creates `ActualResultModel` + `PlayerActualModel`. This is the ground truth that scoring compares predictions against.

#### `backend/app/models/actual_result.py`
Two models:
- `ActualResultModel` (table `actual_results`): id (UUID PK), match_id (unique), actual_winner (Winner enum), actual_home_goals, actual_away_goals, goal_scorers (JSON), entered_at
- `PlayerActualModel` (table `player_actuals`): id, actual_result_id FK, player_id, player_name, actual_goals

#### `backend/app/schemas/actual_result_schema.py`
`ActualResultSubmission` — validates match_id, actual_winner, final_score (home/away goals >= 0), goal_scorers, player_results.

#### Frontend files

**`frontend/js/features/matches.js`** — Match list and prediction submission:
- Renders match cards in a grid with status badges (scheduled/frozen/completed/scored)
- `showMatchDetail(matchId)` — opens a modal with match info and action buttons
- `showSubmitPredictionModal(matchId)` — prediction form: winner dropdown, home/away goal inputs, probability sliders, first goal selector, goal scorer fields, BTTS slider. On submit, constructs prediction payload and calls `PredictionService.submit()`.
- `showAddResultModal()` — organizer-only form for entering actual match results

**`frontend/js/features/predictions.js`** — Predictions log table:
- Fetches all predictions, joins with teams to resolve team names
- Renders table: Team, Match, Winner, Scoreline, Status, Submitted
- Filterable by match ID and status
- `showPredDetail(id)` — modal with full prediction details, probabilities, goal scorers

---

## 6. Actual Results

### What this does

After a match concludes, the organizer enters the actual scoreline and player goal data. This becomes the ground truth for all scoring calculations. Only one result per match (enforced by unique `match_id`).

### File-by-file flow

#### `backend/app/api/result_routes.py`
- `POST /actual-results` — organizer submits result via `ResultService.save_actual_result()`

#### `backend/app/services/result_service.py`
Creates `ActualResultModel` + list of `PlayerActualModel` records. The route handler checks for existing results by `match_id` (duplicate check).

---

## 7. Scoring Engine (Phase 1)

### What this does

For each completed match, compares every team's submitted prediction against the actual result. Computes scores across four dimensions, ranks teams, assigns grades/multipliers, and normalizes the cumulative score.

### File-by-file flow

#### `backend/app/scoring_engine/base_score/`
All pure functions — no I/O, no database, no HTTP. Takes data in, returns data out.

**`winner_score.py`**: `calculate_winner_score(predicted, actual)`
- 5 points if predicted winner matches actual winner
- 0 otherwise

**`scoreline_score.py`**: `calculate_scoreline_score(predicted, actual)`
- 10 points for exact scoreline match
- 5 points for correct margin + direction
- 0 otherwise

**`probability_score.py`**: `calculate_probability_score(predicted, actual)`
- 5 points if ALL 5 probabilities are within 15% of actual
- 0 if any one is outside the 15% threshold
- Checks: home_win, draw, away_win, home_clean_sheet, away_clean_sheet

**`player_score.py`**: `calculate_player_score(predicted_players, actual_players)`
- For each predicted player: exact goal match = 5, within 1 = 2, else 0
- Averages across players: avg >= 4.0 → 5 pts, avg >= 2.0 → 2 pts, else 0

**`base_score_calculator.py`**: `calculate_base_score(prediction, actual_result)`
- Sums all 4 dimension scores
- Capped at `MAX_BASE_SCORE = 25`
- Returns: `{team_id, match_id, breakdown: {winner, scoreline, probability, player}, base_score}`

#### `backend/app/scoring_engine/multiplier/`

**`ranking_engine.py`**: `rank_teams(team_scores)`
- Sorts teams by base_score descending
- Assigns dense ranks (ties share same rank)
- Returns: `[{rank, team_id, base_score}, ...]`

**`multiplier_calculator.py`**: `assign_grades(ranked_teams)`
- Top unique score → Grade A (3× multiplier)
- Bottom unique score → Grade C (1× multiplier)
- All middle/ties → Grade B (2× multiplier)
- Computes `earned_points = base_score × multiplier`
- Max earned points per match = 25 × 3 = 75

#### `backend/app/scoring_engine/normalization/`

**`phase1_normalizer.py`**: `calculate_phase1_score(total_earned, matches_played)`
- Formula: `(total_earned / (matches × 75)) × 60`
- Capped at max = 60
- Raises `NormalizationError` on negative or impossible values

#### `backend/app/services/scoring_service.py`
The orchestration layer. `ScoringService` methods:
- `calculate_and_save_match_score()` — fetches prediction + actual, calls `calculate_base_score()`, calls `rank_teams()` + `assign_grades()` for all 5 teams, saves `ScoreModel` records
- `compute_and_save_leaderboard()` — calls `calculate_leaderboard()`, saves `LeaderboardModel` records

#### `backend/app/api/scoring_routes.py`
- `POST /calculate-match-score` — triggers scoring for a match
- `POST /technical-score` — Phase 2
- `POST /presentation-score` — Phase 3

#### `backend/app/models/score.py`
Three models:
- `ScoreModel` (table `scores`): id, team_id FK, match_id FK, winner_points, scoreline_points, probability_points, player_points, base_score, match_rank, grade, multiplier, earned_points, computed_at. Unique on `(team_id, match_id)`.
- `CumulativePhaseScoreModel` (table `cumulative_phase_scores`): team_id, total_earned, matches_played, phase1_score.

#### `backend/app/models/leaderboard.py`
`LeaderboardModel` (table `leaderboard`): id, team_id (unique), rank, phase1_score, technical_score, presentation_score, final_score, is_final, generated_at.

---

## 8. Technical Evaluation (Phase 2)

### What this does

A committee scores each team on 4 technical sub-dimensions: Code Quality, Backend Quality, Teamwork, AI Explanation. Each scored 0-5. Summed to a max of 20 marks.

### File-by-file flow

#### `backend/app/scoring_engine/technical_evaluation/technical_score.py`
Pure function: `calculate_technical_score(code, backend, teamwork, ai)`
- Sums 4 inputs (each validated 0-5)
- Raises `TechnicalScoreError` on invalid input

#### `backend/app/schemas/technical_evaluation_schema.py`
`TechnicalEvaluation` — validates `team_id` + 4 integer fields (0-5).

#### `backend/app/api/scoring_routes.py` (technical-score endpoint)
Calls `ScoringService.calculate_and_save_technical_score()`.

#### `backend/app/models/evaluation.py`
`TechnicalEvaluationModel` (table `technical_evaluations`): id (UUID PK), team_id (unique), code_quality, backend_quality, teamwork, ai_explanation, total_score, submitted_at.

#### `frontend/js/features/technical.js`
Editable score entry table:
- 5 rows (teams A-E), 4 input columns (code, backend, teamwork, ai)
- Live total per team auto-calculated
- Submit button sends all 5 evaluations via `ScoringService.calculateTechnical()`

---

## 9. Presentation Evaluation (Phase 3)

### What this does

Peer review: each team rates others on AI Explanation (0-20), Q&A (0-15), and Delivery (0-15). Raw scores are summed (/50), ranked, graded (A/B/C), multiplied (3×/2×/1×), and normalized to /20.

### File-by-file flow

#### `backend/app/scoring_engine/presentation_evaluation/presentation_score.py`
Pure function: `calculate_presentation_scores(evaluations)`
- Sums 3 sub-scores per team → raw score /50
- Ranks teams by raw score
- Assigns grades: A (3×) for top rank, C (1×) for bottom, B (2×) for middle
- Normalizes: `(raw × multiplier) / 150 × 20` (max 20)
- Raises `PresentationScoreError` on invalid input

#### `backend/app/schemas/presentation_schema.py`
`PresentationEvaluation` — validates `team_id` + 3 integer fields (0-20, 0-15, 0-15).

#### `backend/app/models/evaluation.py`
`PresentationEvaluationModel` (table `presentation_evaluations`): id, team_id (unique), ai_explanation_score, qa_score, delivery_score, raw_score, rank, grade, multiplier, presentation_score, submitted_at.

#### `frontend/js/features/presentation.js`
Score entry table + results:
- 5 rows, 3 input columns (AI Explanation, Q&A, Delivery)
- Live raw total
- Post-submit: ranked results table with grade, multiplier, final score

---

## 10. Leaderboard

### What this does

Aggregates Phase 1 (normalized /60), Phase 2 (/20), and Phase 3 (/20) into a final grand total out of 100 marks. Sorts and tie-breaks to produce the final ranking.

### File-by-file flow

#### `backend/app/services/leaderboard_service.py`
Pure function: `calculate_leaderboard(scores)`
- Validates each score range (phase1: 0-60, tech: 0-20, pres: 0-20)
- Computes `final_score = phase1 + technical + presentation`
- Sorts descending by final_score
- Tie-breaking: ai_accuracy → technical → presentation
- Raises `LeaderboardError` on invalid input

#### `backend/app/api/leaderboard_routes.py`
- `POST /leaderboard/calculate` — organizer triggers computation
- `GET /leaderboard` — returns ranked entries

#### `backend/app/models/leaderboard.py`
`LeaderboardModel` (table `leaderboard`): id (UUID PK), team_id (unique), rank, phase1_score, technical_score, presentation_score, final_score, is_final, generated_at.

#### `frontend/js/features/leaderboard.js`
- Fetches leaderboard + teams
- Resolves team names via `teams.find()`
- Renders ranked table: Rank, Team, Phase 1, Technical, Presentation, Final Score
- Top 3 rows color-coded
- Organizer "Calculate" button triggers `POST /leaderboard/calculate`
- Animated counter stats cards (Total Teams, Top Score, Top Team)

#### `frontend/js/features/dashboard.js`
Organizer dashboard includes a leaderboard preview (top 5).

---

## 11. Frontend SPA

### Architecture

The frontend is a **vanilla JavaScript Single Page Application** — no framework (React, Vue, etc.). Everything is hand-built with:
- Hash-based routing (`window.location.hash`)
- DOM manipulation via `innerHTML`
- CSS custom properties for theming
- `fetch()` API for HTTP

### Key files

#### `frontend/index.html`
The SPA shell. Contains:
- **Sidebar navigation** — two sets of links: organizer (`#/dashboard`, `#/teams`, `#/matches`, `#/predictions`, `#/scoring`, `#/technical`, `#/presentation`, `#/leaderboard`, `#/analytics`) and team leader (`#/team-dashboard`, `#/matches`, `#/predictions`, `#/leaderboard`)
- **Top navbar** — GOALGORITHM branding, theme toggle, user menu with role badge, breadcrumb
- **`<div id="page-content">`** — all dynamic content renders here
- Script tags loading all JS files in order: `api.js`, `auth.js`, `theme.js`, `data/mockData.js`, then all 10 feature modules, then `app.js` (last, after Router registration scripts)

#### `frontend/js/app.js`
Core application controller:
- **`Router`** object — `register('route-name', asyncFn)` maps hash routes to page renderers. `navigate('route-name')` programmatically navigates. Listens to `hashchange` event.
- **`Utils`** — helpers: `skeletonCards(n)`, `teamBadge(name, size)`, `rankBadge(rank)`, `gradeBadge(grade)`, `scoreColor(value, max)`, `fmt1(num)`, `capitalize(str)`, `staggerChildren(selector)`, `predictionPick(home, away, winner)`, `animateCounters(container)`
- Initializes theme from `ThemeManager`
- Checks auth on load, shows/hides nav sections based on role

#### `frontend/js/theme.js`
`ThemeManager` — reads theme from `localStorage` (key: `fifa_theme`), falls back to `prefers-color-scheme`. Applies by setting `data-theme` attribute on `<html>`. Supports dark (FIFA Night Stadium) and light (FIFA Executive).

#### `frontend/js/data/mockData.js`
`DEMO_MODE` flag + `MockData` object. When the backend returns empty results (e.g. during development), the frontend falls back to this mock data. Contains:
- 5 teams with members
- 4 sample matches with varied statuses
- 8 sample predictions across 2 matches
- 5 leaderboard entries

#### `frontend/css/style.css`
236 lines. Imports `themes.css` and `components.css`. Base reset, stadium-themed background, app layout.

#### `frontend/css/themes.css`
~150 CSS custom properties defining the design system:
- **Dark theme** (`:root`): dark backgrounds, vibrant accent colors, glow effects
- **Light theme** (`[data-theme="light"]`): light backgrounds, softer colors, shadow-based depth
- Covers: colors, typography (4 font families), spacing scale, border radii, shadows, transitions, z-index

#### `frontend/css/components.css`
1384 lines of reusable component styles:
- Navbar, sidebar (collapsible with transition)
- Buttons (primary, secondary, ghost, danger, icon, sizes)
- Cards (stat, match, modal, score-breakdown)
- Tables (score-header, sortable, responsive)
- Forms (inputs, selects, file upload, validation states)
- Badges (success, error, warning, info, grade A/B/C)
- Alerts (success, error, warning, info)
- Modals (overlay, content, header, footer)
- Tooltips
- Skeleton loaders (card, table)
- Grid layouts (2-col, 3-col, 4-col)
- Empty states
- Animations (fadeIn, fadeInUp, slideUp, score-digit flip)
- Responsive breakpoints
- Utility classes

### Feature files (10 total)

Each registers with `Router.register()`:

| Route | File | Purpose |
|---|---|---|
| `#/dashboard` | `dashboard.js` | Organizer: stat cards, leaderboard preview, recent teams, quick actions |
| `#/team-dashboard` | `team-dashboard.js` | Team leader: profile, members, predictions tab, scores |
| `#/teams` / `#/org-teams` | `teams.js` | Team cards, CSV/Excel upload, member detail modal |
| `#/matches` | `matches.js` | Match grid, prediction form, result entry, score calc |
| `#/predictions` | `predictions.js` | Predictions log table with filters and detail modal |
| `#/scoring` | `scoring.js` | Per-team score breakdown cards, normalization formula |
| `#/leaderboard` | `leaderboard.js` | Ranked table, phase breakdown, calc trigger |
| `#/analytics` | `analytics.js` | Charts: line, donut, radar, bar comparison |
| `#/technical` | `technical.js` | Editable scoring table for Phase 2 |
| `#/presentation` | `presentation.js` | Editable form + results table for Phase 3 |

---

## 12. Testing

### Strategy

The test suite follows a layered approach: pure functions first (scoring engine), then schema validation, then API integration, then full end-to-end flow. All tests use SQLite in-memory (overridden via `os.environ` in `conftest.py`).

### File-by-file

#### `backend/tests/conftest.py`
Shared fixtures for all tests. Sets environment variables (DATABASE_URL → temp SQLite, SECRET_KEY), creates tables, seeds test data:
- 5 team fixtures: `team_a` through `team_e`
- 1 organizer user + 5 team leader users
- 2 sample matches
- Auth token fixtures (`organizer_headers`, `team_leader_headers`)
- Overrides `get_db` dependency to use the test session

#### `backend/tests/test_schemas.py`
Validates every Pydantic schema: valid prediction passes, invalid fields fail (wrong winner enum, negative goals, probability > 100, empty player list). Tests actual result validation and evaluation bounds.

#### `backend/tests/test_base_score.py`
Tests each dimension in isolation + the aggregator:
- `test_winner_score`: correct = 5, wrong = 0
- `test_scoreline_score`: exact = 10, margin = 5, wrong = 0
- `test_probability_score`: all within 15% = 5, any outside = 0
- `test_player_score`: exact → 5, close → 2, wrong → 0; averaging thresholds
- `test_calculate_base_score`: full integration with fixture data

#### `backend/tests/test_multiplier.py`
Tests ranking engine + grade assignment:
- 5 distinct scores, ties at top/middle/bottom, all tied
- A = 3×, B = 2×, C = 1× assignment logic

#### `backend/tests/test_normalization.py`
Tests phase 1 normalizer: max 60, zero, partial, single match, error cases (negative, over-max).

#### `backend/tests/test_technical_score.py`
Tests technical scoring: perfect = 20, partial, zero, error cases.

#### `backend/tests/test_presentation_score.py`
Tests presentation scoring: raw sum, ranking, grade assignment, normalization to 20, tie handling.

#### `backend/tests/test_leaderboard.py`
Tests leaderboard calculation: correct total (max 100), rank order, tiebreaking by ai_accuracy, empty input, out-of-range errors.

#### `backend/tests/test_api.py`
Integration tests for every API endpoint:
- Auth: register (success, duplicate username, team already taken), login, unauthorized access
- Predictions: list, submit
- Results: unauthorized, authorized
- Scoring: calculate match score, technical score, presentation score
- Leaderboard: calculate
- Teams: get my team, list teams, add member (invalid email), CSV upload + locks, XLSX upload

#### `backend/tests/test_full_competition_flow.py`
End-to-end competition simulation. Loads fixture predictions for 5 teams, validates schemas, computes base scores, ranks, assigns grades, normalizes Phase 1, calculates technical and presentation scores, builds final leaderboard. Every intermediate value is asserted.

#### `backend/tests/fixtures/`
Six JSON fixture files used by tests:
- `valid_prediction.json` — complete valid prediction payload
- `invalid_prediction.json` — payload with every possible validation error
- `actual_result.json` — sample match result
- `five_team_predictions.json` — 5 diverse predictions for match 1 (Team A predicts exact result, Team E predicts complete miss)
- `technical_scores.json` — 5 technical evaluations
- `presentation_scores.json` — 5 presentation evaluations

---

## 13. Documentation Map

### Root-level

| File | Content |
|---|---|
| `README.md` | Project overview, architecture, tech stack, features, how to run |
| `WORKFLOW.md` | This file — complete project walkthrough |

### `docs/` directory (30+ files)

| Subdirectory | Content |
|---|---|
| `TECHNICAL_DOCUMENTATION.md` | Main index linking all docs |
| `TEST_PLAN.md` | Testing strategy |
| `features/` (10 files) | Feature specs: prediction, results, scoring engine, ranking, normalization, technical, presentation, leaderboard, team management, Excel/CSV upload |
| `api/` (6 files) | API endpoint docs: prediction, scoring, evaluation, leaderboard, team management, error responses |
| `database/` (4 files) | DB design: overview, schema, feature mapping, PostgreSQL plan |
| `architecture/` (7 files) | Architecture docs: system, prediction, scoring, leaderboard, database, error handling, deployment |
| `reviews/` (1 file) | Final architecture review |

### `backend/` docs

| File | Content |
|---|---|
| `BACKEND_ARCHITECTURE.md` | Backend layered architecture |
| `app/api/README.md` | API layer responsibilities |
| `app/database/README.md` | Database layer responsibilities |
| `app/models/README.md` | Model layer responsibilities |
| `app/scoring_engine/README.md` | Scoring engine responsibilities |
| `app/schemas/README.md` | Schema layer responsibilities |
| `app/services/README.md` | Service layer responsibilities |
| `app/utils/README.md` | Utils layer responsibilities |
| `tests/README.md` | Test suite structure |

### `frontend/docs/` directory (14 files)

| File | Content |
|---|---|
| `FRONTEND_ARCHITECTURE.md` | Planned React architecture |
| `COMPONENT_GUIDELINES.md` | UI component specs |
| `DESIGN_SYSTEM.md` | Visual identity, design principles |
| `DESIGN_TOKENS.md` | CSS custom property values (both themes) |
| `VALIDATION_REPORT.md` | Docs quality review |
| `features/` (9 files) | Frontend feature specs: dashboard, predictions, matches, scoring, leaderboard, technical, presentation, analytics, validation report |

---

## 14. Root Files Reference

### `Dockerfile`
Multi-stage build. Stage 1: `python:3.12-slim`, copies `requirements.txt`, runs `pip install`. Stage 2: copies installed packages + app code, exposes 8000, runs `uvicorn app.main:app --host 0.0.0.0 --port 8000`.

### `docker-compose.yml`
Two services:
- **`fifa-scoring-api`**: builds `.`, port 8000:8000, env_file `./backend/.env`, depends_on postgres (healthcheck)
- **`postgres`**: image `postgres:16-alpine`, port 5433:5432, env_file, persistent volume `postgres_data`

### `backend/BACKEND_ARCHITECTURE.md`
Architecture planning document describing the layered design: API → Schema Validation → Service → Domain (scoring engine) → Repository → Database. Started as a skeleton during initial planning; now reflects the implemented code structure.

### `backend/.env.example`
Documents all environment variables:
- `APP_NAME`, `APP_ENV`, `DEBUG`, `API_PREFIX`
- `DATABASE_URL` (PostgreSQL connection string)
- `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`, `DB_POOL_PRE_PING`, `DB_POOL_RECYCLE`
- `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`

### `backend/alembic.ini`
Alembic configuration pointing to `alembic/` directory, with SQLAlchemy URL derived from `app.config.settings`.

### `backend/alembic/env.py`
Alembic environment. Imports `Base.metadata` from `app.database.base` (which imports all models). Configures offline and online migration modes.
