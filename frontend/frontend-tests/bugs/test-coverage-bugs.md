# Test Coverage Bugs

## Summary
- **Total Bugs:** 2
- **Open:** 1
- **Fixed:** 1
- **Wontfix:** 0

---

## Bug FE-006: Testing coverage is insufficient

**Status:** NOT FIXED
**Priority:** MEDIUM
**Category:** Testing

### Description
The codebase has 69 source files but only 18 test files. The vast majority of page and component files lack unit tests.

### Evidence from code
- **Total source files:** 69 (17 pages, 8 components, 12 API services, 5 hooks, 1 context, 2 utils, 1 App, 1 main, 1 config, 6 test utility/config files)
- **Total test files:** 18 (18/69 = 26%)
- **Pages with tests:** 4/18 (22%) — LoginView, RegisterView, ForgotPasswordView, LeaderboardView
- **Pages WITHOUT tests:** 14 — OrganizerDashboard, TeamLeaderDashboard, TeamsView, MatchesView, ScoringView, TechnicalView, PresentationView, PredictionsView, AnalyticsView, FinalScoresView, ScoringConfigView, ModelManagementView, ModelSubmissionView, LeaderboardSettingsView
- **Components with tests:** 1/8 (12.5%) — AddMatchModal
- **Components WITHOUT tests:** 7 — Layout, Navbar, Sidebar, EnterResultModal, MatchDetailModal, SubmitPredictionModal, TeamDetailModal
- **API Services with tests:** 11/11 (100%) — all covered since FE-007 fix
- **Test count:** 108 tests

### Required fix
Add unit tests for remaining untested pages and components. Target: at least 50% of source files covered.

---

## Bug FE-007: API service layer has no unit tests

**Status:** FIXED
**Priority:** MEDIUM
**Category:** Testing

### Description
The 11 API service modules in `src/api/*.js` contain methods that call backend endpoints with no unit test coverage.

### Resolution
Verified 11 test files under `src/test/api/` covering all 50 API service methods. All use `vi.mock('../../api/axios')` to mock axios. Each test verifies:
1. Correct HTTP method (GET/POST/PUT/DELETE)
2. Correct endpoint URL
3. Correct payload passed (body, query params, headers)
4. Response data returned correctly

| Service | File | Methods Tested |
|---------|------|----------------|
| AuthService | `authService.test.js` | 5 |
| TeamService | `teamService.test.js` | 11 |
| MatchService | `matchService.test.js` | 7 |
| PredictionService | `predictionService.test.js` | 2 |
| ScoringService | `scoringService.test.js` | 6 |
| LeaderboardService | `leaderboardService.test.js` | 2 |
| LeaderboardSettingsService | `leaderboardSettingsService.test.js` | 2 |
| ModelService | `modelService.test.js` | 5 |
| ScoresService | `scoresService.test.js` | 4 |
| ScoringConfigService | `scoringConfigService.test.js` | 4 |
| ResultService | `resultService.test.js` | 2 |
