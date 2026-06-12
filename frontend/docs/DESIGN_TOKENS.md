# FIFA Elite Analytics — Design Tokens

> This document defines the concrete design token values for the FIFA Elite Analytics frontend. Tokens are organised by the two named themes: **FIFA Executive** (light) and **FIFA Night Stadium** (dark). No CSS is generated here — only design decisions are captured.

---

## Theme Overview

| Theme | Mode | Atmosphere |
|---|---|---|
| **FIFA Executive** | Light | Boardroom clarity — warm whites, authoritative navy, crisp gold |
| **FIFA Night Stadium** | Dark | Floodlit intensity — deep midnight, electric blue, glowing gold |

---

## Color System

All color tokens support both themes. Tokens are named by **semantic purpose**, not by hue — this ensures they remain valid across theme switches.

---

### Background & Surface Colors

> Surfaces define the layered depth of the UI. Always use the appropriate surface level — never skip a layer.

| Token | FIFA Executive (Light) | FIFA Night Stadium (Dark) | Usage Guideline |
|---|---|---|---|
| `color-bg` | `#F8FAFC` | `#020617` | Page-level canvas. Never place content directly on this without a surface card. |
| `color-surface` | `#FFFFFF` | `#0F172A` | Primary card and panel background. Default container for all content. |
| `color-surface-secondary` | `#EEF2F7` | `#172033` | Sidebar, nested panels, table row alternates. One level below `color-surface`. |
| `color-surface-hover` | `rgba(0,0,0,0.03)` | `rgba(255,255,255,0.04)` | Applied on hover over interactive surface areas. Never use as a base. |
| `color-surface-elevated` | `#FFFFFF` | `#1E2742` | Modals, dropdowns, floating elements. Highest surface plane. |

---

### Brand Colors

> Brand colors establish FIFA identity. `primary` anchors all interactive elements. `secondary` provides informational accent. `accent` marks positive data and trends.

| Token | FIFA Executive (Light) | FIFA Night Stadium (Dark) | Usage Guideline |
|---|---|---|---|
| `color-primary` | `#063B8E` | `#2563EB` | CTAs, active nav items, links, focus rings, primary buttons. Never use for decorative elements only. |
| `color-secondary` | `#009FE3` | `#38BDF8` | Secondary actions, info badges, chart series 2, selected filter chips. |
| `color-accent` | `#00B8A9` | `#14B8A6` | Positive trends, score progress bars, Phase 1 bar segment. Complements primary without competing. |

---

### Medal & Rank Colors

> These are the most visually prominent colors in the application. Used exclusively for rank signaling — never for general decoration.

| Token | FIFA Executive (Light) | FIFA Night Stadium (Dark) | Usage Guideline |
|---|---|---|---|
| `color-gold` | `#D4AF37` | `#FACC15` | 1st place rank badge, Grade A multiplier highlight, Phase 3 score bar. |
| `color-silver` | `#A8A9AD` | `#CBD5E1` | 2nd place rank badge only. |
| `color-bronze` | `#CD7F32` | `#D97706` | 3rd place rank badge only. |

**Usage rules:**
- Gold, silver, bronze must always appear paired with rank number or explicit rank context
- Never use gold as a general "positive" color — use `color-status-success` instead
- In FIFA Executive, gold reads warmer; in FIFA Night Stadium, gold glows brighter — both are correct

---

### Semantic / Status Colors

> Status colors communicate system state. Each has a single, consistent meaning throughout the application.

| Token | FIFA Executive (Light) | FIFA Night Stadium (Dark) | Meaning |
|---|---|---|---|
| `color-status-success` | `#16A34A` | `#22C55E` | Correct prediction, passing validation, completed phase, dimension scored |
| `color-status-error` | `#DC2626` | `#EF4444` | Failed validation, zero score, submission error, overdue deadline |
| `color-status-warning` | `#F59E0B` | `#FBBF24` | Approaching deadline, pending action, score not yet calculated |
| `color-status-info` | `#009FE3` | `#38BDF8` | Neutral information, system messages, in-progress phases |

**Usage rules:**
- Status colors must never be used purely aesthetically
- Always pair a status color with a status icon or text label for accessibility
- Zero scores use `color-status-error`; perfect scores use `color-status-success`; partial scores use `text-primary`

