# Technical Evaluation Feature

> The Phase 2 scoring interface for architecture committee members. Committee members enter sub-dimension scores (Code Quality, Backend Quality, Teamwork, AI Explanation) for each team. The system sums them to produce a technical score out of 20.

---

## 1. Feature Purpose

Phase 2 evaluation is human-driven and cannot be automated. The frontend must provide a focused, error-preventing data entry form that:

1. Allows committee members to enter four sub-scores per team (each 0–5)
2. Shows a live running total as scores are entered
3. Confirms submission and locks the form after successful entry
4. Allows organizers to view all submitted Phase 2 scores in a summary table

The evaluation form is the most consequential manual data entry point in the system — it must enforce strict input constraints and prevent accidental submission.

---

## 2. User Flow

**Committee Member — Entering Scores:**

```
Committee member navigates to /evaluations/technical
        ↓
Page loads all teams in a form layout
        ↓
For each team (5 rows), enter 4 sub-scores:
   - Code Quality    (0–5 integer slider or number input)
   - Backend Quality (0–5 integer slider or number input)
   - Teamwork        (0–5 integer slider or number input)
   - AI Explanation  (0–5 integer slider or number input)
        ↓
Live Total updates per team as fields change:
   "Total: 19 / 20"
        ↓
Committee member reviews all 5 teams' scores
        ↓
"Submit All Technical Scores" button (Primary)
        ↓
Confirmation modal: "Submit Phase 2 technical scores for all 5 teams?"
        ↓
Confirmed → POST /api/v1/technical-score fires per team
        ↓
Success → form fields become read-only
Success → Toast: "Technical scores submitted successfully"
        ↓
Page shows read-only summary table
```

**Organizer — Viewing Submitted Scores:**

```
Organizer navigates to /evaluations/technical
        ↓
Read-only summary table:
   Team | Code Quality | Backend Quality | Teamwork | AI Explanation | Total
        ↓
All 5 teams listed with scores and totals
```

---

## 3. UI Components Required

| Component | Purpose |
|---|---|
| **Forms — ScoreInput** | Integer 0–5 input per sub-dimension per team |
| **Forms — FormInput** | Fallback text input with validation |
| **Buttons (Primary)** | "Submit All Technical Scores" |
| **Buttons (Ghost)** | "Reset" to clear uncommitted changes |
| **Modal (Confirm)** | "Are you sure you want to submit Phase 2 scores?" |
| **DashboardCard (Stat)** | Live running total per team: "19 / 20" |
| **LeaderboardTable** (read-only mode) | Summary view of submitted scores |
| **GradeBadge** | Not applicable for Phase 2 — no multiplier |
| **Toast** | Submission success / error feedback |
| **Skeleton** | Loading state while page data fetches |
| **EmptyState** | "Scores already submitted — viewing read-only" after submission |

---

## 4. Backend Mapping

```
Technical Score Submission (per team)
        ↓
POST /api/v1/technical-score
Body: {
  team_id: string,
  code_quality: 0–5,
  backend_quality: 0–5,
  teamwork: 0–5,
  ai_explanation: 0–5
}
        ↓
API Layer → validates with TechnicalEvaluationRequest schema
        ↓
ScoringService.calculate_technical_score()
        ↓
Sum: technical_score = code_quality + backend_quality + teamwork + ai_explanation (max 20)
        ↓
Database: technical_evaluations (team_id, breakdown, technical_score)

Technical Score Read (organizer view)
        ↓
GET /api/v1/technical-score/{team_id}   [planned endpoint]
        ↓
ScoreRepository.get_technical_score(team_id)
        ↓
Database: technical_evaluations

Leaderboard Impact
        ↓
technical_score feeds into:
POST /api/v1/leaderboard/calculate
Body includes: { technical_score: 19, ... }
```

**Backend Validation Rules surfaced in UI:**

| Field | Rule | Error Message |
|---|---|---|
| `code_quality` | Integer, 0–5 | "Code Quality must be 0 to 5" |
| `backend_quality` | Integer, 0–5 | "Backend Quality must be 0 to 5" |
| `teamwork` | Integer, 0–5 | "Teamwork must be 0 to 5" |
| `ai_explanation` | Integer, 0–5 | "AI Explanation must be 0 to 5" |
| `team_id` | Non-empty | "Team ID is required" |

---

## 5. Data Display Requirements

### Evaluation Form (Entry Mode)

- **Layout:** Table-style form — teams as rows, sub-dimensions as columns
- **Input:** Each cell is a numeric input constrained to 0–5 (integer only)
- **Live Total Column:** Rightmost — auto-calculates `sum / 20` as user types
- **Column Headers:** "Code Quality /5" | "Backend Quality /5" | "Teamwork /5" | "AI Explanation /5" | "Total /20"
- **Typography:** Headers `font-ui` `text-sm` `weight-semibold`; values `font-data` `text-base`

