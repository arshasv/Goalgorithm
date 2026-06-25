# GOALGORITHM - Complete Technical Documentation & Workflow

## 1. Project Overview

### What this project does
GOALGORITHM is an AI Challenge Scoring Platform designed specifically for evaluating predictive models in football (FIFA). It allows organizers to manage competitions where data science teams build models to predict match outcomes, scorelines, player performances, and other match events. 

### Purpose of the system
The system's primary purpose is to collect prediction data from participating teams, fetch actual real-world match results (or manual entry), automatically evaluate the predictions using a complex mathematical scoring engine, and generate a competitive leaderboard based on prediction accuracy (Phase 1), technical architecture evaluation (Phase 2), and presentation evaluation (Phase 3).

### Main Features
- **Team & Match Management**: Organizers can manage teams, schedules, and configure scoring rules.
- **Prediction Submission**: Team Leaders upload match predictions via JSON payloads.
- **Automated Scoring Engine**: A deterministic engine that calculates base points for winner, scoreline, goalscorers, and applies ranking multipliers.
- **Evaluations**: Organizers and judges input technical marks and presentation grades.
- **Analytics & Reports**: Visual dashboards and granular journey reports breaking down how a team's score transformed from raw to normalized leaderboard contributions.
- **Leaderboard**: Real-time ranking combining all 3 phases into a score out of 100.

### Users/Roles Involved
1. **ORGANIZER**: Complete access to system configuration, match creation, syncing actual results, inputting evaluations, and viewing full analytics.
2. **TEAM LEADER**: Restricted access to view matches, submit their own predictions, view their own evaluation scores, and observe the final leaderboard.

### Complete High-Level Workflow
1. Organizer configures scoring weights and matches.
2. Teams are onboarded and assigned to Team Leaders.
3. Before match kickoff (freeze deadline), Team Leaders submit prediction payloads.
4. Match finishes; Organizer syncs Actual Results via Football API.
5. Scoring Engine evaluates predictions against Actual Results.
6. Organizer/Judges input Technical and Presentation evaluations.
7. Backend normalizes all scores and aggregates them.
8. Leaderboard is updated, and Analytics/Reports are generated for review.

---

## 2. Technology Stack Analysis

### Frontend Stack
- **React.js (v18)**: Core UI framework. Used for building single-page applications efficiently.
- **Vite**: Build tool and development server. Used for blazing fast HMR (Hot Module Replacement) and optimized production builds.
- **React Router**: Client-side routing (`src/App.jsx`). Maps URLs to components.
- **Recharts**: SVG charting library used extensively in Analytics and Reports for data visualization.
- **Axios**: HTTP client used in `src/api` service classes to communicate with the backend.

### Backend Stack
- **Python 3.12**: Core programming language.
- **FastAPI**: Asynchronous web framework for APIs. Used for high-performance route handling and automatic OpenAPI documentation.
- **SQLAlchemy 2.0**: Object Relational Mapper (ORM). Maps Python classes to PostgreSQL tables.
- **Uvicorn**: ASGI server used to run the FastAPI application.

### Database
- **PostgreSQL 16**: Relational database used for robust data integrity, JSON field support (for raw payloads/scorers), and foreign key constraints.

### Authentication System
- **JWT (JSON Web Tokens)**: Stateless authentication. The frontend stores tokens and passes them in `Authorization: Bearer <token>` headers. Backend uses `passlib` and `jose` for hashing and token verification.

### External Services
- **Football API (API-Sports / Sportmonks)**: Integrated via `FootballAPIService` to sync real-world fixtures and match results automatically.

### DevOps Tools
- **Docker & Docker Compose**: Containerizes the Postgres DB, FastAPI backend, and React frontend into isolated environments for seamless local development.

---

## 3. Complete Project Architecture

The architecture follows a modular, layered approach, strongly separating concerns.

### Backend Folder Structure (`backend/app/`)
- `api/`: Controllers. Defines FastAPI `APIRouter` endpoints. Passes requests to Services.
- `core/`: Application settings, security, and CORS middleware configurations.
- `database/`: Session makers, connection pools, and Base declarative mapping.
- `models/`: SQLAlchemy ORM definitions (`MatchModel`, `TeamModel`, etc.).
- `repositories/`: Database abstraction layer. Contains the SQL queries and CRUD logic.
- `schemas/`: Pydantic models (e.g., `MatchCreate`). Used for request validation and response serialization.
- `services/`: Core Business Logic layer. Where controllers pass data to be processed.
- `scoring_engine/`: Pure deterministic mathematical calculation layer. Completely isolated from the DB/Network.

### Frontend Folder Structure (`react-frontend/src/`)
- `api/`: Axios classes wrapping API endpoints (e.g., `PredictionService.js`).
- `components/`: Reusable UI elements (Modals, Charts, Forms).
- `contexts/`: React Context providers (`AuthContext.jsx` for global auth state).
- `pages/`: Route-level container components (`AnalyticsView.jsx`, `ReportsView.jsx`).

