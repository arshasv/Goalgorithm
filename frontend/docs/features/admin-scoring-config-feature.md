# Admin Scoring Config Feature

## Objective
Provide Organizers with an intuitive interface to dynamically tweak scoring rules and thresholds for future match computations.

## Pages
- **Scoring Config** (`scoring-config.js`): Exclusively accessible to Organizers.
- Displays all currently active scoring rules categorized by logical groups (e.g., Base Score, Probability, Technical Evaluation, Phase Normalization).

## Data Integration
- `ScoringConfigService` handles CRUD operations targeting `/api/v1/admin/scoring-config` routes.
- Fetches metadata guidelines to dynamically render helpful descriptions alongside input controls.
- Updates are transmitted as JSON payloads.

## States
- **Form Active**: Inputs pre-populated with current `active` config limits.
- **Save Warning**: Prominently displays an alert warning that changes exclusively apply to future matches.
- **Empty State**: Shown if no active configuration exists yet.

## Theme & UX Elements
- Adheres to standard GOALGORITHM tokens.
- Cards neatly separate parameter groups.
- Modals handle confirmation dialogues when resetting configurations to factory defaults.
