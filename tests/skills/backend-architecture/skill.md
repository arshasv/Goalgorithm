# Backend Architecture Quality

## Purpose
Evaluate FastAPI clean architecture, routers/services separation, dependency injection, repositories, and SOLID principles compliance.

## Files Analyzed
- backend/app/api/**/*.py
- backend/app/services/**/*.py
- backend/app/models/**/*.py
- backend/app/schemas/**/*.py

## Checks Performed
- Check that API routers only handle HTTP logic, schemas, and dependencies.
- Verify business logic is decoupled from routes and located in the services layer.
- Verify correct use of FastAPI dependency injection (Depends) for database sessions and auth.
- Assess SOLID principles, checking for Single Responsibility and Dependency Inversion violations.

## Scoring Criteria
90-100: Production Grade
80-89: Minor improvements needed
70-79: Acceptable but needs fixes
Below 70: Not production ready

## Point Distribution
Architecture Separation - 35 points
Dependency Injection - 35 points
SOLID Principles - 30 points

## Failure Conditions
- SQLAlchemy sessions created manually outside of FastAPI depends hooks.
- Direct DB access/raw query strings inside route handler functions.

## Suggested Tools
mypy, pylint, dependency-navigator

## Final Output Format
Score: XX/100
Status: PASS / WARNING / FAIL
Critical Issues:
Recommendations:
