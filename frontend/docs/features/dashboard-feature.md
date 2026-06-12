# Dashboard Feature

> The primary landing page of FIFA Elite Analytics. Provides a tournament command-center overview combining leaderboard snapshots, phase progress, recent activity, and quick stats in a single glanceable view.

---

## 1. Feature Purpose

The dashboard exists as the **single point of orientation** for all roles — organizers, committee members, and participating teams. On load, it must answer three questions in under 3 seconds:

1. Who is currently leading?
2. Where is the tournament in its scoring phases?
3. What happened most recently?

It is not a data entry point — it is a read-only overview that links out to all other features. Every widget is a summary; every summary is a navigation entry point.

---

## 2. User Flow

```
User navigates to "/" (root)
        ↓
DashboardPage mounts
        ↓
Parallel API calls fire:
   → GET /api/v1/leaderboard      (top 5 teams)
   → GET /api/v1/matches          (match count stats)
   → GET /api/v1/predictions      (submission count)
        ↓
Loading skeletons shown during fetch
        ↓
Data arrives → widgets populate:
   - Command Strip: match/prediction counts
   - Leaderboard Hero: top 5 ranked teams
   - Phase Tracker: Phase 1/2/3 completion status
   - Activity Feed: recent scoring events
        ↓
User clicks a team row
        ↓
Navigates to /teams/:teamId (Team Profile)

User clicks a leaderboard section
        ↓
Navigates to /leaderboard (full view)
```

---

## 3. UI Components Required

| Component | Purpose on Dashboard |
|---|---|
| **DashboardCard (Stat variant)** | Command strip — matches scored, predictions received, teams active |
| **DashboardCard (Leaderboard Mini)** | Top 5 ranked teams with scores and trend indicators |
| **DashboardCard (Phase Progress)** | Three-phase completion tracker |
| **DashboardCard (Activity Feed)** | Scrollable feed of recent scoring events |
| **LeaderboardTable** (mini, 5 rows) | Embedded ranking in the Leaderboard Hero zone |
| **RankBadge** | Rank position within the mini leaderboard |
| **PhaseIndicator** | Phase 1 / 2 / 3 status dots in Phase Progress card |
| **GradeBadge** | Current grade of each team (if match has been scored) |
| **Skeleton** | Loading placeholders for all four dashboard zones |
| **EmptyState** | Shown if no matches scored yet |
| **Toast** | Feedback for any background refresh errors |

---

## 4. Backend Mapping

```
Dashboard (LeaderboardHero zone)
        ↓
GET /api/v1/leaderboard/calculate (POST to recalculate, or GET for cached)
        ↓
LeaderboardService.compute_and_save_leaderboard()
        ↓
Database: leaderboard, cumulative_phase_scores

Dashboard (Command Strip — match count)
        ↓
GET /api/v1/matches (planned endpoint)
        ↓
MatchService (planned)
        ↓
Database: matches

Dashboard (Phase Tracker)
        ↓
Derived from leaderboard data — phase1_score, technical_score, presentation_score presence
        ↓
No dedicated endpoint — computed client-side from leaderboard response
```

---

## 5. Data Display Requirements

### Command Strip Cards

- **Format:** 4 stat cards in a horizontal row
- **Content per card:** large number (`font-data`, `text-4xl`) + label (`font-ui`, `text-sm`) + optional trend arrow
- **Example values:** "18 / 32 Matches Scored", "5 / 5 Teams Active", "47 Predictions Received"

### Leaderboard Hero

- **Format:** Condensed table — 5 rows max, columns: Rank | Team | Final Score | Trend
- **Typography:** Rank uses `font-display` + `weight-extrabold`; scores use `font-data`
- **Phase bars:** Not shown in mini view — only rank, team name, final score
- **CTA:** "View Full Leaderboard →" link at bottom

### Phase Tracker

- **Format:** Three-segment horizontal indicator
- **States per phase:** Completed (filled `color-status-success`) / In Progress (pulsing `color-primary`) / Pending (outlined `color-text-muted`)
- **Labels:** "AI Accuracy /60", "Technical /20", "Presentation /20"

