# Architectural Bugs

## Summary
- **Total Bugs:** 3
- **Open:** 2
- **Fixed:** 1
- **Wontfix:** 0

---

## Bug FE-001: PresentationView.jsx component not split

**Status:** NOT FIXED
**Priority:** HIGH
**Category:** Architecture / Maintainability

### Description
`PresentationView.jsx` is a large, monolithic component (347 lines) that mixes state management, helper utilities, and rendering. This reduces maintainability and testability.

### Evidence from code
- **Line count:** 347 lines (unchanged structurally)
- Contains inline helper functions: `rankBadge()` (lines 4–10), `formatTeamDisplay()` (lines 12–16)
- State management was extracted to `usePresentationEvaluation` hook (279 lines), but the component itself was **not split** into separate sub-component files (e.g., `JudgePanel`, `ScoreEntryTable`, `ResultsTable`, `ScoringRule`)
- All rendering is still inline within the single component file
- Mixed concerns: helpers defined in same file as component logic

### Required fix
Split PresentationView into sub-components: JudgePanel, ScoreEntryTable, ResultsTable, ScoringRule. Extract helper functions to a dedicated utility file.

---

## Bug FE-002: TeamLeaderDashboard.jsx component not split

**Status:** NOT FIXED
**Priority:** HIGH
**Category:** Architecture / Maintainability

### Description
`TeamLeaderDashboard.jsx` is the largest component in the application (440 lines), handling team profile, member CRUD, predictions display, and scores views in a single monolith.

### Evidence from code
- **Line count:** 440 lines — the largest component in the app
- Contains inline helper functions: `formatTeamDisplay()` (lines 9–13), `fmt1()` (line 15), `rankBadge()` (lines 17–23), `teamBadge()` (lines 25–41)
- Contains inline CRUD forms for team members (add/edit/remove) embedded in the same file
- Contains 4 inline `render*` sub-functions: `renderProfile()`, `renderMembers()`, `renderPredictions()`, `renderScores()`
- Direct API calls to `TeamService`, `LeaderboardService`, `PredictionService`, `ScoresService`, `MatchService` within the component
- Uses `window.alert()` and `window.confirm()` for user interaction instead of proper UI components

### Required fix
Split into sub-components: TeamProfileCard, TeamMembersPanel (with AddMemberForm, EditMemberForm inline or separate), PredictionsTable, ScoresTable. Extract helpers. Replace `window.alert`/`window.confirm` with proper modals.

---

## Bug FE-003: Custom hooks not used for repeated data fetching patterns

**Status:** FIXED
**Priority:** MEDIUM
**Category:** Architecture / Maintainability

### Description
Many pages independently reimplement the same data-fetching logic (teams list, matches list, leaderboard, predictions) with nearly identical loading/error state management. This violates DRY.

### Resolution
Created 5 custom hooks with real reusable logic, verified in use:
- `src/hooks/useTeams.js` (71 lines) — `loadTeams`, `handleUpload`, `downloadTemplate` — used by `TeamsView.jsx:4` and `TechnicalView.jsx:3`
- `src/hooks/useMatches.js` (43 lines) — `loadMatches` — used by `MatchesView.jsx:5`
- `src/hooks/useLeaderboard.js` (53 lines) — `loadLeaderboard`, `calculateLeaderboard` — used by `LeaderboardView.jsx:3`
- `src/hooks/usePredictions.js` (36 lines) — `loadPredictions` — created, available for use
- `src/hooks/usePresentationEvaluation.js` (279 lines) — full judge CRUD + score state management — used by `PresentationView.jsx:2`
