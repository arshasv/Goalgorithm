# FIFA Elite Analytics — Design System

> This document defines the visual identity, design philosophy, and user experience principles for the FIFA Elite Analytics frontend. It serves as the single source of truth for all UI/UX decisions.

---

## Product Identity

**Product Name:** FIFA Elite Analytics

**Tagline:** AI-Powered Scoring Intelligence for Tournament Excellence

**Product Type:** Professional sports analytics dashboard — purpose-built for organizers, evaluators, and participants of the FIFA AI Match Prediction Challenge.

**Core Identity:**

| Attribute | Description |
|---|---|
| **Personality** | Authoritative, precise, data-driven, premium |
| **Tone** | Professional but engaging — never gamified, never casual |
| **Audience** | Tournament organizers, technical committee members, participating AI teams |
| **Context** | High-stakes scoring evaluation — accuracy, clarity, and trust are paramount |

---

## Brand Personality

FIFA Elite Analytics sits at the intersection of four identity pillars. Every design decision must reinforce all four simultaneously.

### 1. FIFA Inspired

The platform inherits the gravitas and visual authority of FIFA's official tournament presence. This means:

- **Institutional weight** — The interface should feel like it belongs in an official FIFA broadcast booth, not a hobby project
- **Tournament DNA** — Colors, typography, and layout echo the structure of official World Cup graphics: deep blues, golds, structured stat panels
- **Crest-level polish** — Every visual element is crafted with the precision of a tournament emblem — no rough edges, no placeholder aesthetics
- **Legacy awareness** — The system carries the weight of competitive results; the design must reflect that permanence

### 2. Premium Sports Dashboard

The interface is a command center for live tournament operations:

- **Broadcast quality** — Score tickers, rank overlays, and stat panels styled with the clarity of a televised match graphic
- **Stadium atmosphere** — Dark mode evokes the floodlit intensity of a night match; light mode captures the crisp authority of a press conference
- **Medal-tier hierarchy** — Gold, silver, and bronze are not decorative — they are functional signals for 1st, 2nd, and 3rd place
- **Athletic precision** — Numbers are presented with the same zero-ambiguity standard as an official scoreboard

### 3. AI Analytics Platform

Beneath the sports exterior lies a serious data analytics tool:

- **Algorithmic transparency** — Every score is traceable back to its formula and inputs
- **Multi-dimensional data** — Four scoring dimensions (winner, scoreline, probability, player) displayed simultaneously without clutter
- **Trend intelligence** — Score progression charts, cumulative tracking, and rank movement indicators reveal patterns over time
- **Computed confidence** — The system communicates that scores are machine-calculated, not human-estimated

### 4. Competition Scoring System

At its core, this is an evaluation engine with strict rules:

- **Fairness is visible** — The same scoring rules apply to every team, and the interface makes that transparency tangible
- **Phase clarity** — The three-phase evaluation model (AI Accuracy /60 + Technical /20 + Presentation /20 = Total /100) is always legible
- **Immutable records** — Scored results look permanent and official, reinforcing trust in the system
- **Deadline awareness** — Freeze deadlines, submission windows, and scoring triggers are surfaced with appropriate urgency

---

## Overall Visual Style

### Design Philosophy

FIFA Elite Analytics blends the visual energy of a premium sports broadcast with the structural clarity of a SaaS analytics platform. The interface should feel like a command center — powerful yet calm, dense with information yet never overwhelming.

The visual system is built on a principle of **structured intensity** — every element has a clear role, and visual emphasis is allocated like a budget. Rank gets the most visual weight. Final score gets the second most. Everything else supports those two anchors.

### Visual Pillars

| Pillar | Intent |
|---|---|
| **Precision** | Every number, rank, and score is presented with typographic clarity and visual hierarchy |
| **Confidence** | Bold contrast ratios, stable layouts, and decisive color usage convey institutional trust |
| **Energy** | Subtle motion, gradient accents, and tournament theming inject controlled dynamism |
| **Density** | Dashboard-grade information density — multiple data panels visible simultaneously |

### Aesthetic References

The visual language draws from:

- **Sports broadcast overlays** — score tickers, rank badges, stat panels
- **Financial analytics dashboards** — Bloomberg-style data density with clean grid systems
- **Premium SaaS platforms** — Linear, Vercel, Stripe dashboard aesthetics
- **FIFA official branding** — tournament-grade polish, deep blues, gold accents

### Surface Treatment

The interface uses a **layered surface model** where depth communicates importance:

- **Base layer** — The deepest background; the canvas that all content sits upon
- **Content layer** — Cards, tables, and panels sit one level above the base with subtle elevation
- **Interactive layer** — Modals, dropdowns, and popovers float above content with stronger shadow or glow
- **Notification layer** — Toasts and alerts occupy the highest visual plane

In dark mode, depth is communicated through **lightness stepping** (lighter surfaces are higher). In light mode, depth is communicated through **shadow cascading** (stronger shadows are higher).

### Visual Rhythm

- **Horizontal rhythm** — Content aligns to a column grid; numbers right-align for decimal comparison
- **Vertical rhythm** — Consistent spacing scale creates a visual heartbeat down the page
- **Typographic rhythm** — Display font for impact numbers, body font for reading, mono font for data

---

## Design Principles

### 1. Data First

Every pixel of interface decoration must justify its existence by serving the data. If a visual element does not help the user read, compare, or understand a score — it is noise.

- Scores are the hero of every view — they get the largest type, the strongest contrast, and the most prominent position
- Decorative elements are minimized — no gratuitous illustrations, no ornamental dividers
- Whitespace is used to frame data, not to fill empty space
- Charts and visualizations supplement tables — they never replace the raw numbers entirely

### 2. Clean Rankings

The leaderboard is the heart of the product. Rankings must be instantly legible:

- Rank position is always the **leftmost, largest element** in any team listing
- Position changes (up/down/stable) are shown with directional indicators, not just numbers
- Medal treatment (gold/silver/bronze) for top 3 creates instant visual anchors
- Tied ranks are handled explicitly — same rank number, next position adjusted
- Phase score columns are always visible alongside rank — never hidden behind a click

### 3. Fast Comparison

Users need to compare teams and scores instantly, without mental arithmetic:

- Score bars provide proportional visual comparison at a glance
- Consistent column alignment across all tables ensures vertical scanning
- Phase breakdown always uses the same visual format: segmented bar (60 + 20 + 20)
- Color-coded grade badges (A/B/C) allow instant multiplier tier comparison
- Match-to-match score trends use consistent directional color coding (green up, red down)

### 4. Professional Dashboard UI

The interface follows professional SaaS dashboard conventions:

- **Grid-based layout** — Content organized in a predictable card grid system
- **Sidebar navigation** — Persistent, hierarchical, with active state indicators
- **Contextual actions** — Action buttons appear where their data lives, not in disconnected toolbars
- **Progressive disclosure** — Dashboard shows aggregates, detail pages show breakdowns, raw data is always reachable
- **Status communication** — Every entity (match, prediction, score) has a clear visual status indicator

### 5. Accessible by Default

Accessibility is not an afterthought layer — it is embedded into every component decision.

---

## Page Experience

### Dashboard (Home)

The primary landing page. Provides a tournament command-center view:

- **Leaderboard snapshot** — Top 5 teams with ranks, scores, and trend indicators
- **Phase progress tracker** — Visual representation of Phase 1 / 2 / 3 completion
- **Recent activity feed** — Latest scoring events, submissions, evaluations
- **Quick stats** — Matches scored, predictions received, teams active

### Leaderboard Page

The centerpiece of the application:

- Full ranked table with all teams
- Expandable rows showing phase-level score breakdown
- Visual score bars for at-a-glance comparison
- Sorting and filtering controls
- Export capability (CSV / PDF planned)

### Match Detail Page

Per-match scoring deep-dive:

- Match metadata (teams, date, stage)
- Actual result display
- Per-team prediction comparison
- Score breakdown (winner / scoreline / probability / player dimensions)
- Rank and multiplier assignment

### Team Profile Page

Per-team scoring history:

- Cumulative score progression chart
- Match-by-match score timeline
- Phase 1 / 2 / 3 individual scores
- Current rank and grade tier

