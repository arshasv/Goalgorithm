# FIFA Elite Analytics — Component Guidelines

> This document defines the planned reusable UI components for the FIFA Elite Analytics frontend. Each component includes its purpose, usage context, states, and expected behavior. No implementation code exists yet — this is a design-first specification.

---

## Component Inventory

| Category | Components |
|---|---|
| **Navigation** | Navbar, Sidebar |
| **Layout** | Dashboard Cards, Page Shell |
| **Data Display** | Leaderboard Table, Team Cards, Score Breakdown Cards, Match Cards, Charts |
| **Forms & Input** | Form Controls, Buttons, Search / Filter Bar |
| **Feedback** | Modals, Toast Notifications, Empty States, Loading Skeletons |
| **Branding** | Rank Badge, Grade Badge, Phase Indicator |

---

## Navigation Components

---

### Navbar

**Purpose:** Global top navigation bar present on every page. Provides branding, breadcrumbs, global actions, and theme toggle.

**Usage:** Rendered at the top of the page shell. Persists across all route transitions.

**Contents:**

- FIFA Elite Analytics logo / wordmark (left)
- Breadcrumb trail showing current location (center-left)
- Theme toggle (light/dark) button (right)
- User role badge (right)
- Notification indicator (right, planned)

**States:**

| State | Behavior |
|---|---|
| Default | Full width bar with all elements visible |
| Scrolled | Applies subtle backdrop blur and border-bottom for visual separation |
| Mobile | Collapses to hamburger menu; logo and theme toggle remain visible |

**Expected Behavior:**

- Sticky at viewport top (`position: sticky; top: 0`)
- Z-index: `z-sticky` (200)
- Theme toggle persists preference to `localStorage`
- Breadcrumbs auto-generated from route hierarchy

---

### Sidebar

**Purpose:** Primary navigation panel listing all major application sections.

**Usage:** Rendered on the left side of the page shell on desktop. Provides section links with active state highlighting.

**Sections:**

- Dashboard (Home)
- Leaderboard
- Matches
- Teams
- Evaluations (Phase 2 / Phase 3)
- Administration (organizer role only)
- Audit Log (organizer role only)

**States:**

| State | Behavior |
|---|---|
| Expanded | Full sidebar with icon + text labels (width: 260px) |
| Collapsed | Icon-only rail (width: 64px) — triggered at tablet breakpoint or manual toggle |
| Hidden | Not rendered on mobile; replaced by bottom navigation |
| Active Item | Background highlight + left accent border on current route |
| Hover | Subtle background overlay on hovered item |

**Expected Behavior:**

- Sticky on desktop (`position: sticky; top: navbar-height`)
- Smooth transition between expanded and collapsed states
- Collapsed state shows tooltip on hover for each icon
- Role-based visibility: admin sections hidden for non-organizer roles
- Active section determined by current route match

---

## Layout Components

---

### Dashboard Cards

**Purpose:** Modular content containers used on the dashboard to display summary metrics, mini-visualizations, and action shortcuts.

**Usage:** Arranged in a responsive CSS grid on the Dashboard page. Each card represents one data facet.

**Variants:**

| Variant | Content | Example |
|---|---|---|
| **Stat Card** | Single large number with label and optional trend | "Matches Scored: 18 / 32" |
| **Leaderboard Mini** | Top 3–5 ranked teams in compact format | Embedded rank list |
| **Phase Progress** | Three-segment progress indicator for phases | Phase 1 ✓, Phase 2 In Progress, Phase 3 Pending |
| **Activity Feed** | Scrollable list of recent scoring events | "Match #12 scored — 5 teams updated" |
| **Action Card** | CTA button for organizer workflows | "Calculate Match Score" |

**States:**

| State | Behavior |
|---|---|
| Default | Card with content, header, optional icon |
| Loading | Skeleton shimmer placeholder matching card dimensions |
| Empty | Centered empty-state message with icon |
| Error | Error message with retry button |
| Hover | Subtle lift effect (`translateY(-2px)`, `shadow-md` → `shadow-lg`) |

**Expected Behavior:**

