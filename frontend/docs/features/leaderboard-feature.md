# Leaderboard Feature

> The centerpiece of FIFA Elite Analytics. Displays all teams ranked by their grand total (Phase 1 + Phase 2 + Phase 3 out of 100), with full phase-level breakdown, expandable per-match history, and computation transparency.

---

## 1. Feature Purpose

The leaderboard is the final word in the competition — it answers "who won?" at every level:

1. **Grand total ranking** — who leads overall out of 100 marks
2. **Phase contribution** — how much each phase contributed per team
3. **Tie-breaking** — clearly communicates when and how ties are resolved
4. **Audit trail** — drill-down from total score to phase to match to dimension

The leaderboard is the most-viewed page in the application. Every design and performance decision must prioritize legibility, load speed, and visual authority.

---

## 2. User Flow

**Organizer — Generating the Leaderboard:**

```
All three phases have scores entered
        ↓
Organizer navigates to /leaderboard
        ↓
"Calculate Leaderboard" button visible (Primary)
        ↓
Confirmation modal: "Generate final leaderboard from all phase scores?"
        ↓
Organizer confirms
        ↓
POST /api/v1/leaderboard/calculate
Body: [{ team_id, phase1_score, technical_score, presentation_score }]
        ↓
Loading state → results populate
        ↓
Toast: "Leaderboard calculated and published"
```

**All Users — Viewing the Leaderboard:**

```
Navigate to /leaderboard
        ↓
GET /api/v1/leaderboard (cached result)
        ↓
Ranked table renders:
   #1 Team A  |  AI: 60.0  |  Tech: 19  |  Pres: 19.2  |  TOTAL: 98.2
   #2 Team B   |  AI: 16.0  |  Tech: 17  |  Pres: 11.47 |  TOTAL: 44.47
        ↓
User clicks a row
        ↓
Row expands → per-match score timeline appears
        ↓
User clicks "View Team Profile →"
        ↓
Navigates to /teams/:teamId
```

---

## 3. UI Components Required

| Component | Purpose |
|---|---|
| **LeaderboardTable** | Full ranked table — primary component of this feature |
| **RankBadge** | #1 (gold) / #2 (silver) / #3 (bronze) / #4–5 (neutral) |
| **ScoreBreakdownCard** | Expanded row — per-match breakdown on click |
| **PhaseIndicator** | Phase 1/2/3 completion status in page header |
| **Charts — Stacked Bar** | Visual phase comparison across all teams |
| **Charts — Line Chart** | Individual team score progression (accessed from row) |
| **GradeBadge** | Per-match grade shown in expanded match history |
| **Buttons (Primary)** | "Calculate Leaderboard" (organizer only) |
| **Buttons (Secondary)** | "Export CSV" / "Export PDF" (planned) |
| **Buttons (Ghost)** | "View Team Profile" in expanded row |
| **Modal (Confirm)** | Leaderboard calculation confirmation |
| **DashboardCard (Stat)** | Phase completion summary at top of page |
| **Skeleton** | Loading state for full table |
| **EmptyState** | "Leaderboard not yet generated" |
| **Toast** | Success/error after calculation trigger |

---

## 4. Backend Mapping

```
Leaderboard Calculation
        ↓
POST /api/v1/leaderboard/calculate
Body: [
  { team_id: "Team A", phase1_score: 60.0, technical_score: 19, presentation_score: 19.2 },
  { team_id: "Team B",  phase1_score: 16.0, technical_score: 17, presentation_score: 11.47 }
]
        ↓
API Layer → validates with LeaderboardEntry schema
        ↓
LeaderboardService:
  1. Validate score ranges (phase1: 0–60, tech: 0–20, pres: 0–20)
  2. final_score = phase1 + technical + presentation
  3. Sort descending by final_score
  4. Tie-breaking: ai_accuracy → technical → presentation
  5. Assign ranks with tie handling
        ↓
Database: leaderboard (rank, team_id, phase1_score, technical_score,
                       presentation_score, final_score)
         + cumulative_phase_scores (source data)

Leaderboard Read
        ↓
GET /api/v1/leaderboard   [planned GET endpoint]
        ↓
LeaderboardRepository.get_leaderboard()
        ↓
Database: leaderboard table

Per-Team Match History (expanded row data)
        ↓
GET /api/v1/scores?team_id={id}   [planned]
        ↓
ScoreRepository.get_scores_for_team()
        ↓
Database: scores (all matches for team)
```

**Backend Error Codes:**

| Error Code | HTTP | UI Display |
|---|---|---|
| `LEADERBOARD_ERROR` | 400 | Toast: "One or more scores are out of range — check phase scores" |
| `VALIDATION_ERROR` | 422 | Toast: "Invalid leaderboard data format" |
| `INTERNAL_SERVER_ERROR` | 500 | Toast: "Calculation failed — please retry" |

---

## 5. Data Display Requirements

### Main Leaderboard Table

Full-width table with these columns:

| Column | Width | Font | Notes |
|---|---|---|---|
| Rank | 64px | `font-display` `weight-extrabold` | RankBadge for #1–#3 |
| Team | Flexible | `font-ui` `weight-semibold` | Clickable → Team Profile |
| AI Accuracy /60 | 100px | `font-data` | Phase 1 score |
| Technical /20 | 90px | `font-data` | Phase 2 score |
| Presentation /20 | 110px | `font-data` | Phase 3 score |
| Total /100 | 120px | `font-data` `weight-bold` `text-lg` | Grand total |
| Phase Bar | Flexible | — | Segmented visual bar |

### Segmented Phase Bar (per row)

Three-segment bar representing phase contribution as proportion of 100:

- **AI Accuracy segment** — `color-chart-1` (`#2563EB` dark / `#063B8E` light)
- **Technical segment** — `color-chart-2` (`#38BDF8` dark / `#009FE3` light)
- **Presentation segment** — `color-chart-3` (`#14B8A6` dark / `#00B8A9` light)
- Total bar width = 100%; segments proportional to score/max

### Expanded Row (click to open)

Slide-down panel showing per-match history:

- Match list: Match # | Base Score | Grade | Multiplier | Earned Points
- Row-level `GradeBadge` for each match
- Bottom line: Cumulative Earned → Phase 1 Normalization formula

### Comparison Chart (below table)

Stacked horizontal bar chart:

- One bar per team
- Three segments per bar (Phase 1, Phase 2, Phase 3)
- X-axis: 0 to 100
- Legend: Phase 1 (blue) | Technical (teal) | Presentation (gold)

### Leaderboard Header Stats

Three stat cards above the table:

- "Phase 1 Complete" (all matches scored) — `color-status-success` or pending
- "Phase 2 Complete" (technical scores entered) — same
- "Phase 3 Complete" (presentation scores entered) — same

---

## 6. Validation & Error States

| State | Trigger | UI Behavior |
|---|---|---|
| **Loading — initial** | GET /leaderboard fetching | Skeleton table with 5 ghost rows |
| **Loading — calculating** | POST fired | Table shows spinner overlay; button disabled |
| **Empty — never generated** | No leaderboard data | EmptyState: "Leaderboard not generated yet" + organizer CTA |
| **Out-of-range score** | 400 LEADERBOARD_ERROR | Toast: "Score validation failed — check phase scores before regenerating" |
| **Stale data warning** | Data older than threshold | Timestamp badge + "Leaderboard last calculated X hours ago. Recalculate?" |
| **API failure** | 500 | Toast: "Could not load leaderboard" + retry |
| **Tie at top** | Two teams equal final_score | Both show same rank; note below: "Tie resolved by AI Accuracy" |
| **Export failure** | Export feature unavailable | Toast: "Export not available — feature planned" |

---

## 7. Light / Dark Mode Requirements

### FIFA Night Stadium (Dark)

| Element | Token |
|---|---|
| Page background | `color-bg` → `#020617` |
| Table background | `color-surface` → `#0F172A` |
| Alternating row | `color-surface-secondary` → `#172033` |
| Row hover | `color-surface-hover` → `rgba(255,255,255,0.04)` |
| Rank #1 row | `color-gold` → `#FACC15` left border + `shadow-glow-gold` |
| Rank #2 row | `color-silver` → `#CBD5E1` left border |
| Rank #3 row | `color-bronze` → `#D97706` left border |
| Table header | `color-surface-secondary` bg + `color-text-secondary` → `#94A3B8` |
| Phase 1 segment | `color-chart-1` → `#2563EB` |
| Phase 2 segment | `color-chart-2` → `#38BDF8` |
| Phase 3 segment | `color-chart-3` → `#14B8A6` |
| Total score text | `color-text-primary` → `#F1F5F9`, `font-data` `weight-bold` |
| Expanded row bg | `color-surface-elevated` → `#1E2742` |
| Expanded row shadow | `shadow-lg` → `0 8px 24px rgba(0,0,0,0.5)` |

### FIFA Executive (Light)

| Element | Token |
|---|---|
| Page background | `color-bg` → `#F8FAFC` |
| Table background | `color-surface` → `#FFFFFF` |
| Alternating row | `color-surface-secondary` → `#EEF2F7` |
| Row hover | `color-surface-hover` → `rgba(0,0,0,0.03)` |
| Rank #1 row | `color-gold` → `#D4AF37` left border + `shadow-glow-gold` |
| Rank #2 row | `color-silver` → `#A8A9AD` left border |
| Rank #3 row | `color-bronze` → `#CD7F32` left border |
| Table header | `color-surface-secondary` bg + `color-text-secondary` → `#64748B` |
| Phase 1 segment | `color-chart-1` → `#063B8E` |
| Phase 2 segment | `color-chart-2` → `#009FE3` |
| Phase 3 segment | `color-chart-3` → `#00B8A9` |
| Total score text | `color-text-primary` → `#0F172A`, `font-data` `weight-bold` |
| Expanded row bg | `color-surface-secondary` → `#EEF2F7` |
| Expanded row shadow | `shadow-md` → `0 4px 12px rgba(15,23,42,0.08)` |

---

## 8. Responsive Behavior

| Breakpoint | Layout |
|---|---|
| **Desktop (≥1280px)** | Full table with all columns. Phase bar full width. Comparison chart below table full width. |
| **Tablet (768px–1279px)** | Table with sticky Rank + Team columns; Phase 1/2/3 + Total visible; horizontal scroll for phase bar. Comparison chart below. |
| **Mobile (<768px)** | Table shows only Rank, Team, Total. Phase breakdown accessible via row tap (expands details). Chart hidden on mobile — replaced with simple list. |

---

## 9. Future React Component Mapping

| React Component | Responsibility |
|---|---|
| `LeaderboardPage` | Route-level container; orchestrates data + calculation trigger |
| `LeaderboardTable` | Full ranked table with expandable rows |
| `LeaderboardRow` | Single team row with rank badge, scores, phase bar |
| `PhaseScoreBar` | Three-segment proportional bar |
| `ExpandedMatchHistory` | Per-match breakdown shown on row expansion |
| `LeaderboardHeaderStats` | Phase completion stat cards |
| `LeaderboardComparisonChart` | Stacked bar chart comparing all teams |
| `CalculateLeaderboardButton` | Organizer CTA with confirm flow |
| `useLeaderboard()` | Query hook — fetches current leaderboard |
| `useCalculateLeaderboard()` | Mutation hook — POST /api/v1/leaderboard/calculate |
