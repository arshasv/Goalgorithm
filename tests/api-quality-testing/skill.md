# API Quality Testing

## Purpose
This QA skill evaluates the standardization, design logic, responsiveness, and schema integration of REST APIs. It ensures API endpoints conform to standard REST naming patterns, return appropriate HTTP status codes, use consistent response formatting, present structured error models, provide clean schema contracts (Swagger/OpenAPI), and scale gracefully using pagination.

## Files Analyzed
- `backend/app/api/**/*.py` (All API router routes)
- `backend/app/schemas/**/*.py` (Request and Response contracts)
- `backend/app/main.py` (App-wide settings, CORS, and middleware)

## Checks Performed
1. **HTTP Verbs and REST Conventions**: Verify that HTTP verbs are used correctly (`GET` for fetching, `POST` for creating, `PUT`/`PATCH` for updates, `DELETE` for removal). Validate path parameters and plural resource naming conventions (e.g. `/matches`, `/teams`).
2. **HTTP Status Code Mapping**: Ensure correct status code responses: `200 OK` on generic reads, `201 Created` on resource insertions, `400 Bad Request` on validation failure, `401 Unauthorized` for missing tokens, `403 Forbidden` for role mismatch, `404 Not Found` for absent resources.
3. **Response Model Consistency**: Audit JSON response models. Check that payload structures across endpoints share similar envelopes (e.g. standard wrappers, uniform date serialization format, normalized nested records).
4. **Error Formatting Standard**: Check that validation failures, business logic errors, and internal exceptions return a uniform structure (e.g. `{"detail": "Error Message"}` or standard RFC 7807 error format) instead of random string blocks.
5. **OpenAPI (Swagger) Metadata completeness**: Verify all routes contain summary tags, brief descriptions, typed inputs, explicit responses, and example payloads.
6. **Data Volume Controls (Pagination)**: Audit database listing endpoints (e.g. list predictions, list logs, list match records). Check if they enforce server-side pagination (`limit` and `offset` bounds) to prevent database memory overload.

## Scoring Criteria
- **90 - 100: Production Grade**: Exemplary REST design, correct status codes, robust schemas on all requests/responses, fully documented OpenAPI interfaces, and universal pagination on lists.
- **80 - 89: Minor Improvements Needed**: Compliant design, but slight gaps like missing descriptions in Swagger docs, minor status code inaccuracies (e.g. `200` instead of `201` on creation), or incomplete response model definitions.
- **70 - 79: Acceptable but Needs Fixes**: Inconsistent response payloads, raw text error responses, or lack of limit/offset constraints on high-volume listing endpoints.
- **Below 70: Not Production Ready**: Incorrect HTTP methods (e.g. `POST` used for pure lookups, or `GET` updating database states), missing payload schema validation, or frequent `500 Internal Server Errors` caused by unhandled validations.

## Point Distribution
- **REST Protocol Standards & Verbs - 25 Points**: Correct HTTP mapping, URI semantic naming, standard conventions.
- **Response & Error Schema Uniformity - 30 Points**: Standardized wrappers, consistent date-times, structured error outputs.
- **API Documentation & OpenAPI Compliance - 25 Points**: Complete Swagger definitions, description details, exact type signatures.
- **Request Performance Optimization (Pagination) - 20 Points**: Enforced limit/offset bounds, batch safety on query payloads.

## Failure Conditions
- **Critical Failure (Instant Sub-70 Score)**: A `GET` request endpoint that modifies database state, or a `POST` request endpoint returning unstructured HTML tracebacks on parameter validation failure.
- **Critical Failure (Instant Sub-70 Score)**: Entirely undocumented APIs (lack of schema bindings in endpoints, resulting in missing parameters in OpenAPI auto-generation).
- **Critical Failure**: Unhandled database model leaks directly in response payloads, bypassing the serialization schema definitions.

## Suggested Tools
- `schemathesis` (OpenAPI contract compliance test suite)
- `postman` / `newman` (API behavior assertions)
- FastAPI built-in `/docs` Swagger viewer (Visual inspection of API structure)

## Final Output Format
The skill must generate:

Score: [Score]/100
Status: [PASS / WARNING / FAIL]

Critical Issues:
- [List of critical API structure flaws, if any]

Recommendations:
- [Actionable steps to align API routing and payloads with REST best practices]