- Cards use consistent padding (`space-5` inner, `space-4` gap between)
- Headers use `text-lg` with `weight-semibold`
- Trend indicators show up/down arrows with `status-success` / `status-error` colors
- Grid: 4 columns on desktop, 2 on tablet, 1 on mobile

---

## Data Display Components

---

### Leaderboard Table

**Purpose:** The primary data component of the application. Displays all teams ranked by final score with phase-level breakdown.

**Usage:** Full-page component on the Leaderboard page. Also rendered in mini format on Dashboard.

**Columns:**

| Column | Description | Width | Sortable |
|---|---|---|---|
| Rank | Position badge (1st/2nd/3rd styled specially) | 64px | No (default sort) |
| Team | Team name with optional avatar/icon | Flexible | Yes |
| AI Accuracy | Phase 1 score (0–60) | 100px | Yes |
| Technical | Phase 2 score (0–20) | 100px | Yes |
| Presentation | Phase 3 score (0–20) | 100px | Yes |
| Final Score | Grand total (0–100) | 120px | Yes |
| Trend | Up/down/neutral indicator vs previous calculation | 48px | No |

**States:**

| State | Behavior |
|---|---|
| Default | Full table rendered with all teams |
| Loading | Skeleton rows matching column structure |
| Empty | "No scores calculated yet" centered message |
| Row Hover | Background changes to `surface-hover` |
| Row Expanded | Click to reveal full dimension-level score breakdown |
| Own Team | Highlighted row with accent left border (for participant view) |
| Sorted | Active sort column shows directional arrow indicator |

**Expected Behavior:**

- Sticky header row on vertical scroll
- Sticky Rank and Team columns on horizontal scroll (mobile)
- Rank 1/2/3 rows receive gradient background accent using `rank-*` tokens
- Score cells use `font-mono` for numerical alignment
- Expandable rows slide open with `slide-up` animation
- Default sort: descending by Final Score

---

### Team Cards

**Purpose:** Compact card representation of a single team's scoring summary.

**Usage:** Used in team listing pages and as hover/click previews in other contexts.

**Contents:**

- Team name and identifier
- Current rank with position badge
- Phase score breakdown (three horizontal bars)
- Final score (large, prominent)
- Grade tier badge (A / B / C)

**States:**

| State | Behavior |
|---|---|
| Default | Card with all team data |
| Loading | Skeleton placeholder |
| Hover | Lift effect + glow shadow |
| Selected | Accent border applied |
| Inactive | Reduced opacity if team has no scores yet |

**Expected Behavior:**

- Phase bars scale proportionally (AI: max 60, Tech: max 20, Pres: max 20)
- Final score uses `font-display` with `text-4xl` and `weight-bold`
- Grade badge uses `grade-a` / `grade-b` / `grade-c` token colors
- Cards arranged in grid: 3 columns desktop, 2 tablet, 1 mobile

---

### Score Breakdown Cards

**Purpose:** Detailed dimension-level visualization of a single team's score for a specific match.

**Usage:** Appears in Match Detail page and in Leaderboard expanded rows.

**Contents:**

- Match identifier and metadata
- Four dimension rows:
  - Winner Prediction (0–5 pts)
  - Scoreline Exactness (0–10 pts)
  - Probability Accuracy (0–5 pts)
  - Player Performance (0–5 pts)
- Base Score total (0–25 pts)
- Applied multiplier (1×, 2×, or 3×)
- Earned Score after multiplier

**States:**

| State | Behavior |
|---|---|
| Default | All dimensions displayed with score bars |
| Loading | Skeleton placeholder per dimension |
| Zero Score | Dimension row styled with `status-error` color and "0 pts" |
| Full Score | Dimension row styled with `status-success` color |
| Partial Score | Dimension row uses `status-warning` styling |

**Expected Behavior:**

- Each dimension shows a horizontal progress bar (filled portion vs max)
- Multiplier badge styled with grade color
- Earned score shown prominently below breakdown
- Animation: dimension bars fill from left on mount (`score-count` animation)

---

### Match Cards

**Purpose:** Summary card for a single match showing status, participating teams, and scoring state.

