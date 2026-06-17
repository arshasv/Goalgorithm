# React Migration Roadmap: GOALGORITHM Platform

## Overview
This document outlines the strategic roadmap for migrating the GOALGORITHM Vanilla JS SPA to a robust, production-ready React application. The plan is divided into logical phases, ensuring iterative delivery, testability, and a seamless transition from the existing design references to a scalable component-based architecture.

**STATUS: MIGRATION COMPLETE (PHASE 1-7 VERIFIED & VALIDATED)**

---

## Phase 1: Core Foundation & Authentication
**Goal**: Establish the project skeleton, routing, global state management, and secure authentication flows.

* **Feature Migrated**: Application Layout & Authentication (Login/Register).
* **Expected User Flow**: User arrives at the app, is redirected to login if unauthenticated. They can register a new team leader account or log in. Successful login sets a JWT and redirects to the appropriate role-based dashboard.
* **React Components Needed**:
  * `AppRouter` (react-router setup with protected routes)
  * `AuthProvider` (React Context for global user state)
  * `Layout` (Sidebar, Navbar, dynamic role-based rendering)
  * `LoginView`, `RegisterView`
  * `ToastContainer` (Global notification system)
* **API Connections Required**:
  * `POST /api/v1/auth/login`
  * `POST /api/v1/auth/register`
  * `GET /api/v1/auth/me`
* **Backend Dependencies**: Stable Auth routes, User and Team models.

---

## Phase 2: Role-Based Dashboards
**Goal**: Implement the primary landing pages for Organizers and Team Leaders, complete with statistical summaries.

* **Feature Migrated**: Organizer Dashboard & Team Leader Dashboard.
* **Expected User Flow**: Upon login, the user sees high-level statistics. Organizers see global platform stats (total predictions, teams, matches). Team Leaders see their team's rank, active members, and individual score summaries.
* **React Components Needed**:
  * `OrganizerDashboard`, `TeamLeaderDashboard`
  * `StatCard`, `DashboardCharts` (Recharts or Chart.js)
  * `ActivityFeed` / `RecentPredictions`
  * `TeamProfileSummary`
* **API Connections Required**:
  * `GET /api/v1/teams`
  * `GET /api/v1/matches`
  * `GET /api/v1/leaderboard` (for rank fetching)
* **Backend Dependencies**: Leaderboard calculation and aggregation endpoints.

---

## Phase 3: Team Management & CSV Bulk Operations
**Goal**: Migrate the comprehensive team and roster management logic, handling both manual CRUD and Excel/CSV bulk operations.

* **Feature Migrated**: Team Management & Excel/CSV Upload.
* **Expected User Flow**: Organizers can manually create teams or upload a CSV file to bulk-import rosters. Team Leaders and Organizers can add, edit, or remove individual members via modals. 
* **React Components Needed**:
  * `TeamListView`, `TeamDetailModal`
  * `TeamEditForm`, `MemberEditForm`
  * `FileUploadDropzone` (for CSV/Excel handling)
  * `DataGrid` (Reusable table component for members)
  * `StatusBadge`
* **API Connections Required**:
  * `GET /api/v1/teams`, `POST /api/v1/teams`, `PUT /api/v1/teams/{id}`
  * `POST /api/v1/teams/upload-members-csv`
  * `GET /api/v1/teams/my-team`
  * `POST /api/v1/teams/my-team/members`, `PUT ...`, `DELETE ...`
* **Backend Dependencies**: Multi-format file parsing logic (csv, xlsx, xls) and `Team` & `TeamMember` database associations.

---

## Phase 4: Match Management & Scheduling
**Goal**: Implement the tournament schedule system, allowing Organizers to manage fixtures and track match lifecycle statuses.

* **Feature Migrated**: Match Management & CSV Schedule Upload.
* **Expected User Flow**: Organizers view a list of all matches. They can manually create a match or upload a CSV schedule. Matches transition through statuses (SCHEDULED, FROZEN, COMPLETED). Team Leaders have read-only views of the schedule to know when predictions are due.
* **React Components Needed**:
  * `MatchScheduleView`
  * `MatchCard`, `MatchStatusBadge`
  * `MatchEditModal`, `MatchCreateForm`
  * `ScheduleUploadDropzone`
