# Match Results Feature

> The interface for organizers to enter actual match results after a match concludes, and for all users to view those results. Actual results are the ground truth against which all team predictions are scored.

---

## 1. Feature Purpose

The actual match result is the authoritative input that makes scoring possible. Without it, no prediction can be evaluated. The match results feature in the frontend serves two roles:

1. **Data entry** — Organizers enter the actual match result JSON after a match concludes
2. **Data display** — All users can view the actual result alongside team predictions for comparison

The entry form is gated to organizer role only. Viewing is available to all roles.

---

## 2. User Flow

**Organizer — Entering a Result:**

```
Organizer navigates to /matches
        ↓
Match List shows each match with status badge
(Scheduled / Frozen / Completed / Scored)
        ↓
Organizer selects a "Completed" match
        ↓
Match Detail page opens
        ↓
"Enter Actual Result" button visible (organizer only)
        ↓
Organizer clicks button → Result Entry Form expands (or modal opens)
        ↓
Form fields:
   - Actual Winner (home / away / draw)
   - Home Goals (integer ≥ 0)
   - Away Goals (integer ≥ 0)
   - 5 Probability fields (home_win, draw, away_win, clean_sheet_home, clean_sheet_away)
   - Both Teams to Score probability
   - First Goal Team
   - Player actuals (player_id + goals_scored per player)
        ↓
Organizer submits form
        ↓
Frontend calls: POST /api/v1/actual-results
        ↓
Success → form closes, result panel renders
Success → "Trigger Score Calculation" button becomes active
        ↓
Error → inline validation or toast
```

**All Users — Viewing a Result:**

```
User navigates to /matches/:matchId
        ↓
Match Detail page loads
        ↓
If actual result exists:
   Result panel displays: winner, scoreline, probabilities summary
        ↓
If no result yet:
   EmptyState: "Actual result not yet entered"
```

---

## 3. UI Components Required

| Component | Purpose |
|---|---|
| **MatchCard** | Match List view — shows status badge and result summary if available |
| **DashboardCard** | Match Detail header: match metadata and status |
| **Forms — FormInput** | Numeric score entry (home goals, away goals) |
| **Forms — FormSelect** | Dropdown for actual_winner (home / away / draw), first_goal_team |
| **Forms — ScoreInput** | Range-constrained probability fields (0–100) |
| **Buttons (Primary)** | "Submit Actual Result" CTA |
| **Buttons (Secondary)** | "Trigger Score Calculation" (enabled after result entry) |
| **Buttons (Ghost)** | "Cancel" / "Edit Result" (before finalization) |
| **Modal** | Confirmation dialog before result submission |
| **Toast** | Success/error feedback after submission |
| **Skeleton** | Loading state for match detail page |
| **EmptyState** | "Actual result not entered yet" when result is absent |

---

## 4. Backend Mapping

```
Actual Result Entry
        ↓
POST /api/v1/actual-results
Body: {match_id, actual_winner, home_goals, away_goals, probabilities, player_actuals}
        ↓
ActualResultService.save_actual_result()
        ↓
Database: actual_results (match_id, actual_winner, scoreline, probabilities, player_actuals)

Actual Result Display
        ↓
GET /api/v1/actual-results/{match_id}   [planned endpoint]
        ↓
ActualResultRepository.get_by_match()
        ↓
Database: actual_results

Score Calculation Trigger (after result entry)
        ↓
POST /api/v1/calculate-match-score
        ↓
ScoringService.calculate_and_save_match_score()
        ↓
Database: scores
```

**Backend Error Codes surfaced in UI:**

| Error Code | HTTP | UI Display |
|---|---|---|
| `ACTUAL_RESULT_ALREADY_EXISTS` | 409 | Toast `color-status-error`: "Result already entered for this match" |
| `VALIDATION_ERROR` | 422 | Inline field errors on form |
| `RESOURCE_NOT_FOUND` | 404 | EmptyState: "Match not found" |
| `INTERNAL_SERVER_ERROR` | 500 | Toast: "Submission failed — please try again" |

---

## 5. Data Display Requirements

### Match Status Badge (on MatchCard)

- **Values:** Scheduled | Frozen | Completed | Scored
- **Colors:** Info → `color-status-info`; Warning → `color-status-warning`; Success → `color-status-success`; Primary → `color-primary`
- **Typography:** `font-ui`, `text-xs`, `weight-semibold`, `radius-small`

### Actual Result Panel (read-only)