**Usage:** Listed on the Matches page in a grid or list layout.

**Contents:**

- Match ID and round/stage label
- Team matchup (Team A vs Team B or match descriptor)
- Match date and time
- Match status badge (Scheduled / Frozen / Completed / Scored)
- Predictions received count (e.g., "4/5 teams submitted")
- Quick action button (Score / View, depending on status)

**States:**

| State | Behavior |
|---|---|
| Scheduled | Neutral styling, countdown to freeze deadline |
| Frozen | Warning accent, "Predictions locked" label |
| Completed | Result available, ready for scoring |
| Scored | Success accent, score summary visible |
| Hover | Lift effect |

**Expected Behavior:**

- Status badge uses semantic color tokens (`status-info`, `status-warning`, `status-success`)
- Cards flow in a responsive grid: 3 columns desktop, 2 tablet, 1 mobile
- Clicking navigates to Match Detail page
- Freeze countdown shows hours:minutes when < 24 hours

---

### Charts

**Purpose:** Data visualizations for score trends, comparisons, and distributions.

**Usage:** Embedded in Dashboard, Team Profile, and Match Detail pages.

**Planned Chart Types:**

| Type | Usage | Data Source |
|---|---|---|
| **Stacked Bar** | Phase breakdown comparison across teams | Leaderboard data |
| **Line Chart** | Cumulative score progression over matches | Per-team match history |
| **Radar Chart** | Dimension profile for a team (winner/scoreline/probability/player) | Score breakdown data |
| **Horizontal Bar** | Single-match ranking visualization | Per-match team scores |
| **Donut Chart** | Phase contribution breakdown for one team | Team score summary |

**States:**

| State | Behavior |
|---|---|
| Default | Rendered with data and interactive tooltips |
| Loading | Skeleton placeholder matching chart dimensions |
| Empty | "No data available" centered with chart icon |
| Hover | Tooltip showing exact values on data point hover |
| Resizing | Chart redraws smoothly on container resize |

**Expected Behavior:**

- Chart colors follow `chart-*` token palette
- Tooltips follow pointer with slight delay
- Axes labels use `font-body` at `text-sm`
- Data values use `font-mono`
- All charts respect `prefers-reduced-motion` (disable animated transitions)
- Below 400px width, charts switch to simplified tabular fallback

---

## Form & Input Components

---

### Buttons

**Purpose:** Primary interactive trigger elements for actions throughout the application.

**Variants:**

| Variant | Appearance | Usage |
|---|---|---|
| **Primary** | Solid `gradient-brand` background, white text | Main CTAs: "Calculate Score", "Generate Leaderboard" |
| **Secondary** | Outlined with `brand-primary` border, transparent background | Secondary actions: "Export CSV", "View Details" |
| **Danger** | Solid `status-error` background, white text | Destructive: "Reset Scores", "Delete Match" |
| **Ghost** | Transparent background, text-colored | Tertiary: "Cancel", "Back", in-table actions |
| **Icon** | Square button with icon only | Theme toggle, collapse sidebar, close modal |

**Sizes:**

| Size | Height | Padding | Font Size |
|---|---|---|---|
| `sm` | 32px | `space-2` horizontal | `text-sm` |
| `md` | 40px | `space-4` horizontal | `text-base` |
| `lg` | 48px | `space-5` horizontal | `text-lg` |

**States:**

| State | Behavior |
|---|---|
| Default | Standard appearance per variant |
| Hover | Slight brightness increase, cursor pointer |
| Active / Pressed | Scale down to 0.97, brief shadow reduction |
| Focus | Focus ring using `border-medium` with `brand-primary` color |
| Disabled | `opacity-disabled`, cursor not-allowed, no hover effects |
| Loading | Spinner icon replaces text, button width maintained |

**Expected Behavior:**

- All buttons use `radius-md` border radius
- Press animation uses `duration-fast` timing
- Focus ring visible only on keyboard navigation (`:focus-visible`)
- Loading state prevents double-click submissions
- Icon buttons maintain square aspect ratio

---

### Forms

