# Analytics Feature

> Per-team and cross-team data visualization providing deeper insight into scoring patterns, prediction accuracy trends, and phase performance across the tournament. Analytics is a read-only intelligence layer built on top of existing scoring data.

---

## 1. Feature Purpose

The analytics feature transforms raw scores into actionable insight. While the leaderboard shows the final standings, analytics answers "why" and "how much":

1. **Team Profile** — Per-team cumulative score progression over matches
2. **Prediction Accuracy Trends** — Which dimension a team scores consistently high or low on
3. **Cross-Team Comparison** — How all teams compare on each phase
4. **Match Difficulty Curve** — Average base scores per match (reveals which matches were harder to predict)
5. **Phase Contribution Analysis** — What fraction of each team's total comes from each phase

Analytics data is derived entirely from existing scoring data — no new backend endpoints are needed beyond the scoring and leaderboard APIs already documented.

---

## 2. User Flow

**Team Profile Analytics:**

```
User navigates to /teams/:teamId
        ↓
GET /api/v1/scores?team_id={id}   [planned]
        ↓
Team Profile page loads
        ↓
"Analytics" tab selected (alongside "Predictions" and "Scores" tabs)
        ↓
Charts render:
   1. Line Chart — Cumulative earned points across matches 1–N
   2. Radar Chart — Average dimension scores (winner/scoreline/prob/player)
   3. Donut Chart — Phase contribution breakdown (Phase 1 % / Phase 2 % / Phase 3 %)
        ↓
User hovers data point → tooltip shows exact match/score detail
```

**Cross-Team Comparison (Leaderboard Analytics):**

```
User navigates to /leaderboard → "Analytics" tab
        ↓
Stacked bar chart renders (all teams × 3 phases)
        ↓
User selects a specific match from dropdown
        ↓
Horizontal bar chart renders for that match:
   All 5 teams ranked by base score for that match
   Grade badges shown alongside bars
```

**Match Difficulty Analysis (Admin):**

```
Organizer navigates to /admin/audit
        ↓
"Match Difficulty" chart section
        ↓
Line chart: average base score across all teams per match
   Low average → harder to predict match
   High average → easier to predict match
```

---

## 3. UI Components Required

| Component | Purpose |
|---|---|
| **Charts — Line Chart** | Cumulative score progression over matches |
| **Charts — Radar Chart** | Per-team dimension profile (winner/scoreline/probability/player) |
| **Charts — Donut Chart** | Phase contribution breakdown |
| **Charts — Stacked Bar** | Cross-team phase comparison |
| **Charts — Horizontal Bar** | Per-match team ranking visualization |
| **DashboardCard (Stat)** | Key insight cards: best match, worst match, highest dimension |
| **LeaderboardTable** (inline) | Supporting table data beneath charts |
| **GradeBadge** | Grade labels on per-match comparison bars |
| **RankBadge** | Rank labels on cross-team comparison |
| **Skeleton** | Chart loading placeholder |
| **EmptyState** | "Not enough data for analytics" when <2 matches scored |
| **SearchFilterBar** | Match selector for drill-down charts |
| **Buttons (Ghost)** | Tab switcher (Scores / Predictions / Analytics) |

---

## 4. Backend Mapping

All analytics data is derived from existing endpoints — no new dedicated analytics API needed.

```
Team Score Progression (line chart data)
        ↓
GET /api/v1/scores?team_id={id}   [planned]
        ↓
ScoreRepository.get_scores_for_team()
        ↓
Database: scores (team_id, match_id, earned_points, base_score,
                  winner_score, scoreline_score, probability_score, player_score)

Cross-Team Phase Comparison (stacked bar data)
        ↓
GET /api/v1/leaderboard   [planned GET]
        ↓
LeaderboardRepository.get_leaderboard()
        ↓
Database: leaderboard (phase1_score, technical_score, presentation_score)

Per-Match All Teams (horizontal bar data)
        ↓
GET /api/v1/scores?match_id={id}   [planned]
        ↓
ScoreRepository.get_scores_for_match()
        ↓
Database: scores (all teams for one match)

Dimension Radar (team dimension averages)
        ↓
Computed client-side from:
GET /api/v1/scores?team_id={id}
→ average winner_score, scoreline_score, probability_score, player_score across matches
        ↓
No additional backend endpoint needed
```

---

## 5. Data Display Requirements

### Team Profile — Score Progression Line Chart

- **X-axis:** Match number (1 to N scored matches)
- **Y-axis:** Cumulative earned points
- **Line:** Smooth curve, `color-chart-1` stroke
- **Data points:** Circular markers — hover tooltip shows: "Match #X: +34 pts (Grade B × 17)"
- **Annotations:** Grade A matches marked with gold triangle above line

### Team Profile — Dimension Radar Chart

- **Axes:** Winner (max 5) | Scoreline (max 10) | Probability (max 5) | Player (max 5)
- **Normalization:** All axes displayed as % of max for fair shape comparison
- **Color:** `color-chart-1` fill at 30% opacity; stroke at 100%
- **Labels:** Axis labels at each vertex, `font-ui` `text-xs`

### Team Profile — Phase Donut Chart

- **Segments:** Phase 1 (`color-chart-1`) / Phase 2 (`color-chart-2`) / Phase 3 (`color-chart-3`)
- **Center label:** Grand total — `font-data` `text-3xl` `weight-bold`
- **Legend:** Below or beside chart with segment labels and percentages

### Cross-Team Stacked Bar Chart