### Data Flow
`UI Interaction` → `Axios Call` → `FastAPI Router` → `Pydantic Validation` → `Service Logic` → `Repository (SQLAlchemy)` → `PostgreSQL` → `Response back down chain`.

---

## 4. Feature-by-Feature Deep Explanation

### Feature Name: Match Prediction Submission

#### Purpose
Allows Team Leaders to submit their AI models' prediction for an upcoming match before the deadline.

#### User Workflow
1. Team Leader navigates to "Matches".
2. Clicks "Predict" on a scheduled match.
3. Fills out a modal form with Winner, Goals, Probabilities, and Goal Scorers.
4. Clicks "Submit".
5. Success toast is displayed; match status updates to "Submitted".

#### Technical Workflow
**Frontend:**
- Component: `SubmitPredictionModal.jsx`.
- State: Managed via React `useState` for form fields.
- Validation: Client-side checks ensure probability sums equal 100.
- API Call: `PredictionService.submitPrediction()` sends POST to `/api/v1/predictions`.

**Backend:**
- Route: `POST /api/v1/predictions` handled in `api/prediction_routes.py`.
- Validation: Pydantic `PredictionCreate` schema verifies the payload shape.
- Service: `PredictionService.submit_prediction()`. Checks if match freeze deadline has passed. Sets status to `LATE` if missed.
- Repository: Saves to `PredictionModel` and maps child goal scorers to `PlayerPredictionModel`.

**Database:**
- Inserts row into `predictions` table.
- Inserts multiple rows into `player_predictions` table via cascade relations.

---

### Feature Name: Score Reporting & Transformation Analytics

#### Purpose
Demystifies the complex scoring logic for non-technical Organizers by visualizing how raw marks convert to leaderboard points.

#### User Workflow
1. Organizer navigates to "Reports".
2. Sees a list of teams with their "Final Score".
3. Clicks a team to expand the "Score Journey".
4. Views the flow: Original Score → Converted Score → Multiplier Applied → Leaderboard Contribution.

#### Technical Workflow
**Frontend:**
- Component: `ReportsView.jsx`.
- Lifecycle: `useEffect` calls `ReportService.getBreakdown()`.
- Logic: Deduplicates presentation rounds using JavaScript Maps. Renders visual SVG flowcharts and grouped bar charts.

**Backend:**
- Route: `GET /api/v1/reports/breakdown` in `api/report_routes.py`.
- Service: `ReportService.get_team_score_journey()`.
- Logic: Aggregates data from `ScoreModel` (Prediction), `TechnicalEvaluationModel`, and `PresentationEvaluationModel`. 
- DB: Joins across 5 different tables to build a unified dict.

---

## 5. API Documentation

### POST `/api/v1/predictions`
- **Purpose**: Submit a match prediction.
- **Request Body**: `PredictionCreate` (JSON containing team_id, match_id, winner, probabilities, scorelines).
- **Response Format**: `PredictionResponse` (JSON with UUID and submission status).
- **Auth Requirement**: Must be an authenticated Team Leader.
- **Controller**: `create_prediction` in `prediction_routes.py`.
- **Database Impact**: Inserts to `predictions` and `player_predictions`.

### POST `/api/v1/matches/{match_id}/sync`
- **Purpose**: Sync actual result for a match.
- **Request Body**: None (Triggered by ID).
- **Response**: Details of synced result.
- **Auth Requirement**: Must be an authenticated Organizer.
- **Service**: `MatchService.sync_results()`. Calls external `FootballAPIService`.
- **Database Impact**: Updates `matches` status to COMPLETED. Inserts into `actual_results`. Triggers automated scoring engine pipeline.

---

## 6. Authentication and Authorization Flow

### Flow
1. **Login**: User submits credentials to `/api/v1/auth/login`.
2. **Backend Validation**: `AuthService.authenticate_user()` verifies hashed password.
3. **Token Generation**: Creates a JWT signed with a secret key containing the user's role (ORGANIZER or TEAM_LEADER).
4. **Middleware Validation**: FastAPI `Depends(get_current_user)` intercepts protected routes, decodes the JWT, and rejects invalid/expired tokens (HTTP 401).
5. **Role-Based Access**: Specialized dependencies like `Depends(get_current_organizer)` explicitly verify the role payload in the JWT before allowing access (HTTP 403 Forbidden).

---

## 7. Database Documentation

### `matches` (MatchModel)
- **Purpose**: Holds fixture data.
- **Columns**: `id` (UUID), `match_number` (Int), `home_team_name` (String), `status` (Enum), `freeze_deadline` (DateTime).

### `predictions` (PredictionModel)
- **Purpose**: Stores team AI payload.
- **Columns**: `id`, `team_id`, `match_id`, `predicted_winner`, `home_win_probability`, etc.
- **Relationships**: `player_predictions` (1-to-many, Cascade Delete).

### `scores` (ScoreModel)
- **Purpose**: The output of the automated Scoring Engine.
- **Columns**: `id`, `team_id`, `match_id`, `base_score`, `multiplier`, `earned_points`.