### Evaluation Pages

- **Phase 2 — Technical Evaluation:** Committee score entry interface
- **Phase 3 — Presentation Evaluation:** Peer score entry with multiplier preview

### Administration Pages

- Match management (create, freeze, complete)
- Prediction submission viewer
- Score recalculation trigger
- Audit log viewer

---

## Dashboard Feeling

### Emotional Objective

The dashboard should feel like walking into a **tournament operations room** — a place where every screen on the wall shows live data, every number matters, and the atmosphere is calm but charged with importance. It is not a consumer app. It is not a game. It is a professional instrument for managing high-stakes competitive evaluation.

### Functional Atmosphere

| Quality | How It Manifests |
|---|---|
| **Authority** | Heavy typographic weight on key numbers; dark surfaces with gold highlights suggest institutional prestige |
| **Clarity** | Generous whitespace around data clusters; no decorative noise competing with scores |
| **Liveness** | Subtle pulse animations on active phases; timestamp freshness indicators on all data |
| **Control** | Action buttons are clearly labeled, gated behind confirmations, and visually separated from data display |
| **Trust** | Scores look computed and permanent — monospaced typography, precise decimal display, audit trail accessibility |

### Information Architecture

The dashboard follows a **hub-and-spoke model:**

```
                    ┌───────────────┐
                    │   Dashboard   │  ← Hub: aggregated overview
                    │   (Home)      │
                    └───────┬───────┘
           ┌────────────────┼────────────────┐
           ▼                ▼                ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │ Leaderboard │  │   Matches   │  │    Teams     │  ← Spokes: detail views
    └─────────────┘  └─────────────┘  └─────────────┘
           │                │                │
           ▼                ▼                ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │  Score       │  │  Match      │  │  Team       │  ← Deep dives
    │  Breakdown   │  │  Detail     │  │  Profile    │
    └─────────────┘  └─────────────┘  └─────────────┘
```

Every navigation path leads from **aggregated overview → filtered list → individual detail**. Users never need to go sideways — they drill down and come back up.

### Dashboard Card Zones

The main dashboard is divided into four visual zones:

| Zone | Position | Content |
|---|---|---|
| **Command Strip** | Top row, full width | Quick stats — matches scored, predictions in, teams active |
| **Leaderboard Hero** | Left two-thirds, below command strip | Top 5 ranked teams with scores and trend arrows |
| **Phase Tracker** | Right one-third, beside leaderboard | Three-phase progress indicator with status per phase |
| **Activity Stream** | Below leaderboard | Chronological feed of recent scoring events |

### Data Presentation Hierarchy

1. **Rank** — Always the most prominent element (large, bold, color-coded)
2. **Final Score** — Immediately adjacent to rank
3. **Phase Breakdown** — Stacked or segmented bar visualization
4. **Dimension Scores** — Available on expansion or drill-down
5. **Raw Data** — Accessible but never the default view

---

## Leaderboard Presentation

The leaderboard is the **single most important view** in the entire application. Every design decision about the leaderboard optimizes for one question: *Who is winning, and by how much?*

### Visual Structure

The leaderboard is a **full-width ranked table** where each row represents one team. The table has these visual zones reading left to right:

```
┌───────┬──────────────┬─────────────────────────────────────────┬────────────┐
│ RANK  │  TEAM NAME   │     PHASE SCORE BREAKDOWN (bars)        │ FINAL SCORE│
│  #1   │  Team A  │  ████████████████  ████  ████           │   98.2     │
│       │              │    AI: 60.0       T:19  P:19.2          │   /100     │
├───────┼──────────────┼─────────────────────────────────────────┼────────────┤
│  #2   │  Team B   │  ████████          ███   ██             │   44.47    │
│       │              │    AI: 16.0       T:17  P:11.47         │   /100     │
└───────┴──────────────┴─────────────────────────────────────────┴────────────┘
```

### Rank Column Treatment

| Position | Visual Treatment |
|---|---|
| **1st Place** | Gold gradient background, trophy icon, `text-5xl` rank number |
| **2nd Place** | Silver background, medal icon, `text-4xl` rank number |
| **3rd Place** | Bronze background, medal icon, `text-4xl` rank number |
| **4th–5th** | Neutral surface, plain number, `text-3xl` rank number |