- **Bars:** One per team, horizontal
- **Segments:** Same three-phase color scheme as leaderboard
- **X-axis:** 0 to 100 (grand total scale)
- **Sort order:** By grand total descending (matches leaderboard rank)
- **Bar labels:** Team name left, grand total right, `font-data`

### Per-Match Horizontal Bar Chart

- **Bars:** One per team, sorted by base score descending
- **Bar length:** Proportional to base score / 25
- **Grade badge:** Right of each bar
- **Color:** Top scorer (`color-chart-1`); others (`color-chart-2`)

### Key Insight Stat Cards (Team Profile)

| Insight | Format |
|---|---|
| Best Match | "Match #8 — 75 pts (Grade A)" |
| Worst Match | "Match #3 — 5 pts (Grade C)" |
| Strongest Dimension | "Scoreline — avg 8.2 / 10" |
| Weakest Dimension | "Probability — avg 0.8 / 5" |

---

## 6. Validation & Error States

| State | Trigger | UI Behavior |
|---|---|---|
| **Loading — charts** | Fetching score data | Skeleton rectangle matching chart dimensions |
| **Insufficient data** | Fewer than 2 matches scored | EmptyState: "Analytics available after 2+ matches are scored" |
| **No leaderboard data** | Leaderboard not calculated | EmptyState in cross-team chart: "Generate leaderboard first" |
| **API failure** | Score data fetch fails | Chart area shows inline error: "Could not load chart data" + retry |
| **Single data point** | Only 1 match scored | Line chart shows single point with dashed projection; note: "More matches needed for trend" |
| **All zeros** | Team scored 0 on all dimensions | Radar chart renders all at zero with `color-status-error` outline; note shown |

---

## 7. Light / Dark Mode Requirements

### FIFA Night Stadium (Dark)

| Element | Token |
|---|---|
| Page / chart background | `color-bg` → `#020617` |
| Chart panel background | `color-surface` → `#0F172A` |
| Chart gridlines | `color-surface-secondary` → `#172033` (subtle) |
| Chart axis labels | `color-text-secondary` → `#94A3B8`, `font-ui` `text-xs` |
| Chart data values | `color-text-primary` → `#F1F5F9`, `font-data` |
| Line chart stroke (team) | `color-chart-1` → `#2563EB` |
| Line chart Grade A annotation | `color-gold` → `#FACC15` |
| Radar fill | `color-chart-1` → `#2563EB` at 30% opacity |
| Donut — Phase 1 | `color-chart-1` → `#2563EB` |
| Donut — Phase 2 | `color-chart-2` → `#38BDF8` |
| Donut — Phase 3 | `color-chart-3` → `#14B8A6` |
| Tooltip background | `color-surface-elevated` → `#1E2742` |
| Tooltip shadow | `shadow-lg` → `0 8px 24px rgba(0,0,0,0.5)` |
| Stat card background | `color-surface` → `#0F172A` |
| Stat card border | `shadow-sm` → `0 0 0 1px rgba(255,255,255,0.06)` |

### FIFA Executive (Light)

| Element | Token |
|---|---|
| Page / chart background | `color-bg` → `#F8FAFC` |
| Chart panel background | `color-surface` → `#FFFFFF` |
| Chart gridlines | `color-surface-secondary` → `#EEF2F7` |
| Chart axis labels | `color-text-secondary` → `#64748B`, `font-ui` `text-xs` |
| Chart data values | `color-text-primary` → `#0F172A`, `font-data` |
| Line chart stroke | `color-chart-1` → `#063B8E` |
| Line chart Grade A annotation | `color-gold` → `#D4AF37` |
| Radar fill | `color-chart-1` → `#063B8E` at 20% opacity |
| Donut — Phase 1 | `color-chart-1` → `#063B8E` |
| Donut — Phase 2 | `color-chart-2` → `#009FE3` |
| Donut — Phase 3 | `color-chart-3` → `#00B8A9` |
| Tooltip background | `color-surface` → `#FFFFFF` |
| Tooltip shadow | `shadow-md` → `0 4px 12px rgba(15,23,42,0.08)` |
| Stat card background | `color-surface` → `#FFFFFF` |
| Stat card shadow | `shadow-md` → `0 4px 12px rgba(15,23,42,0.08)` |

---

## 8. Responsive Behavior

| Breakpoint | Layout |
|---|---|
| **Desktop (≥1280px)** | Team Profile: Line chart + Radar side by side; Donut below right. Cross-team: Full stacked bar chart + leaderboard table. Match view: Horizontal bar + stat cards. |
| **Tablet (768px–1279px)** | Charts stacked vertically single-column. Radar and Donut each full width. Cross-team chart scrolls horizontally. |
| **Mobile (<768px)** | Charts simplified — Line chart remains (most valuable). Radar replaces with horizontal bar of dimension averages. Donut collapses to legend list + percentage text. Stat cards in 2×2 grid. |

---

## 9. Future React Component Mapping

| React Component | Responsibility |
|---|---|
| `TeamProfilePage` | Host for team analytics (tab: Analytics) |
| `ScoreProgressionChart` | Line chart — cumulative earned points over matches |
| `DimensionRadarChart` | Radar chart — per-team dimension average profile |
| `PhaseDonutChart` | Donut — phase contribution breakdown |
| `CrossTeamStackedBar` | Stacked bar — all teams × 3 phases |
| `MatchComparisonBar` | Horizontal bar — per-match team ranking |
| `InsightStatCards` | Best/worst match and strongest/weakest dimension |
| `MatchSelector` | Dropdown to filter per-match charts |
| `useTeamScores(teamId)` | Query hook — fetches all match scores for a team |
| `useMatchScores(matchId)` | Query hook — fetches all team scores for a match |
