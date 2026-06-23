# API Design and REST Standards

## Purpose
Evaluate endpoint patterns, HTTP response status codes mapping, pagination controls, and Swagger description completeness.

## Files Analyzed
- backend/app/api/**/*.py

## Checks Performed
- Ensure correct HTTP verbs mapping (GET, POST, PUT, DELETE).
- Verify standardized schema envelopes and structured error format payload responses.
- Check database fetch limits (pagination) on listing routes.
- Audit OpenAPI schema annotations and description quality.

## Scoring Criteria
90-100: Production Grade
80-89: Minor improvements needed
70-79: Acceptable but needs fixes
Below 70: Not production ready

## Point Distribution
REST Verb & Path Standards - 35 points
Error Format & Status Codes - 35 points
Pagination & Swagger Specs - 30 points

## Failure Conditions
- Modifying state inside GET routes.
- Returning unhandled server errors (500) due to raw database integrity errors.

## Suggested Tools
schemathesis, postman

## Final Output Format
Score: XX/100
Status: PASS / WARNING / FAIL
Critical Issues:
Recommendations:
