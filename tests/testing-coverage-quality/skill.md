# Testing Coverage Quality

## Purpose
This QA skill evaluates the test coverage, structure, reliability, and comprehensiveness of the test suites across the entire project. It checks backend test coverage (using pytest, coverage tools) and frontend test coverage (unit, integration, and E2E) to ensure that code changes do not introduce regressions and that critical paths are fully tested.

## Files Analyzed
- `backend/tests/**/*.py` (All backend tests)
- `react-frontend/src/**/*.test.{js,jsx}` (Frontend unit/integration tests)
- `tests/e2e/` (If E2E test suites exist, e.g. Playwright/Cypress configs)
- `pyproject.toml` or `setup.cfg` (Test framework parameters)

## Checks Performed
1. **Backend Code Coverage**: Verify unit and integration test coverage for services, routers, utilities, and scoring engines. Target a minimum of 80% coverage for the backend.
2. **Core Scoring Logic Testing**: Verify that calculations (prediction validations, football score multipliers, leaderboard rankings) have 100% test coverage with diverse edge cases (ties, zeros, empty results).
3. **Frontend Component Isolation Tests**: Check for frontend unit testing presence (using Jest, React Testing Library). Ensure custom hooks, routing, and critical state managers have corresponding test assertions.
4. **Mocking Integrity & Isolation**: Ensure database testing isolates tests from production datasets (e.g. using transaction rollbacks, test database fixtures, or mock services). Verify external APIs are mocked using libraries like `responses` or `pytest-mock` to avoid external network calls.
5. **E2E Integration Coverage**: Check if end-to-end user flows (login, prediction uploads, score sheets approvals) are covered by browser integration tools (Playwright/Cypress).

## Scoring Criteria
- **90 - 100: Production Grade**: Backend coverage > 85%, 100% core scoring logic test coverage, robust mock usage, unit testing in frontend, and working E2E test scenarios.
- **80 - 89: Minor Improvements Needed**: Backend coverage 70%-84%, tested business logic, but missing frontend component testing or light E2E testing scenarios.
- **70 - 79: Acceptable but Needs Fixes**: Backend coverage 50%-69%, lack of test isolation (tests affecting db state), or missing test cases for edge calculations.
- **Below 70: Not Production Ready**: Backend coverage < 50%, no automated tests for scoring engines, or broken test suites that fail execution.

## Point Distribution
- **Backend Code Coverage (pytest) - 30 Points**: Comprehensive line/branch coverage, service-level testing.
- **Core Logic & Boundary Value Tests - 30 Points**: Edge cases, mathematical invariants, error validations.
- **Frontend Unit & Component Testing - 20 Points**: Form states, rendering blocks, validation feedback.
- **E2E & Mocking Quality - 20 Points**: Real-world integration checks, network mocking boundaries.

## Failure Conditions
- **Critical Failure (Instant Sub-70 Score)**: Core mathematical calculations (e.g. scores, ranks, multipliers) having 0% coverage or lacking edge case validations.
- **Critical Failure (Instant Sub-70 Score)**: Test suites that write persistently to the development database during run, causing state corruption.
- **Critical Failure**: Test runs that depend on internet connectivity to pass (missing external API mock configurations).

## Suggested Tools
- Python: `pytest`, `pytest-cov`, `pytest-mock`
- Frontend: `vitest` / `jest`, `react-testing-library`
- Browser: `playwright` / `cypress`

## Final Output Format
The skill must generate:

Score: [Score]/100
Status: [PASS / WARNING / FAIL]

Critical Issues:
- [List of critical coverage or test design bugs, if any]

Recommendations:
- [Actionable steps to increase test coverage or improve test assertions]
