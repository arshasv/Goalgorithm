# Code Quality Testing

## Purpose
This QA skill evaluates the cleanliness, style compliance, typing correctness, complexity, and maintainability of both Python (backend) and JavaScript/TypeScript (frontend) codebases. It identifies linting issues, formatting errors, cyclomatic complexity spikes, duplicate code blocks, and dead modules to ensure code maintainability.

## Files Analyzed
- `backend/**/*.py` (All backend code files)
- `react-frontend/src/**/*.{js,jsx,ts,tsx}` (All frontend code files)
- `.gitignore`, `backend/.env`, `react-frontend/.eslintrc.js` (Lint and project setups)

## Checks Performed
1. **Python Styling & PEP8 Compliance**: Verify PEP8 compliance (proper formatting, imports sorting, naming conventions). Check type hinting annotations on function signatures.
2. **JavaScript/React Linting compliance**: Verify linting rules (ESLint). Check hook dependencies arrays, unused variables, and component naming conventions.
3. **Cyclomatic & Cognitive Complexity**: Assess function size and nested branching levels. Audit deep conditional trees (`if/else` structures) or loop block depths.
4. **Duplicate and Redundant Code Detection**: Check for clone blocks (repeated calculations, identical layout structures) that should be refactored into helpers.
5. **Dead Code Cleanup**: Audit the repository for unused functions, leftover debug code (e.g. `print()`, `console.log()`), commented-out blocks, and orphan files.
6. **Naming Quality & Clarity**: Check variables, class labels, database tables, and function names for clear, consistent semantic meaning.

## Scoring Criteria
- **90 - 100: Production Grade**: Fully linted, type hinted, clean separation, low complexity metrics, no commented-out code, and consistent formatting.
- **80 - 89: Minor Improvements Needed**: Compliant files overall, but has minor type annotation omissions, occasional print statements, or minor linting warnings.
- **70 - 79: Acceptable but Needs Fixes**: Excessive cognitive complexity in calculation loops, code duplication, or multiple ESLint warning listings.
- **Below 70: Not Production Ready**: Syntax warnings, broken lint rules, major code duplicates, massive monolithic functions (>100 lines), or complete lack of typing.

## Point Distribution
- **Python PEP8, Typing & Quality - 30 Points**: Type safety coverage, linting, black/flake8 formatting rules.
- **React/JS Quality & ESLint Compliance - 30 Points**: ESLint compliance, hooks hygiene, hook dependency variables.
- **Code Complexity & Readability - 20 Points**: Simple logic paths, minimal nesting, concise and descriptive names.
- **Dry Compliance & Code Cleanup - 20 Points**: No duplicated code, zero unused dependencies, no console/print logs.

## Failure Conditions
- **Critical Failure (Instant Sub-70 Score)**: Code duplication of core scoring/business logic routines in different modules instead of single service imports.
- **Critical Failure (Instant Sub-70 Score)**: Unused debug code, commented-out logic blocks, or hardcoded configurations inside files.
- **Critical Failure**: Code failing to build or pass baseline linter errors.

## Suggested Tools
- Python: `flake8`, `black`, `mypy`, `radon`
- Frontend: `eslint`, `prettier`
- General: `sonarqube` (Code duplication and complexity engine)

## Final Output Format
The skill must generate:

Score: [Score]/100
Status: [PASS / WARNING / FAIL]

Critical Issues:
- [List of critical style or quality violations, if any]

Recommendations:
- [Actionable steps to resolve complexity, add typing, or standardize styling]