Rank numbers use `font-display` with `weight-extrabold`. They are the first element the eye reaches.

### Phase Score Bars

Each team row includes a **segmented horizontal bar** showing the three phase contributions:

- **AI Accuracy (blue)** — Proportional to /60 scale
- **Technical (teal)** — Proportional to /20 scale
- **Presentation (gold)** — Proportional to /20 scale

The bars are rendered at the same horizontal scale for all teams, making relative performance instantly visible. A team with 60/60 AI Accuracy fills the blue segment completely; a team with 16/60 fills roughly one quarter.

### Score Display Rules

- All scores displayed to **two decimal places** using `font-mono`
- The `/100` denominator is shown in `text-tertiary` beside the final score
- Phase sub-scores show their denominators: `/60`, `/20`, `/20`
- Zero scores are displayed in `status-error` color, never blank
- Perfect scores are displayed in `status-success` color

### Expanded Row Detail

Clicking a leaderboard row expands it to reveal the **per-match breakdown**:

- List of all matches scored for that team
- Per-match base score, grade, multiplier, and earned score
- Dimension-level breakdown per match (winner / scoreline / probability / player)
- Cumulative total building up to the Phase 1 normalized score

### Leaderboard States

| State | Behavior |
|---|---|
| **Loading** | Skeleton rows with shimmer animation matching column widths |
| **Empty** | Centered message: "No scores calculated yet" with Phase Indicator showing all pending |
| **Partial** | Teams with scores ranked normally; teams with no scores appear at bottom in muted style |
| **Complete** | Full ranking with all phases scored; final positions displayed |
| **Stale** | Timestamp indicator shows when leaderboard was last computed; refresh CTA available |

---

## Score Visualization Approach

Scores in FIFA Elite Analytics appear in multiple contexts — dashboard cards, leaderboard tables, match details, and team profiles. The visualization approach is consistent across all contexts, scaling in detail level rather than changing visual language.

### The Score Anatomy

Every score in the system traces back to this hierarchy:

```
Grand Total (/100)
├── Phase 1: AI Accuracy (/60)
│   └── Normalized from cumulative match earned scores
│       └── Per-Match Earned Score = Base Score × Multiplier
│           └── Base Score (/25)
│               ├── Winner Prediction     (/5)
│               ├── Scoreline Exactness   (/10)
│               ├── Probability Accuracy  (/5)
│               └── Player Performance    (/5)
├── Phase 2: Technical (/20)
│   └── Committee-assigned score
└── Phase 3: Presentation (/20)
    └── Peer-graded score × multiplier, normalized
```

### Visualization by Context

| Context | Detail Level | Visual Format |
|---|---|---|
| **Dashboard stat card** | Grand total only | Large single number with rank badge |
| **Leaderboard row** | Phase breakdown | Segmented bar + three phase numbers + total |
| **Leaderboard expanded row** | Match-level | List of per-match earned scores |
| **Match detail page** | Dimension breakdown | Four horizontal bars (winner/scoreline/probability/player) |
| **Team profile page** | Score progression | Line chart of cumulative score over matches |
| **Score breakdown card** | Full decomposition | All four dimensions + base score + multiplier + earned |

### Number Formatting Standards

| Score Type | Format | Font | Example |
|---|---|---|---|
| Grand Total | 1 decimal place | `font-display`, `text-4xl` | `98.2` |
| Phase Score | 1 decimal place | `font-mono`, `text-lg` | `60.0` |
| Base Score | Integer | `font-mono`, `text-base` | `25` |
| Dimension Score | Integer | `font-mono`, `text-sm` | `5` |
| Multiplier | 1 decimal place + × suffix | `font-display`, `text-lg` | `3×` |
| Earned Score | 1 decimal place | `font-mono`, `text-base` | `75.0` |

### Score Color Coding

Scores are color-coded by **achievement level**, not by raw value:

| Achievement | Color Token | Trigger |
|---|---|---|
| **Perfect** | `status-success` | Score equals maximum for that dimension/phase |
| **Partial** | `text-primary` (default) | Score is between 0 and max, exclusive |
| **Zero** | `status-error` | Score is exactly 0 |

