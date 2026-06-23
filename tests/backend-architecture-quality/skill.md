# Backend Architecture Quality

## Purpose
This QA skill evaluates the architectural health, structural integrity, and design patterns of FastAPI-based backend codebases. It validates alignment with clean architecture, SOLID principles, proper dependency injection, segregation of routers/services/repositories, error handling robustness, and overall separation of concerns to ensure the backend is maintainable, scalable, and resilient under production loads.

## Files Analyzed
- `backend/app/api/**/*.py` (Routers and Controller layers)
- `backend/app/services/**/*.py` (Business logic and Orchestration layers)
- `backend/app/models/**/*.py` (Data models and Entities)
- `backend/app/schemas/**/*.py` (Data serialization and validation)
- `backend/app/database/**/*.py` (Connection and Session management)
- `backend/app/main.py` (App entrypoint)
- `backend/app/config.py` (Configuration management)

## Checks Performed
1. **Routing and Controller Separation**: Verify that routers contain only HTTP request handling, input schema parsing, route definitions, dependencies injection, and response models. No database queries, business calculations, or raw SQL queries should reside in routers.
2. **Service Layer Isolation**: Ensure all domain-specific logic, score calculation rules, and database aggregation orchestrations are abstracted into reusable Service classes or stateless functions.
3. **Model & Schema Separation**: Verify that SQLAlchemy DB models (`models/`) are completely decoupled from Pydantic input/output schemas (`schemas/`).
4. **Dependency Injection Usage**: Verify that FastAPI's `Depends` is utilized for managing database sessions, authentication context, and user permission extraction to prevent hardcoded instantiations.
5. **SOLID Principles Compliance**:
   - *Single Responsibility Principle (SRP)*: Verify each class/function does one thing.
   - *Dependency Inversion Principle (DIP)*: Verify high-level modules do not import low-level connection objects directly; they rely on injected abstraction layers (e.g. Session context).
6. **Error Handling Architecture**: Check for global exception handlers, custom middleware, proper HTTP status codes, and avoidance of raw DB traceback exposure to API consumers.

## Scoring Criteria
- **90 - 100: Production Grade**: Excellent separation of concerns, strong adherence to SOLID, clean DI patterns, fully typed signatures, and centralized error handling.
- **80 - 89: Minor Improvements Needed**: Good separation of concerns, but isolated violations of SRP, minor typed signature omissions, or slight leakage of DB transactions in routers.
- **70 - 79: Acceptable but Needs Fixes**: Visible architectural leaks (e.g. business logic inside routers, multiple responsibilities in service methods, lack of generalized error boundaries).
- **Below 70: Not Production Ready**: Heavy coupling between DB models and HTTP transport, no clear service layer, missing or raw exception leaking to the client.

## Point Distribution
- **Separation of Concerns (Routers/Services/Models/Schemas) - 30 Points**: Strict boundaries between HTTP handlers, business orchestration, and DB persistence.
- **Dependency Injection & Coupling - 25 Points**: Correct use of injection for database sessions, services, configurations, and authentication.
- **SOLID Compliance & Design Patterns - 25 Points**: Clean interfaces, single-responsibility modules, extensibility.
- **Error Handling & Exception Boundaries - 20 Points**: Proper propagation, logging, and normalization of exceptions.

## Failure Conditions
- **Critical Failure (Instant Sub-70 Score)**: Direct SQLAlchemy DB queries or transactional commits written inside API router files.
- **Critical Failure (Instant Sub-70 Score)**: Pydantic schemas importing SQLAlchemy models directly or mixing serialization schemas with database persistence schemas.
- **Critical Failure**: Unhandled global exceptions leaking raw traceback logs or database structure information in API responses.

## Suggested Tools
- `mypy` (Type checking and strict signature compliance)
- `radon` / `xenon` (Cyclomatic complexity and maintainability index analysis)
- `pylint` (Aesthetic and structural rules compliance)
- `dependency-navigator` or custom AST parsers (Verifying cross-module dependency boundaries)

## Final Output Format
The skill must generate:

Score: [Score]/100
Status: [PASS / WARNING / FAIL]

Critical Issues:
- [List of critical violations, if any]

Recommendations:
- [Actionable steps to refactor and align with architecture standards]
