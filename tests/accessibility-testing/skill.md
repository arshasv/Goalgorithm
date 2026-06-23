# Accessibility Testing

## Purpose
This QA skill evaluates the frontend application for WCAG 2.1 (Web Content Accessibility Guidelines) Level AA compliance. It validates keyboard navigation, semantic HTML usage, ARIA attributes, color contrast, and compatibility with screen readers to ensure that the application is fully accessible to users with visual, auditory, motor, or cognitive disabilities.

## Files Analyzed
- All React views in `react-frontend/src/pages/`
- Custom input components in `react-frontend/src/components/`
- Styling tokens in `react-frontend/src/index.css`

## Checks Performed
1. **Keyboard Navigatability & Focus Focus**: Verify that all interactive elements (buttons, links, inputs) are reachable via `Tab` key navigation and feature a visible, distinct focus state. Ensure focus traps do not occur in modal views.
2. **Semantic HTML Elements**: Ensure markup uses correct tags (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`, `<button>`, `<a>`) rather than using generic `<div>` tags for clickable or structural elements.
3. **ARIA Attributes & Roles**: Check that interactive widgets lacking native semantic tags are enriched with appropriate ARIA roles and labels (e.g. `aria-label`, `aria-expanded`, `aria-describedby`, `aria-hidden`).
4. **Color Contrast Verification**: Ensure text-to-background contrast ratios meet WCAG AA requirements (minimum 4.5:1 for normal text, 3:1 for large text).
5. **Alt Text & Form Labels**: Check that images, icons, and diagrams have meaningful alt text or are hidden from screen readers if purely decorative. Verify all form controls have explicit `<label>` tags or `aria-label` properties.

## Scoring Criteria
- **90 - 100: Production Grade**: Full semantic HTML structure, keyboard focus visible on all elements, no keyboard traps, AA contrast compliant, screen reader readable with aria-labels.
- **80 - 89: Minor Improvements Needed**: Mostly keyboard accessible, but minor issues like missing aria-labels on decorative icons, or minor focus indicator styling issues.
- **70 - 79: Acceptable but Needs Fixes**: Inconsistent keyboard focus order, interactive `div` elements lacking keyboard support, or slight contrast ratio failures.
- **Below 70: Not Production Ready**: Trapped keyboard focus inside modals, zero focus indicators, major form fields lacking visible labels or aria-labels, or complete lack of semantic elements.

## Point Distribution
- **Keyboard Navigation & Focus Management - 30 Points**: Visible focus indicators, logical tab ordering, modal focus trap controls.
- **Semantic HTML & Markup Validity - 25 Points**: Correct native elements, form labels, header hierarchies.
- **ARIA & Screen Reader Support - 25 Points**: Complete aria tags, alt text, screen reader visibility control.
- **Color Contrast & Visual Accessibility - 20 Points**: Compliant text-to-background color ratios, zoom-safe layouts.

## Failure Conditions
- **Critical Failure (Instant Sub-70 Score)**: Modal popups that trap keyboard focus, leaving keyboard-only users unable to exit the modal.
- **Critical Failure (Instant Sub-70 Score)**: Key interactive custom controls (e.g. custom dropdowns, submission cards) not reachable via keyboard `Tab` or triggerable via `Enter`/`Space`.
- **Critical Failure**: Key text content failing WCAG minimum contrast standards.

## Suggested Tools
- `axe-core` / `cypress-axe` (Automated accessibility test suites)
- `Lighthouse Accessibility` audits
- Screen readers (NVDA on Windows, VoiceOver on macOS/iOS)

## Final Output Format
The skill must generate:

Score: [Score]/100
Status: [PASS / WARNING / FAIL]

Critical Issues:
- [List of critical accessibility barriers, if any]

Recommendations:
- [Actionable steps to patch semantic, keyboard, or ARIA violations]