**Purpose:** Input groups for data entry — used in evaluation score submission, match creation, and prediction review.

**Planned Form Contexts:**

| Form | Purpose |
|---|---|
| **Technical Evaluation Form** | Phase 2 score entry (0–20 per team) |
| **Presentation Evaluation Form** | Phase 3 raw score entry per evaluator |
| **Match Creation Form** | New match setup (teams, date, stage) |
| **Score Recalculation Form** | Select match and trigger re-scoring |

**Input Types:**

| Type | Appearance | Usage |
|---|---|---|
| **Text Input** | Single-line field with label | Team names, match IDs |
| **Number Input** | Numeric field with min/max constraints | Score entry fields |
| **Select / Dropdown** | Single-select menu | Match selection, team selection |
| **Date Picker** | Calendar-style date selector | Match scheduling |
| **Textarea** | Multi-line text field | Notes, comments |

**States (per input):**

| State | Behavior |
|---|---|
| Default | Border `border-thin` with `surface-tertiary` color |
| Focus | Border color shifts to `brand-primary`, glow shadow applied |
| Filled | Retains focus styling briefly, then returns to default with value displayed |
| Error | Border color `status-error`, error message below in `text-sm` |
| Disabled | `opacity-disabled`, no interaction |
| Read-Only | Slightly muted background, no border focus effect |

**Expected Behavior:**

- All inputs are 40px height (consistent with `md` button size)
- Labels positioned above inputs
- Error messages use `aria-describedby` for accessibility
- Inline validation triggers on blur (not on every keystroke)
- Submit buttons disabled until form is valid
- Form-level error summary at top for multiple validation failures

---

## Feedback Components

---

### Modals

**Purpose:** Overlay dialogs for confirmations, detail views, and focused interactions.

**Planned Modal Contexts:**

| Modal | Purpose |
|---|---|
| **Confirm Action** | "Are you sure you want to calculate scores for Match #12?" |
| **Score Detail** | Expanded score breakdown overlay |
| **Error Detail** | Full error message with trace information |
| **Export Options** | Format and date range selection for exports |

**States:**

| State | Behavior |
|---|---|
| Closed | Not rendered in DOM |
| Opening | Backdrop fades in, modal scales in with `scale-in` animation |
| Open | Full content visible, backdrop active |
| Closing | Reverse animation, then removed from DOM |

**Expected Behavior:**

- Backdrop uses `surface-base` at 60% opacity
- Modal container uses `surface-elevated` background
- Border radius: `radius-xl`
- Focus trapped within modal while open
- Close via: X button, Escape key, or backdrop click (configurable)
- Scroll locked on body while modal is open
- Z-index: `z-modal` (400)

---

### Toast Notifications

**Purpose:** Non-blocking feedback messages for async operations.

**Variants:**

| Variant | Appearance | Usage |
|---|---|---|
| **Success** | `status-success` accent | "Scores calculated successfully" |
| **Error** | `status-error` accent | "Failed to submit evaluation" |
| **Warning** | `status-warning` accent | "Freeze deadline approaching" |
| **Info** | `status-info` accent | "Leaderboard updated" |

**States:**

| State | Behavior |
|---|---|
| Entering | Slides in from top-right with `slide-in-right` animation |
| Visible | Static with auto-dismiss countdown (default: 5 seconds) |
| Dismissing | Fades out with `fade-in` reversed |
| Hovering | Pause auto-dismiss timer on hover |

**Expected Behavior:**

- Maximum 3 toasts visible simultaneously, stacked vertically
- Each toast includes: icon, message text, optional action link, dismiss button
- Z-index: `z-toast` (600)
- Position: fixed, top-right corner with `space-4` offset
- Auto-dismiss after 5s (errors: 8s, or manual dismiss only)

---

### Loading Skeletons

**Purpose:** Placeholder UI rendered while data is being fetched, matching the shape of expected content.

**Usage:** Every data-dependent component has a corresponding skeleton state.

**Planned Skeletons:**

| Target Component | Skeleton Shape |
|---|---|
| Dashboard Stat Card | Rectangular block for number + label |
| Leaderboard Table | Row placeholders matching column widths |
| Team Card | Card-shaped placeholder with avatar circle + text lines |
| Score Breakdown | Horizontal bar placeholders per dimension |
| Charts | Chart-area-shaped rectangle |

**Expected Behavior:**

- Uses `skeleton-shimmer` animation (gradient sweep left to right)
- Skeleton shapes match actual component dimensions closely
- Transition from skeleton → real content uses `fade-in` animation
- Respects `prefers-reduced-motion` (static gray placeholder instead)

---

### Empty States

**Purpose:** Informative placeholder when a data view has no content to display.

**Usage:** Displayed inside any data component when the dataset is empty.

**Contents:**

- Relevant illustration or icon
- Descriptive heading ("No matches scored yet")
- Supporting text explaining next steps
- Optional CTA button ("Create First Match")

**Expected Behavior:**

- Centered horizontally and vertically within the parent container
- Uses `text-secondary` color for subdued messaging
- Icon/illustration uses muted brand colors
- CTA button uses `secondary` variant

---

## Branding Components

---

### Rank Badge

**Purpose:** Visual indicator of a team's leaderboard position.

**Variants:**

| Rank | Style |
|---|---|
| 1st | Gold gradient background (`gradient-rank-1`), trophy icon |
| 2nd | Silver background (`rank-2`), medal icon |
| 3rd | Bronze background (`rank-3`), medal icon |
| 4th+ | Neutral `surface-tertiary` background, number only |

**Expected Behavior:**

- Circular or rounded-square shape using `radius-full` or `radius-sm`
- Size: 32×32 for inline, 48×48 for featured display
- Number centered with `font-display` and `weight-extrabold`
- 1st place may include subtle `pulse-glow` animation

---

### Grade Badge

**Purpose:** Displays the A / B / C multiplier grade assigned to a team for a specific match.

**Variants:**

| Grade | Color Token | Label |
|---|---|---|
| A | `grade-a` | "Grade A — 3×" |
| B | `grade-b` | "Grade B — 2×" |
| C | `grade-c` | "Grade C — 1×" |

**Expected Behavior:**

- Pill-shaped using `radius-full`
- Background uses grade color at 15% opacity, text uses grade color at 100%
- Includes multiplier value in parentheses
- Tooltip on hover showing full grade criteria

---

### Phase Indicator

**Purpose:** Shows the completion status of the three evaluation phases.

**Appearance:** Three connected dots/segments representing Phase 1, Phase 2, Phase 3.

**States per Phase:**

| State | Appearance |
|---|---|
| Completed | Filled with `status-success`, checkmark icon |
| In Progress | Filled with `brand-primary`, animated pulse |
| Pending | Outlined with `text-tertiary`, no fill |

**Expected Behavior:**

- Connecting lines between phases show progress
- Labels below each dot: "AI Accuracy", "Technical", "Presentation"
- Compact variant (icon-only) for Dashboard card usage
- Full variant (with labels and scores) for detail pages

---

## Component Design Rules

### Spacing Consistency

- All card inner padding: `space-5`
- Gap between cards in a grid: `space-4`
- Section vertical spacing: `space-8`
- Related element grouping: `space-2` to `space-3`

### Color Usage

- Never use raw hex values — always reference design tokens
- Semantic colors for status, brand colors for identity, surface colors for containers
- Ensure all text-on-background combinations meet WCAG AA contrast

### Typography Usage

- `font-display` for headings, ranks, and hero numbers
- `font-body` for all body text, labels, and descriptions
- `font-mono` for numerical scores, JSON, and code

### Animation Usage

- All animations optional — degrade gracefully with `prefers-reduced-motion`
- Keep interaction feedback animations under 200ms
- Content reveal animations under 400ms
- Only the score counter and rank reveal use longer durations

---

## Related Documents

| Document | Purpose |
|---|---|
| [Design System](DESIGN_SYSTEM.md) | Visual philosophy and UX principles |
| [Design Tokens](DESIGN_TOKENS.md) | Concrete token values for implementation |
| [Frontend Architecture](FRONTEND_ARCHITECTURE.md) | Technical component organization |
