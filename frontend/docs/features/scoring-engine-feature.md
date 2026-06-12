# Scoring Engine Feature

> The frontend visualization of the automated scoring pipeline. Organizers trigger score calculation; all users view the results. The scoring engine covers Base Score computation, per-match ranking, grade multiplier assignment, and Phase 1 normalization.

---

## 1. Feature Purpose

The scoring engine is the mathematical core of the system — it is entirely automated and backend-driven. The frontend's role is:

1. **Trigger** — Organizers initiate score calculation for a match via a UI action
2. **Display** — All users see the computed breakdown: winner score, scoreline score, probability score, player score, base score, grade, multiplier, and earned points
3. **Audit** — Every dimension's score is visible and traceable to its formula inputs

The UI must communicate that scores are **computed, not edited** — the interface should reinforce algorithmic trust.

---

## 2. User Flow

**Organizer — Triggering Score Calculation:**

```
Organizer on Match Detail page (result already entered)
        ↓
"Calculate Scores" button active (Primary variant)
        ↓
Organizer clicks → Confirmation modal appears:
   "Calculate scores for Match #12? This will compute scores for all 5 teams."
        ↓
Organizer confirms
        ↓
POST /api/v1/calculate-match-score fires for each team prediction
        ↓
Loading state: button shows spinner, "Calculating..."
        ↓
Success → Score Breakdown Cards render for each team
Success → Toast: "Scores calculated for Match #12"
        ↓
Ranks and grade multipliers applied automatically
```

**All Users — Viewing Scores:**

```
User navigates to /matches/:matchId
        ↓
Match Detail page loads
        ↓
If scores exist: Score Breakdown Cards shown per team
        ↓
User clicks a team's Score Breakdown Card
        ↓
Expanded view: dimension-level scores with progress bars
   - Winner Prediction: 5 / 5 pts (✓ Correct)
   - Scoreline Exactness: 10 / 10 pts (✓ Exact)
   - Probability Accuracy: 0 / 5 pts (✗ Outside threshold)
   - Player Performance: 2 / 5 pts (~ Close)
   ──────────────────────────────────
   Base Score: 17 / 25 pts
   Grade: B  |  Multiplier: 2×
   Earned Points: 34
```

---

## 3. UI Components Required

| Component | Purpose |
|---|---|
| **Buttons (Primary)** | "Calculate Scores" trigger (organizer only) |
| **Modal (Confirm)** | "Confirm score calculation" dialog |
| **ScoreBreakdownCard** | Per-team score display with 4 dimensions + totals |
| **GradeBadge** | Grade A / B / C + multiplier display on each team card |
| **RankBadge** | Per-match rank (#1–#5) on each team's score card |
| **Charts — Horizontal Bar** | Visual bars for each dimension score vs. maximum |
| **DashboardCard (Stat)** | Match-level summary: total teams scored, highest base score |
| **Toast** | Success/error feedback after calculation trigger |
| **Skeleton** | Loading state while scores are being calculated or fetched |
| **EmptyState** | "Scores not yet calculated" before calculation is triggered |

---

## 4. Backend Mapping

```
Score Calculation Trigger
        ↓
POST /api/v1/calculate-match-score
Body: { prediction: {...}, actual_result: {...} }
        ↓
API Layer → ScoringService.calculate_and_save_match_score()
        ↓
Scoring Engine (pure functions):
   calculate_winner_score()       → 0 or 5
   calculate_scoreline_score()    → 0, 5, or 10
   calculate_probability_score()  → 0 or 5
   calculate_player_score()       → 0, 2, or 5
        ↓
Base Score = sum of four dimensions (max 25)
        ↓
Ranking Engine: sorts 5 teams by base_score → assigns rank
Grade Assignment:
   Rank 1 (unique) → Grade A (3×)
   Ranks 2-4       → Grade B (2×)
   Rank 5 (unique) → Grade C (1×)
   Tie rules apply
        ↓
earned_points = base_score × multiplier
        ↓
Database: scores (team_id, match_id, winner_score, scoreline_score,
                  probability_score, player_score, base_score,
                  match_rank, grade, multiplier, earned_points)

Score Display (read)
        ↓
GET /api/v1/scores?match_id={id}   [planned endpoint]
        ↓
ScoreRepository.get_scores_for_match()
        ↓
Database: scores
```

**Backend Error Codes:**

| Error Code | HTTP | UI Display |
|---|---|---|
| `DUPLICATE_ENTRY` | 409 | Toast: "Scores already exist for this match" |
| `FOREIGN_KEY_VIOLATION` | 400 | Toast: "Missing prediction or actual result for one or more teams" |
| `VALIDATION_ERROR` | 422 | Toast: "Invalid data format" |
| `INVALID_COMPETITION_STATE` | 400 | Toast: "Match is not in a scoreable state" |

---

## 5. Data Display Requirements

### Score Breakdown Card (per team)

- **Layout:** Card with team name header, 4 dimension rows, summary footer
- **Dimension row:** Label | Score/Max | Progress Bar | Status icon
- **Progress bar fill:** `gradient-score-bar` (`color-primary` → `color-accent`)
- **Status icons:** ✓ `color-status-success` | ✗ `color-status-error` | ~ `color-status-warning`
- **Base Score footer:** `font-data` `text-2xl` `weight-bold` — "17 / 25"
- **Grade Badge:** Adjacent to base score — "Grade B — 2×" in `color-grade-b`
- **Earned Points:** `font-data` `text-xl` — "Earned: 34 pts"

### Dimension Score Values

| Dimension | Max | Font |
|---|---|---|
| Winner Prediction | 5 | `font-data` `text-base` |
| Scoreline Exactness | 10 | `font-data` `text-base` |
| Probability Accuracy | 5 | `font-data` `text-base` |
| Player Performance | 5 | `font-data` `text-base` |
| Base Score | 25 | `font-data` `text-2xl` `weight-bold` |

### Match Score Summary Panel

- **Format:** Horizontal row of 5 team score cards, sorted by rank
- **Rank #1 card:** Gold accent border using `color-gold` + `shadow-glow-gold`
- **Cards gap:** `space-md` (16px)

### Phase 1 Normalization Display (Team Profile)

- **Format:** Final normalized score shown as "Phase 1 Score: 60.0 / 60"
- **Formula visible:** "(Total Earned / Max Earned) × 60 = Phase 1 Score"
- **Purpose:** Transparency — users see how normalization worked

---

## 6. Validation & Error States

| State | Trigger | UI Behavior |
|---|---|---|
| **Loading — calculating** | POST fired | Primary button shows spinner; score cards show Skeleton |
| **Loading — fetching scores** | GET in progress | Skeleton cards for each of 5 teams |
| **Empty — not scored** | No scores exist | EmptyState: "Scores not yet calculated for this match" + "Calculate Scores" CTA |
| **Duplicate score** | 409 response | Toast: "Scores already computed" — displays existing scores |
| **Missing prediction** | 400 FOREIGN_KEY | Toast: "One or more teams have not submitted predictions" |
| **Partial calculation** | Some teams scored | Warning banner: "Partial scores — not all teams have valid predictions" |
| **API failure** | 500 response | Toast: "Score calculation failed" + retry button |

---

## 7. Light / Dark Mode Requirements

### FIFA Night Stadium (Dark)

| Element | Token |
|---|---|
| Score card background | `color-surface` → `#0F172A` |
| Card border | `shadow-sm` → `0 0 0 1px rgba(255,255,255,0.06)` |
| Rank #1 card accent | `shadow-glow-gold` → `0 0 20px rgba(250,204,21,0.25)` |
| Dimension progress bar fill | `gradient-score-bar` (primary → accent) |
| Dimension progress track | `color-surface-secondary` → `#172033` |
| Score numbers | `color-text-primary` → `#F1F5F9`, `font-data` |
| Dimension label | `color-text-secondary` → `#94A3B8`, `font-ui` |
| Grade A badge | `color-grade-a` → `#22C55E` text on 15% opacity bg |
| Grade B badge | `color-grade-b` → `#FBBF24` text on 15% opacity bg |
| Grade C badge | `color-grade-c` → `#EF4444` text on 15% opacity bg |
| Correct dim (✓) | `color-status-success` → `#22C55E` |
| Wrong dim (✗) | `color-status-error` → `#EF4444` |
| Partial dim (~) | `color-status-warning` → `#FBBF24` |

### FIFA Executive (Light)

| Element | Token |
|---|---|
| Score card background | `color-surface` → `#FFFFFF` |
| Card shadow | `shadow-md` → `0 4px 12px rgba(15,23,42,0.08)` |
| Rank #1 card accent | `shadow-glow-gold` → `0 0 16px rgba(212,175,55,0.2)` |
| Dimension progress bar fill | `gradient-score-bar` |
| Dimension progress track | `color-surface-secondary` → `#EEF2F7` |
| Score numbers | `color-text-primary` → `#0F172A`, `font-data` |
| Dimension label | `color-text-secondary` → `#64748B`, `font-ui` |
| Grade A badge | `color-grade-a` → `#16A34A` text on 15% opacity bg |
| Grade B badge | `color-grade-b` → `#F59E0B` text on 15% opacity bg |
| Grade C badge | `color-grade-c` → `#DC2626` text on 15% opacity bg |
| Correct dim (✓) | `color-status-success` → `#16A34A` |
| Wrong dim (✗) | `color-status-error` → `#DC2626` |
| Partial dim (~) | `color-status-warning` → `#F59E0B` |

---

## 8. Responsive Behavior

| Breakpoint | Layout |
|---|---|
| **Desktop (≥1280px)** | 5 score cards in a horizontal row, each 20% width. Dimension bars full width within card. |
| **Tablet (768px–1279px)** | 2–3 cards per row, wrapping grid. Dimension bars remain proportional. |
| **Mobile (<768px)** | Single card visible at a time — horizontal scroll or tabbed team switcher. Dimension scores shown as compact list (no bars on very small screens). |

---

## 9. Future React Component Mapping

| React Component | Responsibility |
|---|---|
| `MatchDetailPage` | Hosts score calculation trigger and score display |
| `ScoreBreakdownCard` | Per-team 4-dimension score card with progress bars |
| `DimensionRow` | Single dimension label + bar + score + status icon |
| `GradeBadge` | Grade A/B/C pill with multiplier |
| `MatchRankSummary` | Horizontal row of 5 ranked team cards |
| `CalculateScoresButton` | Organizer-only action button with loading and confirm states |
| `useMatchScores(matchId)` | Fetches computed scores for a match |
| `useCalculateScore()` | Mutation hook for POST /api/v1/calculate-match-score |
