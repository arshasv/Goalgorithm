# Presentation Evaluation Feature

> The Phase 3 scoring interface for peer review panel members. Raw scores are entered across three dimensions (AI Explanation, Q&A, Delivery), ranked against other teams, multiplied by grade (A/B/C), and normalized to 20 marks.

---

## 1. Feature Purpose

Phase 3 evaluation introduces competitive peer review: teams score each other's presentations, and the resulting scores are ranked and normalized — meaning a team's raw score alone does not determine their Phase 3 mark. The multiplier (grade) applied after ranking makes this a competitive, relative evaluation.

The frontend must:

1. Provide a clear input form for raw peer scores across 3 dimensions
2. Show a live raw total per team
3. After submission, display the computed outcome: raw score → rank → grade → multiplier → final presentation score
4. Make the multi-step computation transparent to all viewers

---

## 2. User Flow

**Peer Review Panel — Entering Scores:**

```
Panel member navigates to /evaluations/presentation
        ↓
Form shows all 5 teams with 3 score fields each:
   - AI Explanation Score (0–20)
   - Q&A Score           (0–15)
   - Delivery Score      (0–15)
        ↓
Live Raw Total updates per team: sum of 3 fields (max 50)
        ↓
Panel member completes all scores
        ↓
"Submit All Presentation Scores" button (Primary)
        ↓
Confirmation modal: "Submit Phase 3 scores for all 5 teams?"
        ↓
Confirmed → POST /api/v1/presentation-score
Body: array of all 5 team score objects
        ↓
Backend computes simultaneously for all teams:
   Rank → Grade → Multiplier → (raw × multiplier / 150) × 20
        ↓
Response: array with final presentation_score per team
        ↓
Success → Results table renders with full breakdown
Toast: "Phase 3 presentation scores submitted"
```

**All Users — Viewing Results:**

```
Navigate to /evaluations/presentation (or /teams/:teamId)
        ↓
Presentation Scores Summary Table:
   Team | Raw Score | Rank | Grade | Multiplier | Final Score (/20)
        ↓
Per-team expansion shows sub-dimension breakdown
```

---

## 3. UI Components Required

| Component | Purpose |
|---|---|
| **Forms — ScoreInput** | Integer inputs for each sub-dimension per team |
| **DashboardCard (Stat)** | Live raw total per team: "48 / 50" |
| **GradeBadge** | Grade A / B / C with multiplier (shown in results view) |
| **RankBadge** | Per-presentation rank (#1–#5) in results table |
| **LeaderboardTable** | Results summary — same visual language as main leaderboard |
| **ScoreBreakdownCard** | Per-team results: raw → multiplied → normalized display |
| **Charts — Horizontal Bar** | Raw score vs. max per dimension (results view) |
| **Buttons (Primary)** | "Submit All Presentation Scores" |
| **Modal (Confirm)** | Submission confirmation dialog |
| **Toast** | Success / error feedback |
| **Skeleton** | Loading state |
| **EmptyState** | "Scores not yet submitted" before entry |

---

## 4. Backend Mapping

```
Presentation Score Submission (all teams at once)
        ↓
POST /api/v1/presentation-score
Body: [
  { team_id, ai_explanation_score: 0–20, qa_score: 0–15, delivery_score: 0–15 },
  ...  (5 team entries)
]
        ↓
API Layer → validates with PresentationEvaluationRequest schema
        ↓
ScoringService:
  1. Compute raw_total = ai_explanation + qa_score + delivery_score (max 50)
  2. Rank teams by raw_total descending
  3. Grade assignment (same as match-level ranking):
       Top unique → A (3×)
       Bottom unique → C (1×)
       Others → B (2×)
  4. multiplied = raw_total × multiplier
  5. presentation_score = (multiplied / 150) × 20, rounded 2dp
        ↓
Database: presentation_evaluations (team_id, ai_explanation_score,
  qa_score, delivery_score, raw_score, rank, grade, multiplier,
  presentation_score)

Leaderboard impact
        ↓
presentation_score feeds into:
POST /api/v1/leaderboard/calculate (presentation_score field)
```

**Backend Validation Rules:**

| Field | Rule | Max | Error |
|---|---|---|---|
| `ai_explanation_score` | Integer, 0–20 | 20 | "AI Explanation must be 0–20" |
| `qa_score` | Integer, 0–15 | 15 | "Q&A Score must be 0–15" |
| `delivery_score` | Integer, 0–15 | 15 | "Delivery Score must be 0–15" |

---

## 5. Data Display Requirements

### Entry Form

- **Layout:** Table — 5 team rows, 3 score columns + raw total column
- **Column headers:** "AI Explanation /20" | "Q&A /15" | "Delivery /15" | "Raw Total /50"
- **Typography:** Headers `font-ui` `text-sm` `weight-semibold`; inputs `font-data` `text-base`
- **Live total:** Auto-sums as user types — color-coded (see theming)

### Results Table (after submission)

Full results table with columns:

| Column | Content | Font |
|---|---|---|
| Rank | #1–#5 with RankBadge | `font-display` `weight-extrabold` |
| Team | Team name | `font-ui` `weight-semibold` |
| Raw Score | "48 / 50" | `font-data` |
| Grade | GradeBadge (A/B/C) | Badge component |
| Multiplier | "3×" | `font-data` `color-grade-a` |
| Final Score | "19.20 / 20" | `font-data` `weight-bold` |

### Computation Transparency Panel

Below the results table, a formula explanation card:

```
Phase 3 Formula:
  Raw Score × Multiplier ÷ 150 × 20 = Final Score
  Example (Rank 1): 48 × 3 ÷ 150 × 20 = 19.20
```

- **Font:** `font-data` for numbers, `font-ui` for labels
- **Purpose:** Reinforces algorithmic trust

---

## 6. Validation & Error States

| State | Trigger | UI Behavior |
|---|---|---|
| **Loading** | Page/result fetch | Skeleton table |
| **Input — over range** | ai_explanation_score > 20 | Red border + "Maximum is 20" |
| **Input — negative** | Score < 0 | Red border + "Score must be 0 or greater" |
| **Input — empty on submit** | Blank field | Highlight + "All scores required before submission" |
| **API failure** | 422 or 500 | Toast: "Submission failed — scores not saved"; form stays editable |
| **Already submitted** | Scores in DB | Read-only results table with info banner |
| **Tie handling** | Two teams tied for 1st | Both show Grade B — note in UI: "Tie — both teams received Grade B (2×)" |
| **Empty — no teams** | No teams | EmptyState: "No teams registered" |

---

## 7. Light / Dark Mode Requirements

### FIFA Night Stadium (Dark)

| Element | Token |
|---|---|
| Page background | `color-bg` → `#020617` |
| Form/results table bg | `color-surface` → `#0F172A` |
| Alternating row | `color-surface-secondary` → `#172033` |
| Input border default | `shadow-sm` → `0 0 0 1px rgba(255,255,255,0.06)` |
| Input border focus | `shadow-glow-primary` → `0 0 20px rgba(37,99,235,0.2)` |
| Input border error | `color-status-error` → `#EF4444` |
| Raw total — normal | `color-text-primary` → `#F1F5F9`, `font-data` |
| Raw total — perfect (50) | `color-status-success` → `#22C55E` |
| Raw total — low (<25) | `color-status-error` → `#EF4444` |
| Rank #1 row accent | `color-gold` → `#FACC15`, `shadow-glow-gold` |
| Rank #2 row accent | `color-silver` → `#CBD5E1` |
| Rank #3 row accent | `color-bronze` → `#D97706` |
| Grade A badge | `color-grade-a` → `#22C55E` |
| Grade B badge | `color-grade-b` → `#FBBF24` |
| Grade C badge | `color-grade-c` → `#EF4444` |
| Final score text | `color-text-primary` → `#F1F5F9`, `font-data` `weight-bold` |

### FIFA Executive (Light)

| Element | Token |
|---|---|
| Page background | `color-bg` → `#F8FAFC` |
| Form/results table bg | `color-surface` → `#FFFFFF` |
| Alternating row | `color-surface-secondary` → `#EEF2F7` |
| Input border default | 1px solid `color-surface-secondary` |
| Input border focus | `shadow-glow-primary` → `0 0 20px rgba(6,59,142,0.12)` |
| Input border error | `color-status-error` → `#DC2626` |
| Raw total — normal | `color-text-primary` → `#0F172A`, `font-data` |
| Raw total — perfect | `color-status-success` → `#16A34A` |
| Raw total — low | `color-status-error` → `#DC2626` |
| Rank #1 row accent | `color-gold` → `#D4AF37`, `shadow-glow-gold` |
| Rank #2 row accent | `color-silver` → `#A8A9AD` |
| Rank #3 row accent | `color-bronze` → `#CD7F32` |
| Grade A badge | `color-grade-a` → `#16A34A` |
| Grade B badge | `color-grade-b` → `#F59E0B` |
| Grade C badge | `color-grade-c` → `#DC2626` |
| Final score text | `color-text-primary` → `#0F172A`, `font-data` `weight-bold` |

---

## 8. Responsive Behavior

| Breakpoint | Layout |
|---|---|
| **Desktop (≥1280px)** | Full table: 5 rows × 3 inputs + live total. Results table same. Formula card below. |
| **Tablet (768px–1279px)** | Horizontal scroll on wide table, or card-per-team entry layout. Results table scrolls horizontally with sticky team column. |
| **Mobile (<768px)** | Card-per-team entry: team name header, 3 stacked inputs, raw total footer. Results: simplified list showing rank + final score only; expandable for full detail. |

---

## 9. Future React Component Mapping

| React Component | Responsibility |
|---|---|
| `PresentationEvalPage` | Route-level page; switches entry ↔ results |
| `PresentationEvalTable` | Entry form for all 5 teams |
| `PresentationScoreRow` | Per-team row with 3 inputs + live raw total |
| `PresentationResultsTable` | Post-submission ranked results table |
| `ComputationTransparencyCard` | Formula explanation panel |
| `useSubmitPresentationScores()` | Mutation hook — single POST with full array |
| `usePresentationScores()` | Query hook for fetching results |
