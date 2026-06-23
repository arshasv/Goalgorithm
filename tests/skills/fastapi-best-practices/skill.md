# FastAPI Best Practices

## Purpose
Verify usage of FastAPI features, CORS settings, custom middlewares, global exception handling, response models, and startup/shutdown lifecycle.

## Files Analyzed
- backend/app/main.py
- backend/app/api/**/*.py
- backend/app/exceptions/**/*.py

## Checks Performed
- Verify all routes have explicit response_model defined to avoid data leaks.
- Check CORS middleware configuration restricts origins properly in production.
- Check global exception handlers handle standard database and client errors cleanly.
- Ensure proper route parameter typing and path declarations.

## Scoring Criteria
90-100: Production Grade
80-89: Minor improvements needed
70-79: Acceptable but needs fixes
Below 70: Not production ready

## Point Distribution
Response Models & Schemas - 35 points
Error Handling & Middlewares - 35 points
CORS & Lifecycle Configuration - 30 points

## Failure Conditions
- Routes lacking response_model definition or returning raw DB models directly.
- CORS configuration allowing '*' in a production environment.

## Suggested Tools
schemathesis, ruff, black

## Final Output Format
Score: XX/100
Status: PASS / WARNING / FAIL
Critical Issues:
Recommendations:
