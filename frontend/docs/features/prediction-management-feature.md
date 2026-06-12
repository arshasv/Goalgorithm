# Prediction Management Feature

> The frontend interface for viewing submitted team predictions. Organizers can browse submitted prediction JSONs per team per match. Participating teams can confirm their submission status. No prediction editing is allowed in the UI — predictions are immutable once submitted.

---

## 1. Feature Purpose

Predictions are the raw input to the entire scoring pipeline. The frontend prediction management feature exists to:

1. Allow organizers to **verify** which teams have submitted predictions for each match
2. Allow teams to **confirm** their own submission was received and accepted
3. Allow organizers to **inspect** the prediction JSON content for audit purposes

Prediction **submission** from team AI models is via direct API call — not via this UI. The UI provides read-only visibility and submission status tracking.

---

## 2. User Flow

```
Organizer navigates to /matches
        ↓
Match List page shows all matches with submission status
(e.g., "4/5 teams submitted" badge on each match)
        ↓
Organizer clicks a match card
        ↓
Match Detail page opens
        ↓
Frontend calls: GET /api/v1/predictions?match_id={id}
        ↓
Prediction cards render per team:
   - Team name
   - Submission status (Submitted / Not Submitted)
   - Timestamp of submission
   - "View Details" button
        ↓
Organizer clicks "View Details"
        ↓
Modal opens showing full prediction JSON:
   - predicted_winner
   - scoreline
   - probabilities
   - player_predictions[]
        ↓
Organizer closes modal — returns to match view
```

**Team (Read-Only) Flow:**

```
Team member navigates to /teams/:teamId
        ↓
Team Profile page loads
        ↓
"Predictions" tab shows per-match submission history
   - Match name | Submitted ✓ / Not Submitted ✗ | Timestamp
```

---

## 3. UI Components Required

| Component | Purpose |
|---|---|
| **MatchCard** | Per-match card on Match List; shows prediction count badge |
| **DashboardCard (Stat)** | "X/5 teams submitted" summary on Match Detail header |
| **TeamCard** (compact) | Per-team prediction status row |
| **Modal** | Full prediction JSON viewer |
| **Buttons (Ghost)** | "View Details" to open prediction modal |
| **Buttons (Primary)** | "Trigger Score Calculation" (organizer only, post-deadline) |
| **GradeBadge** | Not applicable until scoring — shows "Pending" state |
| **Skeleton** | Loading state for prediction list |
| **EmptyState** | "No predictions submitted yet" when list is empty |
| **Toast** | Confirmation when prediction modal data loads successfully |

---

## 4. Backend Mapping

```
Prediction List (per match)
        ↓
GET /api/v1/predictions?match_id={id}   [planned — currently POST only]
        ↓
PredictionService.get_predictions_for_match()   [planned]
        ↓
Database: predictions table

Prediction Submission (AI team → backend, not UI)
        ↓
POST /api/v1/predictions
        ↓
PredictionService.save_prediction()
        ↓
Database: predictions (team_id, match_id, prediction_data, submitted_at)

Prediction Detail (single prediction)
        ↓
GET /api/v1/predictions/{team_id}/{match_id}   [planned]
        ↓
PredictionRepository.get_by_team_and_match()
        ↓
Database: predictions
```

**Backend Error Codes surfaced in UI:**

| Error Code | UI Display |
|---|---|
| `PREDICTION_ALREADY_EXISTS` | Info badge: "Already submitted" (409) |
| `VALIDATION_ERROR` | Inline: "Prediction format invalid" (422) |
| `RESOURCE_NOT_FOUND` | EmptyState: "No prediction found for this team/match" (404) |

---

## 5. Data Display Requirements

### Match List — Prediction Badge

- **Format:** Pill badge on each MatchCard: "4/5 Submitted"
- **Colors:** Complete → `color-status-success`; Partial → `color-status-warning`; None → `color-status-error`
- **Typography:** `font-ui`, `text-xs`, `weight-medium`

### Match Detail — Team Submission Grid

- **Format:** 5-row list (one per team) with columns: Team | Status | Submitted At | Action
- **Status indicator:** ✓ icon (`color-status-success`) for submitted; ✗ icon (`color-status-error`) for not submitted
- **Timestamp:** `font-data`, `text-sm`, `color-text-secondary`

### Prediction Detail Modal

- **Format:** Structured JSON viewer inside a Modal
- **Sections:** Match Winner | Scoreline | Probabilities | Player Predictions
- **Typography:** Section labels `font-ui` `text-sm` `weight-semibold`; values `font-data` `text-sm`
- **Layout:** Two-column where possible (label left, value right)

### Prediction Status Summary Bar

- **Format:** "X of 5 teams have submitted predictions for this match"
- **Visual:** Progress bar showing X/5 — uses `color-primary` fill on `color-surface-secondary` track

---

## 6. Validation & Error States

| State | Trigger | UI Behavior |
|---|---|---|
| **Loading** | API fetch in progress | Skeleton rows in prediction list |
| **Empty — No submissions** | 0 predictions for match | EmptyState: "No teams have submitted predictions yet" |
| **Empty — Specific team** | Team has not submitted | Row shows `color-status-error` ✗ + "Not submitted" label |
| **API failure (list)** | GET request fails | Error card: "Could not load predictions" + retry button |
| **API failure (modal)** | Modal fetch fails | Toast `color-status-error`: "Failed to load prediction details" |
| **Post-freeze access** | Match is frozen | Deadline badge shown; prediction viewing still allowed; submission lock notice displayed |

---

## 7. Light / Dark Mode Requirements

### FIFA Night Stadium (Dark)

| Element | Token |
|---|---|
| Match card background | `color-surface` → `#0F172A` |
| Team row background | `color-surface-secondary` → `#172033` |
| Team row hover | `color-surface-hover` → `rgba(255,255,255,0.04)` |
| Submitted status icon | `color-status-success` → `#22C55E` |
| Not submitted icon | `color-status-error` → `#EF4444` |
| Partial submission badge | `color-status-warning` → `#FBBF24` |
| Modal background | `color-surface-elevated` → `#1E2742` |
| Modal shadow | `shadow-xl` → `0 16px 48px rgba(0,0,0,0.6)` |
| Prediction value text | `color-text-primary` → `#F1F5F9`, `font-data` |
| Label text | `color-text-secondary` → `#94A3B8`, `font-ui` |

### FIFA Executive (Light)

| Element | Token |
|---|---|
| Match card background | `color-surface` → `#FFFFFF` |
| Team row background | `color-surface-secondary` → `#EEF2F7` |
| Team row hover | `color-surface-hover` → `rgba(0,0,0,0.03)` |
| Submitted status icon | `color-status-success` → `#16A34A` |
| Not submitted icon | `color-status-error` → `#DC2626` |
| Partial submission badge | `color-status-warning` → `#F59E0B` |
| Modal background | `color-surface` → `#FFFFFF` |
| Modal shadow | `shadow-xl` → `0 16px 48px rgba(15,23,42,0.16)` |
| Prediction value text | `color-text-primary` → `#0F172A`, `font-data` |
| Label text | `color-text-secondary` → `#64748B`, `font-ui` |

---

## 8. Responsive Behavior

| Breakpoint | Layout |
|---|---|
| **Desktop (≥1280px)** | Match detail: full-width two-column grid (team list left, prediction detail panel right) |
| **Tablet (768px–1279px)** | Single-column stacked: team list above, detail below on click |
| **Mobile (<768px)** | Team list as accordion: tap team row to expand prediction summary; full modal for JSON detail |

---

## 9. Future React Component Mapping

| React Component | Responsibility |
|---|---|
| `MatchListPage` | Match grid with prediction count badges |
| `MatchDetailPage` | Full match view with team prediction status |
| `PredictionStatusRow` | Per-team submission indicator row |
| `PredictionDetailModal` | Full prediction JSON viewer |
| `PredictionProgressBar` | X/5 teams submitted progress bar |
| `usePredictions(matchId)` | Fetches all predictions for a match |
| `usePredictionDetail(teamId, matchId)` | Fetches single prediction for modal |
