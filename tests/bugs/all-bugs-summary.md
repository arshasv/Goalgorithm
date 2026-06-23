# Automated QA Audit - All Bugs Summary

## Bugs by Severity
- **CRITICAL**: 0
- **HIGH**: 7
- **MEDIUM**: 3
- **LOW**: 1
- **TOTAL**: 11

## Bug Index
| Bug ID | Severity | Category | File | Description |
| :--- | :--- | :--- | :--- | :--- |
| BUG-BA-001 | HIGH | Architecture | `team_routes.py` | (FIXED) Direct database access in route handlers |
| BUG-FBP-001 | HIGH | Security / Config | `main.py` | Wildcard CORS configuration in production |
| BUG-FBP-002 | MEDIUM | Lifecycle | `main.py` | Lifespan database table creation |
| BUG-SEC-001 | HIGH | Secrets Management | `config.py` | Hardcoded default secrets & DB credentials |
| BUG-DB-001 | MEDIUM | Database Indexing | `team.py` | Missing index on foreign keys |
| BUG-PERF-001 | HIGH | Async/Performance | `team_routes.py` | Blocking sync I/O in async route context |
| BUG-API-001 | MEDIUM | API Standards | `team_routes.py` | Missing pagination query params |
| BUG-CQ-001 | LOW | Code Quality | `presentation_score.py` | Missing static variable type annotations |
| BUG-LM-001 | HIGH | Observability | `main.py` | Plaintext logs rather than JSON formatting |
| BUG-DEP-001 | HIGH | Deployment / Security | `Dockerfile` | Container processes running as root |
| BUG-TEST-001 | HIGH | Testing Coverage | `react-frontend/` | No test coverage on frontend codebase |

## Top Production Blockers
1. **BUG-FBP-001 (Wildcard CORS)**: Exposes APIs to unauthorized requests from other origins.
2. **BUG-SEC-001 (Hardcoded Secrets)**: Risks token decoding session exploits if defaults are deployed.
3. **BUG-PERF-001 (Sync Blocking in Async Loop)**: Starves client connections by blocking FastAPI's single thread.
4. **BUG-DEP-001 (Root Containers)**: Allows potential container breakout vulnerability on container hosts.
5. **BUG-TEST-001 (Zero Frontend Tests)**: Risks silent regressions on the React user interfaces.