### Grade Multiplier Visualization

After per-match ranking, teams receive a grade that determines their multiplier:

| Grade | Multiplier | Badge Color | Visual Treatment |
|---|---|---|---|
| **A** | 3× | `grade-a` (green) | Filled pill badge, bold multiplier text |
| **B** | 2× | `grade-b` (amber) | Filled pill badge, medium multiplier text |
| **C** | 1× | `grade-c` (red) | Outlined pill badge, standard multiplier text |

The grade badge always appears adjacent to the earned score, showing the transformation: `Base Score × Grade = Earned Score`.

### Chart Conventions

All charts across the application follow these visual rules:

- **Consistent palette** — Charts use `chart-1` through `chart-5` tokens in order
- **Labeled axes** — Every axis has a clear label with units
- **Tooltips on hover** — Exact values displayed on data point interaction
- **Gridlines** — Subtle horizontal gridlines only; no vertical gridlines
- **Zero baseline** — All bar and line charts start at zero, never truncated
- **Responsive** — Charts resize proportionally; below 400px they degrade to tabular fallback
- **Accessible** — Chart data also available as a screen-reader-accessible table

---

## User Experience Goals

### For Tournament Organizers

| Goal | Design Response |
|---|---|
| Know the current standings instantly | Dashboard leaderboard widget, always visible |
| Trigger scoring with confidence | Clear action buttons with confirmation modals |
| Audit any score | Drill-down from leaderboard → match → dimension breakdown |
| Manage matches efficiently | Streamlined match lifecycle controls |

### For Committee Members

| Goal | Design Response |
|---|---|
| Enter technical scores quickly | Focused evaluation form with team context |
| Review entered scores | Read-only summary after submission |
| Avoid input errors | Inline validation with range indicators |

### For Participating Teams (Read-Only)

| Goal | Design Response |
|---|---|
| Check my rank | Highlighted own-team row in leaderboard |
| Understand my scores | Clear phase breakdown with dimension-level detail |
| Track my progress | Match-by-match score timeline |

---

## Themes

The application offers two named themes, each with a distinct atmosphere rooted in the FIFA tournament experience.

### Strategy

The application ships with **FIFA Night Stadium (dark) as default** and FIFA Executive (light) as an opt-in toggle. The dark theme aligns with the premium sports analytics aesthetic and reduces eye strain during extended scoring sessions.

### Implementation Principles

| Principle | Detail |
|---|---|
| **CSS Custom Properties** | All colors defined as CSS variables on `:root` and `[data-theme="light"]` |
| **Semantic Token Names** | Variables named by purpose (`--color-surface-primary`) not hue (`--blue-900`) |
| **No Hardcoded Colors** | Zero raw hex/rgb values in component styles — all reference design tokens |
| **System Preference Detection** | Initial theme set via `prefers-color-scheme` media query |
| **Persistent Preference** | User toggle saved to `localStorage` and applied on load |
| **Smooth Transition** | Theme switch applies a brief `transition` on `background-color` and `color` properties |

---

### Theme: FIFA Night Stadium (Dark)

**Atmosphere:** The intensity of a floodlit knockout match. Deep navy surfaces evoke the sky above a night stadium. Gold and electric blue accents cut through the darkness like stadium lights.

**When to use:** Default theme. Extended scoring sessions, presentation environments, evening work.

**Visual characteristics:**

- Deep navy / charcoal backgrounds — not pure black (`#0B0F19` base, not `#000000`)
- Slightly desaturated accent colors to avoid glare on dark surfaces
- Elevated surfaces use **lighter shades** (not shadows) for depth perception
- Gold accents (`#F5A623`) for rank highlights glow against the dark canvas
- Score numbers rendered in high-contrast off-white with slight warm tint
- Subtle border glow replaces drop shadows for card elevation
- Gradient accents on CTAs and rank badges add stadium-light energy
- Text contrast ratios exceed WCAG AA minimum (4.5:1 for body, 3:1 for large text)

**Mood keywords:** Intense, focused, prestigious, immersive

---

### Theme: FIFA Executive (Light)

**Atmosphere:** The polished clarity of a FIFA boardroom or press conference. Clean white surfaces with warm undertones project authority and transparency. Full-saturation brand blues convey institutional confidence.

**When to use:** Daytime use, formal presentations, printed exports, accessibility preference.

**Visual characteristics:**

- Warm off-white backgrounds — not pure white (`#F8F9FC` base, not `#FFFFFF`)
- Full-saturation brand colors for maximum legibility against light surfaces
- Traditional **shadow-based depth** for cards and elevated elements
- Brand blue (`#0A5AE0`) anchors the visual hierarchy on a neutral canvas
- Gold accents appear richer and warmer against the light background
- Clean divider lines and subtle borders structure the layout
- Charts and data visualizations use full-saturation palette for clarity
- Maintained WCAG AA contrast ratios across all text and interactive elements

**Mood keywords:** Authoritative, transparent, official, crisp

---

## Accessibility Guidelines

### Standards

The application targets **WCAG 2.1 Level AA** compliance as a baseline.

### Color Contrast

| Element | Minimum Contrast Ratio |
|---|---|
| Body text | 4.5:1 |
| Large text (18px+ or 14px+ bold) | 3:1 |
| Interactive elements (buttons, links) | 4.5:1 |
| Non-text elements (icons, borders) | 3:1 |
| Focus indicators | 3:1 against adjacent colors |

### Keyboard Navigation

- All interactive elements focusable via `Tab` / `Shift+Tab`
- Focus order follows visual reading order
- Custom components implement appropriate `role` and `aria-*` attributes
- Modal dialogs trap focus and return focus on close
- Skip-to-content link on every page

### Screen Reader Support

- Semantic HTML elements used throughout (`nav`, `main`, `section`, `table`, `form`)
- Dynamic content updates announced via `aria-live` regions
- Score changes and rank updates use `aria-live="polite"`
- Data tables include proper `<caption>`, `<thead>`, and `scope` attributes
- Icons paired with `aria-label` or hidden via `aria-hidden="true"` when decorative

### Motion and Animation

- All animations respect `prefers-reduced-motion` media query
- No content conveyed exclusively through animation
- Loading states use both motion and text indicators
- Transition durations kept under 300ms for UI feedback

### Form Accessibility

- Every input has an associated `<label>` element
- Error messages linked via `aria-describedby`
- Required fields marked with `aria-required="true"` and visual indicator
- Form validation errors announced to screen readers

### Touch and Pointer

- Minimum touch target size: 44×44 CSS pixels
- Adequate spacing between interactive targets
- No hover-only information — hover content also accessible via focus or click

---

## Responsive Design Strategy

### Breakpoint Philosophy

The layout is designed **desktop-first** — the primary use case is organizers working on desktop/laptop displays. Mobile layouts are supported but deprioritized.

| Tier | Range | Layout |
|---|---|---|
| **Desktop** | ≥1280px | Full sidebar + multi-column dashboard |
| **Tablet** | 768px–1279px | Collapsed sidebar + stacked panels |
| **Mobile** | <768px | Bottom nav + single-column stack |

### Responsive Rules

- Dashboard cards reflow from grid to stack below tablet breakpoint
- Leaderboard table scrolls horizontally on small screens with sticky rank/team columns
- Sidebar collapses to icon-only rail at tablet, hidden entirely on mobile
- Charts resize proportionally; below 400px width they switch to simplified views
- Typography scales down by one step at mobile breakpoint

---

## Design System Governance

### Who Owns This Document

The frontend team maintains this document. All visual decisions flow from here.

### Change Process

1. Propose a change via a documented issue or discussion
2. Validate against the visual pillars defined above
3. Update this document before implementing in code
4. Ensure consistency across all affected components

### Related Documents

| Document | Purpose |
|---|---|
| [Design Tokens](DESIGN_TOKENS.md) | Concrete values for colors, typography, spacing |
| [Component Guidelines](COMPONENT_GUIDELINES.md) | Per-component specs and states |
| [Frontend Architecture](FRONTEND_ARCHITECTURE.md) | Technical implementation structure |
