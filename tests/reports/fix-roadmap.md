# Production Hardening Fix Roadmap

## Phase 1: Production Blockers (Immediate Fixes Required)
- **BUG-FBP-001 (Wildcard CORS)**: Restrict origins using environment variable settings.
- **BUG-SEC-001 (Hardcoded Secrets)**: Raise value errors if secret variables are unset in production.
- **BUG-DEP-001 (Root User containers)**: Set up non-root system users inside Dockerfiles.

## Phase 2: System Performance & Stability (High Priority)
- **BUG-PERF-001 (Blocking I/O)**: Switch route signatures from async def to def, or utilize threadpools to isolate synchronous operations.
- **Compose Resource limits**: Define memory and CPU limits/reservations on docker services.

## Phase 3: Architecture & Security Controls (Medium Priority)
- **BUG-BA-001 (DB Queries in API)**: [FIXED] Refactor routing layer to call business services instead of querying ORM models.
- **BUG-FBP-002 (Lifespan tables)**: Transition database initialization tasks fully to Alembic.

## Phase 4: API Standards & DB Tuning (Normal Priority)
- **BUG-API-001 (Pagination)**: Add offsets/limits parameters to large list routes.
- **BUG-DB-001 (Indices)**: Introduce index constraints on all database foreign keys.
- **BUG-LM-001 (Structured logs)**: Configure structured JSON logger formats.

## Phase 5: Long-term Scalability & Code Health (Low Priority)
- **BUG-TEST-001 (Frontend Testing)**: Deploy Jest/React Testing Library setup and write dashboard unit tests.
- **BUG-CQ-001 (Type Safety)**: Resolve all Mypy type annotations and lint check errors.