* **API Connections Required**:
  * `GET /api/v1/matches`, `POST /api/v1/matches`, `PUT /api/v1/matches/{id}`
  * `POST /api/v1/matches/upload-csv`
* **Backend Dependencies**: Match lifecycle state machine (`MatchStatus` enum), automatic `freeze_deadline` calculation.

---

## Phase 5: Model & Prediction Submissions
**Goal**: Build the core interaction loop for the AI tournament: submitting JSON predictions and model files.

* **Feature Migrated**: Prediction Management & Model Submission.
* **Expected User Flow**: Team Leaders upload their machine learning model artifacts within an Organizer-defined window. Before a match freezes, Team Leaders submit a detailed JSON payload containing scoreline and winner predictions. Organizers can view logs of all submissions.
* **React Components Needed**:
  * `PredictionSubmissionView`, `PredictionJSONEditor`
  * `PredictionLogTable`, `PredictionStatusIndicator`
  * `ModelUploadModal`, `UploadWindowConfig`
* **API Connections Required**:
  * `POST /api/v1/predictions`
  * `GET /api/v1/predictions` (with query filters)
  * `GET/PUT /api/v1/upload-window`
  * `POST /api/v1/teams/my-team/model`
* **Backend Dependencies**: Strict Pydantic JSON validation, idempotent submission constraints, and file storage for models.

---

## Phase 6: Scoring Engine & Evaluation
**Goal**: Implement the multi-phase evaluation tools and the system configuration for scoring mechanics.

* **Feature Migrated**: Actual Result Management, Technical/Presentation Evaluation, & Scoring Engine Configuration.
* **Expected User Flow**: Organizers input the final real-world score of completed matches. Organizers use dedicated forms to submit Technical (0-20) and Presentation (0-20) scores. The system calculates the base and multiplied scores.
* **React Components Needed**:
  * `ActualResultEntryForm`
  * `TechnicalEvaluationForm`, `PresentationEvaluationForm`
  * `ScoringConfigPanel`
  * `ScoreBreakdownCard`
* **API Connections Required**:
  * `POST /api/v1/actual-results`
  * `POST /api/v1/calculate-match-score`
  * `POST /api/v1/technical-score`, `POST /api/v1/presentation-score`
  * `GET/PUT /api/v1/admin/scoring-config`
* **Backend Dependencies**: The multi-phase scoring pipeline (Base Score, Multiplier, Normalization).

---

## Phase 7: Analytics & Leaderboard
**Goal**: Present the aggregated, final results to all users via comprehensive data visualizations and ranked tables.

* **Feature Migrated**: Global Leaderboard & Final Analytics.
* **Expected User Flow**: All users can view the dynamically updated leaderboard to see current standings. The analytics tab shows score progressions over time and a breakdown of points by phase (Prediction vs Technical vs Presentation).
* **React Components Needed**:
  * `LeaderboardTable`
  * `RankMedalIcon`
  * `ScoreProgressionChart` (Line chart)
  * `PhaseDistributionChart` (Radar or Bar chart)
* **API Connections Required**:
  * `POST /api/v1/leaderboard/calculate`
  * `GET /api/v1/leaderboard`
* **Backend Dependencies**: Rank allocation logic and aggregate final score calculation algorithms.

---

## Technical Considerations for React
* **Styling**: Convert existing Vanilla CSS variables and utility classes into CSS Modules or styled-components to prevent global scope leakage, strictly preserving the "GOALGORITHM" dark/premium UI aesthetics.
* **State Management**: Utilize Context API + React Query (`@tanstack/react-query`) to handle the heavy read-heavy data flows (Leaderboard, Matches, Teams) and cache invalidations after mutations (e.g., uploading a CSV).
* **Forms & Validation**: Use `react-hook-form` paired with `zod` to mirror the strict Pydantic validations happening on the FastAPI backend (e.g., Prediction JSON format, member requirements).