- **Format:** Two-column layout — match facts left, probabilities right
- **Scoreline:** Large display — "Home 2 – 1 Away", `font-display` `text-3xl` `weight-bold`
- **Winner badge:** Labeled `color-status-success` pill showing "Home Win" / "Away Win" / "Draw"
- **Probability table:** Grid of 5 fields — label + percentage value using `font-data`

### Actual Result Entry Form

- **Layout:** Grouped sections (Match Outcome → Probabilities → Player Actuals)
- **Input widths:** Narrow for integer fields (goals: 80px), standard for probabilities (120px)
- **Validation:** Inline red border (`color-status-error`) + error message below on invalid input
- **Submit area:** Bottom of form — Primary "Submit Result" button + Ghost "Cancel" button

---

## 6. Validation & Error States

| State | Trigger | UI Behavior |
|---|---|---|
| **Loading** | Match detail page fetching | Skeleton for full page |
| **No result yet** | Actual result not entered | EmptyState in result panel; "Enter Result" button prominent |
| **Form — invalid winner** | Empty or invalid enum | Inline: "Select Home, Away, or Draw" |
| **Form — negative goals** | Goals < 0 | Inline: "Goals must be 0 or greater" |
| **Form — invalid probability** | Value not 0–100 | Inline: "Enter a value between 0 and 100" |
| **Duplicate result** | 409 from API | Toast: "A result already exists for this match" |
| **API failure** | 500 from API | Toast + retry button; form stays open |
| **Frozen match** | Match is in Frozen state | Info banner: "Predictions are locked — scoring will begin after match completion" |

---

## 7. Light / Dark Mode Requirements

### FIFA Night Stadium (Dark)

| Element | Token |
|---|---|
| Match card background | `color-surface` → `#0F172A` |
| Status badge — Scheduled | `color-status-info` → `#38BDF8` |
| Status badge — Frozen | `color-status-warning` → `#FBBF24` |
| Status badge — Scored | `color-status-success` → `#22C55E` |
| Result panel background | `color-surface-secondary` → `#172033` |
| Scoreline text | `color-text-primary` → `#F1F5F9`, `font-display` |
| Probability values | `color-text-primary` → `#F1F5F9`, `font-data` |
| Form input background | `color-surface-secondary` → `#172033` |
| Form input border default | `shadow-sm` → `0 0 0 1px rgba(255,255,255,0.06)` |
| Form input border focus | `shadow-glow-primary` → `0 0 20px rgba(37,99,235,0.2)` |
| Form error highlight | `color-status-error` → `#EF4444` |

### FIFA Executive (Light)

| Element | Token |
|---|---|
| Match card background | `color-surface` → `#FFFFFF` |
| Status badge — Scheduled | `color-status-info` → `#009FE3` |
| Status badge — Frozen | `color-status-warning` → `#F59E0B` |
| Status badge — Scored | `color-status-success` → `#16A34A` |
| Result panel background | `color-surface-secondary` → `#EEF2F7` |
| Scoreline text | `color-text-primary` → `#0F172A`, `font-display` |
| Probability values | `color-text-primary` → `#0F172A`, `font-data` |
| Form input background | `color-surface` → `#FFFFFF` |
| Form input border default | 1px solid `color-surface-secondary` |
| Form input border focus | `shadow-glow-primary` → `0 0 20px rgba(6,59,142,0.12)` |
| Form error highlight | `color-status-error` → `#DC2626` |

---

## 8. Responsive Behavior

| Breakpoint | Layout |
|---|---|
| **Desktop (≥1280px)** | Match list: 3-column card grid. Match detail: two-column panel (result left, predictions right). Result form: right-side panel or inline expansion. |
| **Tablet (768px–1279px)** | Match list: 2-column grid. Match detail: single column stacked. Form: full-width. |
| **Mobile (<768px)** | Match list: single column. Match detail: accordion sections. Form: full-width with large touch targets (44px minimum). |

---

## 9. Future React Component Mapping

| React Component | Responsibility |
|---|---|
| `MatchListPage` | Displays all matches with status and result summary |
| `MatchDetailPage` | Full match view: result panel + prediction comparison |
| `ActualResultPanel` | Read-only result display (scoreline, winner, probabilities) |
| `ActualResultForm` | Organizer form for entering actual match result |
| `MatchStatusBadge` | Color-coded status indicator pill |
| `useMatchDetail(matchId)` | Fetches match metadata and actual result |
| `useSubmitActualResult()` | Mutation hook for POST /api/v1/actual-results |