---

### Text Colors

> Text colors follow a three-level hierarchy: primary for key content, secondary for supporting content, tertiary for inactive/placeholder content.

| Token | FIFA Executive (Light) | FIFA Night Stadium (Dark) | Usage Guideline |
|---|---|---|---|
| `color-text-primary` | `#0F172A` | `#F1F5F9` | Headings, scores, ranks, table cell values. Maximum contrast — reserved for highest-priority content. |
| `color-text-secondary` | `#64748B` | `#94A3B8` | Labels, descriptions, metadata, table headers. Supporting role only. |
| `color-text-muted` | `#94A3B8` | `#475569` | Timestamps, placeholder text, disabled labels, hint text. |
| `color-text-inverse` | `#FFFFFF` | `#FFFFFF` | Text placed on dark/brand-colored backgrounds (buttons, badges). |
| `color-text-link` | `#063B8E` | `#60A5FA` | Clickable text links, breadcrumb items. Always underlined or icon-paired. |

---

### Grade Colors (Multiplier Tiers)

> Grade badges appear on every scored match row. Their color immediately communicates multiplier tier.

| Token | FIFA Executive (Light) | FIFA Night Stadium (Dark) | Tier |
|---|---|---|---|
| `color-grade-a` | `#16A34A` | `#22C55E` | Grade A — 3× multiplier (top-ranked team per match) |
| `color-grade-b` | `#F59E0B` | `#FBBF24` | Grade B — 2× multiplier (mid-ranked team per match) |
| `color-grade-c` | `#DC2626` | `#EF4444` | Grade C — 1× multiplier (lowest-ranked team per match) |

**Usage rules:**
- Grade colors are pill-shaped badges: colored text on 10–15% opacity background of the same color
- Always show the multiplier value (e.g., "Grade A — 3×") alongside the badge — color alone is not sufficient

---

### Chart Palette

> Chart colors are assigned in order. Never skip or reorder — the sequence is chosen for distinguishability and theme compatibility.

| Position | Token | FIFA Executive | FIFA Night Stadium | Assigned To |
|---|---|---|---|---|
| 1 | `color-chart-1` | `#063B8E` | `#2563EB` | Primary team / AI Accuracy phase bar |
| 2 | `color-chart-2` | `#009FE3` | `#38BDF8` | Secondary data series / Technical phase bar |
| 3 | `color-chart-3` | `#00B8A9` | `#14B8A6` | Third series / Presentation phase bar |
| 4 | `color-chart-4` | `#DC2626` | `#EF4444` | Negative / error series |
| 5 | `color-chart-5` | `#D4AF37` | `#FACC15` | Highlight series / Grade A annotation |

---

## Typography

### Font Families

Three typefaces cover every distinct content role in the application. Mixing them intentionally creates a clear information hierarchy.

| Token | Typeface | Role | Usage Guideline |
|---|---|---|---|
| `font-display` | `'Sora', sans-serif` | **Display** — headings, logo, winners | All `<h1>`–`<h3>` headings, rank numbers, team name hero text, the app logo wordmark, leaderboard position numbers. Sora's geometric structure echoes FIFA's bold visual language. |
| `font-ui` | `'Inter', sans-serif` | **UI** — buttons, forms, tables | Navigation labels, button text, form inputs, table column headers, sidebar items, badge labels, metadata. Inter's neutrality keeps functional elements readable without drawing attention. |
| `font-data` | `'JetBrains Mono', monospace` | **Data** — scores, ranks, IDs | All numerical score values, team IDs, match IDs, JSON display, audit log entries, phase scores, dimension scores, multiplier values. Monospace ensures decimal points align in columns. |

**Critical rule:** Never use `font-display` for dense body copy. Never use `font-data` for non-numerical UI text.

---

### Font Sizes