### Activity Feed

- **Format:** Chronological list, newest first
- **Entry format:** "[Event Type] — [Match/Team] — [Timestamp]"
- **Example:** "Match #12 scored — 5 teams updated — 2h ago"
- **Max visible:** 8 entries, scrollable

---

## 6. Validation & Error States

| State | Component | Behavior |
|---|---|---|
| **Loading** | All 4 card zones | Skeleton shimmer placeholders matching card dimensions |
| **Empty — No scores** | Leaderboard Hero | EmptyState: "No scores calculated yet" + Phase Indicator showing all pending |
| **Empty — No matches** | Command Strip | Stat cards show "0" values with muted styling |
| **API failure** | Any zone | Error message inline within the failed card; retry button |
| **Partial data** | Phase Tracker | Phases with data show scores; phases without show "Pending" |
| **Network offline** | Global | Toast: "Connection lost — data may be stale" (`color-status-warning`) |

---

## 7. Light / Dark Mode Requirements

### FIFA Night Stadium (Dark — default)

| Element | Token |
|---|---|
| Page background | `color-bg` → `#020617` |
| Card backgrounds | `color-surface` → `#0F172A` |
| Stat card inner padding area | `color-surface-secondary` → `#172033` |
| Card border | `shadow-sm` → `0 0 0 1px rgba(255,255,255,0.06)` |
| Stat numbers | `color-text-primary` → `#F1F5F9`, `font-data` |
| Stat labels | `color-text-secondary` → `#94A3B8`, `font-ui` |
| Leaderboard mini rank #1 | `color-gold` → `#FACC15` |
| Phase completed indicator | `color-status-success` → `#22C55E` |
| Phase in-progress indicator | `color-primary` → `#2563EB` with `pulse-glow` animation |
| Phase pending indicator | `color-text-muted` → `#475569` |
| Card elevated shadow | `shadow-md` → `0 4px 12px rgba(0,0,0,0.4)` |

### FIFA Executive (Light)

| Element | Token |
|---|---|
| Page background | `color-bg` → `#F8FAFC` |
| Card backgrounds | `color-surface` → `#FFFFFF` |
| Stat card inner area | `color-surface-secondary` → `#EEF2F7` |
| Card shadow | `shadow-md` → `0 4px 12px rgba(15,23,42,0.08)` |
| Stat numbers | `color-text-primary` → `#0F172A`, `font-data` |
| Stat labels | `color-text-secondary` → `#64748B`, `font-ui` |
| Leaderboard mini rank #1 | `color-gold` → `#D4AF37` |
| Phase completed | `color-status-success` → `#16A34A` |
| Phase in-progress | `color-primary` → `#063B8E` |
| Phase pending | `color-text-muted` → `#94A3B8` |

---

## 8. Responsive Behavior

| Breakpoint | Layout |
|---|---|
| **Desktop (≥1280px)** | Command Strip: 4-column row. Leaderboard Hero: left 2/3. Phase Tracker: right 1/3. Activity Feed: full width below. |
| **Tablet (768px–1279px)** | Command Strip: 2×2 grid. Leaderboard Hero: full width. Phase Tracker: full width below. Activity Feed: full width. |
| **Mobile (<768px)** | All cards stacked vertically single-column. Command Strip: 2 cards visible, horizontal scroll for remaining. Activity Feed: collapsed with "Show All" toggle. |

---

## 9. Future React Component Mapping

| React Component | Responsibility |
|---|---|
| `DashboardPage` | Route-level container; orchestrates all data fetching |
| `CommandStrip` | Four stat cards in top row |
| `StatCard` | Single stat display: number + label + trend |
| `LeaderboardHero` | Mini leaderboard card with top 5 |
| `PhaseTrackerCard` | Three-phase progress indicator |
| `ActivityFeed` | Chronological event list |
| `useDashboardData` | Custom hook — parallel fetching of all dashboard data |