### Complete Flow
`Match` ← `Prediction` → `Actual Result`. When Actual Result is synced, the engine compares Prediction vs Actual Result, outputting a `Score`. Scores are aggregated into `CumulativePhaseScoreModel` and mapped to the `LeaderboardModel`.

---

## 8. Backend Deep Dive

- **Startup Flow**: Uvicorn starts `main.py`. FastAPI app initializes, registers CORS middleware, includes API routers.
- **Routing System**: Modular routers (`team_routes`, `match_routes`) prefixed with `/api/v1`.
- **Dependency Injection**: SQLAlchemy `Session` is injected via `Depends(get_db)`. Repositories and Services are instantiated within route functions.
- **Error Handling**: `HTTPException` is raised manually in Services (e.g., 404 Match Not Found). Centralized exception handlers catch DB integrity errors.

---

## 9. Frontend Deep Dive

- **Application Startup**: `main.jsx` wraps `<App />` in `<AuthProvider>` and `BrowserRouter`.
- **State Management**: React Context (`AuthContext`) handles global session. Local component state (`useState`, `useEffect`) manages data fetching.
- **UI Rendering Flow**: 
  1. Component mounts.
  2. Renders Skeleton Loaders.
  3. `useEffect` triggers Axios GET.
  4. Response updates `useState`.
  5. React reconciles DOM and paints actual data.

---

## 10. Complete Request Lifecycle Example

**Trace: Deleting a Match**
1. **Browser**: Organizer clicks the delete bin icon on Match M116.
2. **Component**: `MatchesView.jsx` triggers `handleDeleteMatch()`.
3. **API Function**: Axios calls `DELETE /api/v1/matches/{id}`.
4. **Backend Route**: `delete_match` in `match_routes.py` receives request. Checks `get_current_organizer` token.
5. **Service**: `MatchService.delete_match(id)` is invoked.
6. **Database Query**: Service executes manual SQLAlchemy cascade deletes:
   - `DELETE FROM scores WHERE match_id = id`
   - `DELETE FROM player_predictions WHERE prediction_id IN (...)`
   - `DELETE FROM predictions WHERE match_id = id`
   - `DELETE FROM matches WHERE id = id`
7. **Response**: HTTP 204 No Content returned.
8. **Frontend Update**: Axios promise resolves, `loadData()` is re-called, updating the React state to remove the match from the UI.

---

## 11. Important Algorithms / Business Logic

### The Automated Scoring Engine
Located in `backend/app/scoring_engine/`.

**Base Score Calculation (`base_score_calculator.py`)**:
- Uses pure math. Evaluates `Winner` (correct = points), `Scoreline` (exact match = points), and `Probabilities` (using Brier Score or logarithmic loss transformations).
- `PlayerScore`: Awards points if predicted goalscorers match actual goalscorers.

**Multiplier Logic (`ranking_engine.py`)**:
- Teams are ranked based on their Base Score for that specific match.
- Top ranked teams receive a higher Grade Multiplier (e.g., Rank 1 = A = x3, Rank 2 = B = x2).
- `Base Score * Multiplier = Earned Points`.

**Normalization (`phase1_normalizer.py`)**:
- Earned Points across all matches are summed up and normalized linearly against a configurable Phase maximum (e.g., scaled out of 20 points for the final leaderboard).

---

## 12. Error Handling

- **Database Errors**: Catch `psycopg2.errors.ForeignKeyViolation` when attempting to delete data with active references. Handled in custom cleanup routines.
- **API Failures**: If the external Football API fails, `FootballAPIService` raises `FootballAPIError`, caught by the route and translated to HTTP 502 Bad Gateway.
- **Frontend Errors**: Axios interceptors catch 401 Unauthorized responses and trigger an auto-logout. Inline error messages map response strings directly to UI alert banners.

---

## 13. Testing Documentation

- **Framework**: `pytest` for backend API integration tests.
- **Structure**: Tests located in `backend/tests/`.
- **Database Setup**: Tests use an isolated SQLite in-memory DB or a dedicated test PostgreSQL container to ensure tests do not pollute production data.

---

## 14. Development Workflow

- **Local Setup**: 
  1. Clone repository.
  2. Create `.env` files based on `.env.example`.
  3. Run `docker compose up --build`.
- **Docker Workflow**: The `docker-compose.yml` mounts volumes so code changes in Python or React auto-reload instantly without rebuilding containers. Postgres is exposed on port `5433` locally.

---

## 15. Developer Notes

- **Caution Area**: **Database Deletions**. Because relationships between `Prediction` and `Match` are stored as string UUIDs (not strict SQLAlchemy foreign keys in some models), SQLAlchemy cannot perform automatic cascades via ORM. Manual cascading scripts and route-level deletion handlers are strictly required (see `MatchService.delete_match`).
- **Design Pattern**: The system strictly enforces the Repository pattern. Never write SQLAlchemy `db.query()` logic directly in route controllers. Always pass through Services → Repositories.
- **UI Constraints**: The Analytics modules utilize customized Recharts components. Do not remove the `maxHeight` or CSS Grid configurations in `AnalyticsView.jsx` or the UI will break vertically on ultra-wide monitors.