| Token | Size | Line Height | Font Family | Usage |
|---|---|---|---|---|
| `text-xs` | 12px | 16px | `font-ui` | Timestamps, audit metadata, help text, form hints |
| `text-sm` | 14px | 20px | `font-ui` | Table cell content, secondary labels, badge text, nav sub-items |
| `text-base` | 16px | 24px | `font-ui` | Body paragraphs, form input values, button labels |
| `text-lg` | 18px | 28px | `font-ui` / `font-display` | Card titles, section labels, sidebar section headers |
| `text-xl` | 20px | 28px | `font-display` | Page subtitles, modal titles |
| `text-2xl` | 24px | 32px | `font-display` | Page-level headings (`<h2>`) |
| `text-3xl` | 30px | 36px | `font-display` | Dashboard section headings (`<h1>`) |
| `text-4xl` | 36px | 40px | `font-display` + `font-data` | Hero score display, main rank number on team card |
| `text-5xl` | 48px | 52px | `font-display` + `font-data` | Leaderboard rank numbers (#1, #2, #3) — maximum visual impact |

---

### Font Weights

| Token | Value | Usage |
|---|---|---|
| `weight-regular` | 400 | Body text, descriptions, table cell values |
| `weight-medium` | 500 | Table headers, form labels, nav items |
| `weight-semibold` | 600 | Card titles, section headings, button labels |
| `weight-bold` | 700 | Phase scores, dimension scores, CTA buttons |
| `weight-extrabold` | 800 | Rank numbers, grand total scores, leaderboard hero figures |

---

### Letter Spacing

| Token | Value | Usage |
|---|---|---|
| `tracking-tight` | -0.025em | Large display headings (Sora at `text-4xl`+) — counteracts optical spacing at large sizes |
| `tracking-normal` | 0 | All body text and UI text — default, no adjustment |
| `tracking-wide` | 0.025em | Badge labels, pill text, small uppercase status labels |
| `tracking-wider` | 0.05em | Overline labels (e.g., "PHASE 1", "AI ACCURACY"), column header uppercase |

---

## Spacing Scale

Spacing uses named semantic steps rather than a raw numeric scale. Each step has a defined purpose — mixing adjacent steps is acceptable, but skipping steps (e.g., using `xs` next to `xl`) signals a layout problem to investigate.

| Token | Value | Usage Guideline |
|---|---|---|
| `space-xs` | 4px | Icon-to-label gap, badge inner padding, tight inline gaps between related elements |
| `space-sm` | 8px | Inner padding for compact elements (chips, small badges), gap between stacked icon rows |
| `space-md` | 16px | Standard card inner padding, form field vertical gap, button horizontal padding |
| `space-lg` | 24px | Gap between cards in a grid, section-level padding, sidebar item vertical gap |
| `space-xl` | 32px | Between card groups and sections, page content area top padding |
| `space-2xl` | 48px | Page-level section separators, major vertical rhythm breaks |
| `space-3xl` | 64px | Top-of-page hero zones, full-width banner padding, layout-level gaps |

**Usage rules:**
- Card inner padding: `space-md` (16px)
- Gap between dashboard cards: `space-lg` (24px)
- Page horizontal margins: `space-xl` (32px) desktop, `space-md` (16px) mobile
- Form field vertical spacing: `space-md` (16px) between fields
- Sidebar item padding: `space-sm` (8px) vertical, `space-md` (16px) horizontal

---

## Border Radius

Radius values scale with element size — smaller elements use tighter radii, larger containers use softer radii. This creates a coherent visual language where every element feels proportionate.

| Token | Value | Usage Guideline |
|---|---|---|
| `radius-none` | 0px | Data table cells, score ticker strips, elements that must read as sharp and official |
| `radius-small` | 6px | Inline badges, grade tier pills, status chips, small icon buttons |
| `radius-medium` | 12px | Standard buttons, text inputs, select dropdowns, form containers |
| `radius-large` | 16px | Dashboard cards, sidebar panels, match cards, team cards |
| `radius-xl` | 24px | Modal dialogs, full-screen overlays, feature hero cards |
| `radius-full` | 9999px | Circular rank badges, avatar elements, toggle switches, pill-shaped filters |

**Usage rules:**
- All interactive form controls (inputs, buttons, dropdowns) use `radius-medium`
- Dashboard data cards use `radius-large`
- Modals use `radius-xl`
- Rank badges for positions #1–#3 use `radius-full` for circular treatment
- Never mix `radius-none` (table cells) with `radius-large` (cards) within the same visual cluster — maintain consistent rounding within a component

---

## Shadows

### FIFA Night Stadium (Dark Mode)

Dark mode uses **border glow** instead of traditional drop shadows. Shadows cast downward are invisible against dark backgrounds — lightness-based borders and colored glows create depth instead.

| Token | Value | Usage |
|---|---|---|
| `shadow-sm` | `0 0 0 1px rgba(255,255,255,0.06)` | Subtle card border on dark surface — visible separation without lifting |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.4)` | Elevated cards, active state panels |
| `shadow-lg` | `0 8px 24px rgba(0,0,0,0.5)` | Dropdowns, context menus, date pickers |
| `shadow-xl` | `0 16px 48px rgba(0,0,0,0.6)` | Modal dialogs, full-screen overlays |
| `shadow-glow-primary` | `0 0 20px rgba(37,99,235,0.2)` | Focus ring glow, active `color-primary` elements |
| `shadow-glow-gold` | `0 0 20px rgba(250,204,21,0.25)` | 1st place rank badge glow, Grade A badge |

### FIFA Executive (Light Mode)

Light mode uses traditional **drop shadows** for depth. Shadows are warm-tinted to avoid cold gray haloes on warm-white surfaces.

| Token | Value | Usage |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(15,23,42,0.05)` | Subtle card depth on white surface |
| `shadow-md` | `0 4px 12px rgba(15,23,42,0.08)` | Elevated cards, active panels |
| `shadow-lg` | `0 8px 24px rgba(15,23,42,0.12)` | Dropdowns, date pickers |
| `shadow-xl` | `0 16px 48px rgba(15,23,42,0.16)` | Modal dialogs, overlays |
| `shadow-glow-primary` | `0 0 20px rgba(6,59,142,0.12)` | Focus ring glow, active `color-primary` elements |
| `shadow-glow-gold` | `0 0 16px rgba(212,175,55,0.2)` | 1st place rank badge on light background |

---

## Gradients

Gradients are used sparingly — only for rank signals, CTAs, and phase score bars. Never use gradients for decorative background patterns.

| Token | Value | Usage Guideline |
|---|---|---|
| `gradient-primary` | `linear-gradient(135deg, #2563EB, #063B8E)` | Primary CTA buttons in Night Stadium — deepens toward navy |
| `gradient-primary-light` | `linear-gradient(135deg, #063B8E, #0047C0)` | Primary CTA buttons in FIFA Executive |
| `gradient-gold` | `linear-gradient(135deg, #FACC15, #D4AF37)` | 1st place rank badge, Grade A highlight, trophy icon background |
| `gradient-silver` | `linear-gradient(135deg, #CBD5E1, #A8A9AD)` | 2nd place rank badge |
| `gradient-bronze` | `linear-gradient(135deg, #D97706, #CD7F32)` | 3rd place rank badge |
| `gradient-score-bar` | `linear-gradient(90deg, color-primary, color-accent)` | Phase 1 AI Accuracy score fill bar |
| `gradient-surface-dark` | `linear-gradient(180deg, #0F172A, #172033)` | Subtle page depth in Night Stadium |
| `gradient-overlay` | `linear-gradient(180deg, transparent, rgba(2,6,23,0.7))` | Image/card footer overlays in Night Stadium |

---

## Animations

### Timing Functions

| Token | Value | Usage |
|---|---|---|
| `ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | General transitions |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Elements exiting view |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering view |
| `ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful micro-interactions |

### Durations

| Token | Value | Usage |
|---|---|---|
| `duration-instant` | 75ms | Hover color changes |
| `duration-fast` | 150ms | Button press feedback, toggles |
| `duration-normal` | 250ms | Card transitions, panel slides |
| `duration-slow` | 400ms | Modal open/close, page transitions |
| `duration-slower` | 600ms | Score count-up animations |

### Named Animations