### Live Total Display (per row)

- **Format:** Large number — "19" in `font-data` `text-2xl` `weight-bold` + "/20" in `color-text-secondary`
- **Color coding:** Full score (20) → `color-status-success`; Below 10 → `color-status-error`; Otherwise → `color-text-primary`

### Summary Table (Read-Only Mode)

- **Format:** Standard table with same columns as entry form
- **Rows:** 5 teams sorted by technical_score descending
- **Total column:** Bold, right-aligned, `font-data`
- **No edit controls** — all values are static text

---

## 6. Validation & Error States

| State | Trigger | UI Behavior |
|---|---|---|
| **Loading** | Page fetch | Skeleton for full form table |
| **Input — out of range** | Value > 5 or < 0 | Input border turns `color-status-error`; inline message below |
| **Input — non-integer** | Decimal value entered | Inline: "Enter a whole number (0–5)" |
| **Input — empty field** | Blank on submit attempt | Highlight empty fields; "All fields required" summary message |
| **API failure (single team)** | 422 or 500 | Toast per team: "Failed to save [Team Name] scores"; remaining submissions continue |
| **API failure (all)** | All 5 POSTs fail | Toast: "Submission failed — please retry"; form stays editable |
| **Already submitted** | Scores exist in DB | Form renders in read-only mode with info banner: "Scores already submitted" |
| **Empty — no teams** | No teams in system | EmptyState: "No teams registered for evaluation" |

---

## 7. Light / Dark Mode Requirements

### FIFA Night Stadium (Dark)

| Element | Token |
|---|---|
| Page background | `color-bg` → `#020617` |
| Form table background | `color-surface` → `#0F172A` |
| Row alternating background | `color-surface-secondary` → `#172033` |
| Input field background | `color-surface-secondary` → `#172033` |
| Input border (default) | `shadow-sm` → `0 0 0 1px rgba(255,255,255,0.06)` |
| Input border (focus) | `shadow-glow-primary` → `0 0 20px rgba(37,99,235,0.2)` |
| Input border (error) | `color-status-error` → `#EF4444` |
| Column header text | `color-text-secondary` → `#94A3B8`, `font-ui` |
| Input values | `color-text-primary` → `#F1F5F9`, `font-data` |
| Live total — good (≥10) | `color-text-primary` → `#F1F5F9` |
| Live total — low (<10) | `color-status-error` → `#EF4444` |
| Live total — perfect (20) | `color-status-success` → `#22C55E` |
| Submit button | `gradient-primary` → `#2563EB → #063B8E` |

### FIFA Executive (Light)

| Element | Token |
|---|---|
| Page background | `color-bg` → `#F8FAFC` |
| Form table background | `color-surface` → `#FFFFFF` |
| Row alternating background | `color-surface-secondary` → `#EEF2F7` |
| Input field background | `color-surface` → `#FFFFFF` |
| Input border (default) | 1px solid `color-surface-secondary` → `#EEF2F7` |
| Input border (focus) | `shadow-glow-primary` → `0 0 20px rgba(6,59,142,0.12)` |
| Input border (error) | `color-status-error` → `#DC2626` |
| Column header text | `color-text-secondary` → `#64748B`, `font-ui` |
| Input values | `color-text-primary` → `#0F172A`, `font-data` |
| Live total — good | `color-text-primary` → `#0F172A` |
| Live total — low | `color-status-error` → `#DC2626` |
| Live total — perfect | `color-status-success` → `#16A34A` |
| Submit button | `gradient-primary-light` → `#063B8E → #0047C0` |

---

## 8. Responsive Behavior

| Breakpoint | Layout |
|---|---|
| **Desktop (≥1280px)** | Full table layout — 5 teams × 4 inputs + total, all columns visible simultaneously |
| **Tablet (768px–1279px)** | Horizontal scroll on the table; or collapse to card-per-team layout with 4 inputs stacked |
| **Mobile (<768px)** | Card-per-team layout: one card per team, 4 stacked input rows, total at bottom. Teams switched via top tab or dropdown. |

---

## 9. Future React Component Mapping

| React Component | Responsibility |
|---|---|
| `TechnicalEvalPage` | Route-level page; switches between entry form and read-only mode |
| `TechnicalEvalTable` | Form table for all 5 teams |
| `TechnicalScoreRow` | Per-team row with 4 inputs + live total |
| `SubScoreInput` | Single 0–5 integer input with inline validation |
| `LiveTotalDisplay` | Real-time score sum display |
| `TechnicalSummaryTable` | Read-only version of completed scores |
| `useSubmitTechnicalScore()` | Mutation hook for POST /api/v1/technical-score |
| `useTechnicalScores()` | Query hook for fetching submitted scores |