| Animation | Description | Duration | Easing |
|---|---|---|---|
| `fade-in` | Opacity 0 → 1 | `duration-normal` | `ease-out` |
| `slide-up` | Translate Y +16px → 0, fade in | `duration-normal` | `ease-out` |
| `slide-in-right` | Translate X +24px → 0, fade in | `duration-normal` | `ease-out` |
| `scale-in` | Scale 0.95 → 1, fade in | `duration-fast` | `ease-out` |
| `score-count` | Numerical value animated increment | `duration-slower` | `ease-default` |
| `rank-reveal` | Staggered rank position animation | `duration-slow` | `ease-bounce` |
| `pulse-glow` | Subtle pulsing glow on active elements | 2000ms, infinite | `ease-in-out` |
| `skeleton-shimmer` | Loading placeholder shimmer effect | 1500ms, infinite | linear |

### Reduced Motion

When `prefers-reduced-motion: reduce` is active:

- All `duration-*` tokens collapse to `0ms`
- `score-count` displays final value immediately
- `rank-reveal` shows positions without stagger
- `skeleton-shimmer` replaced with static placeholder
- `pulse-glow` disabled entirely

---

## Breakpoints

| Token | Value | Description |
|---|---|---|
| `breakpoint-sm` | 640px | Large phones, landscape mobile |
| `breakpoint-md` | 768px | Tablets, portrait |
| `breakpoint-lg` | 1024px | Small laptops, tablets landscape |
| `breakpoint-xl` | 1280px | Standard desktops |
| `breakpoint-2xl` | 1536px | Large desktops, ultra-wide |

### Container Widths

| Token | Value | Usage |
|---|---|---|
| `container-sm` | 640px | Narrow content (forms, auth) |
| `container-md` | 768px | Medium content panels |
| `container-lg` | 1024px | Main content area |
| `container-xl` | 1280px | Full dashboard width |
| `container-max` | 1440px | Maximum content width with side padding |

---

## Z-Index Scale

| Token | Value | Usage |
|---|---|---|
| `z-base` | 0 | Default stacking |
| `z-raised` | 10 | Sticky table headers |
| `z-dropdown` | 100 | Dropdowns, select menus |
| `z-sticky` | 200 | Sticky sidebar, sticky nav |
| `z-overlay` | 300 | Backdrop overlays |
| `z-modal` | 400 | Modal dialogs |
| `z-popover` | 500 | Tooltips, popovers |
| `z-toast` | 600 | Toast notifications |
| `z-max` | 9999 | Emergency / debug overlays |

---

## Border Widths

| Token | Value | Usage |
|---|---|---|
| `border-none` | 0px | No border |
| `border-thin` | 1px | Default card borders, dividers |
| `border-medium` | 2px | Focus rings, active indicators |
| `border-thick` | 3px | Selected states, emphasis borders |

---

## Opacity Scale

| Token | Value | Usage |
|---|---|---|
| `opacity-disabled` | 0.4 | Disabled elements |
| `opacity-muted` | 0.6 | Deemphasized content |
| `opacity-subtle` | 0.8 | Slightly reduced emphasis |
| `opacity-full` | 1.0 | Full visibility |

---

## Token Naming Convention

All tokens follow this naming pattern:

```
--{category}-{property}-{variant}

Examples:
--color-bg
--color-surface-secondary
--color-primary
--color-gold
--color-status-success
--color-text-primary
--color-grade-a
--color-chart-1
--font-display
--font-ui
--font-data
--text-4xl
--space-md
--space-xl
--radius-large
--shadow-glow-primary
--z-modal
--duration-fast
```

### Rules

1. **Category** groups related tokens (`color`, `font`, `text`, `space`, `radius`, `shadow`, `z`, `duration`)
2. **Property** describes the specific role (`surface`, `primary`, `status`, `grade`, `chart`, `text`)
3. **Variant** provides scale or qualifier (`secondary`, `success`, `a`, `1`, `md`, `large`)
4. All tokens use **kebab-case** — no camelCase, no underscores
5. Semantic names over hue names — `color-primary` not `color-navy-800`
6. Theme variants are handled via CSS custom property overrides on `[data-theme="light"]` — the token name itself does not encode the theme

---

## Related Documents

| Document | Purpose |
|---|---|
| [Design System](DESIGN_SYSTEM.md) | Visual philosophy and UX principles |
| [Component Guidelines](COMPONENT_GUIDELINES.md) | How tokens are applied in components |
| [Frontend Architecture](FRONTEND_ARCHITECTURE.md) | Token integration in code |
