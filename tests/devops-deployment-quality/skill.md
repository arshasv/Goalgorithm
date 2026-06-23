# DevOps / Deployment Quality

## Purpose
This QA skill evaluates the containerization, environment configuration, database migration integration, deployment readiness, security configurations, and operations monitoring (healthchecks, logs) of the project. It ensures the system can be deployed and scaled reliably in a production cloud environment.

## Files Analyzed
- `/Dockerfile` and `/react-frontend/Dockerfile` (Image build recipes)
- `/docker-compose.yml` (Service orchestration rules)
- `backend/.env` / `backend/.env.template` (Environment declarations)
- `backend/app/main.py` (Liveness/readiness API routes)
- `backend/alembic.ini` (Migration configuration)

## Checks Performed
1. **Dockerfile Best Practices**: Verify Dockerfiles use small, secure base images (e.g. slim/alpine). Check for multi-stage builds, proper layer caching (copying package files first), running processes as non-root users, and minimal layer counts.
2. **Docker Compose Health**: Check that database and api dependencies are cleanly managed (`depends_on` with `service_healthy` conditions). Verify volume storage rules, network segregation, and resource container parameters.
3. **Environment Isolation & Defaults**: Verify that sensitive settings (DB credentials, secret keys, debug flags) are parameterized via environment variables. Ensure production flags default to safe options (e.g. `DEBUG=False`).
4. **App Healthchecks & Diagnostics**: Ensure the backend API exposes liveness and readiness probes (e.g. `/health` or `/healthz` checking database ping connections). Verify Docker Compose or Kubernetes configurations specify health check checks.
5. **Centralized Logging Structure**: Check that application logs write to standard output (`stdout`/`stderr`) using structured JSON or standardized logs format, rather than writing to file volumes.
6. **Production Asset Compilation**: Verify React frontend configuration compiles to optimized static assets (HTML/JS/CSS) served via a production webserver (e.g., Nginx) rather than running Vite development servers in production.

## Scoring Criteria
- **90 - 100: Production Grade**: Multi-stage Docker build, non-root runner users, parameterized environments, reliable DB health checks, structured logging, and optimized static asset servers.
- **80 - 89: Minor Improvements Needed**: Safe container configurations, but lacks multi-stage compilation for frontend, missing minor healthcheck properties, or uses standard python logs.
- **70 - 79: Acceptable but Needs Fixes**: Large Docker images (>1GB), hardcoded secrets in compose templates, or missing API healthcheck paths.
- **Below 70: Not Production Ready**: Running development servers in production modes, containers crashing due to dependency race conditions, or plain text credentials committed to repo folders.

## Point Distribution
- **Dockerfile & Layer Optimization - 25 Points**: Multi-stage builds, non-root users, image sizes.
- **Orchestration & Liveness (Compose/Healthchecks) - 25 Points**: Healthy start ordering, network zones, db pings.
- **Environment Safety & Variables - 25 Points**: Parameterized secrets, secure defaults, environment templates.
- **Log Management & Production Builds - 25 Points**: Structured logging, stdout output, static server builds.

## Failure Conditions
- **Critical Failure (Instant Sub-70 Score)**: Running frontend or backend servers inside containers utilizing default developer debug servers (e.g. running `npm run dev` in production).
- **Critical Failure (Instant Sub-70 Score)**: Secrets (passwords, keys, credentials) committed directly into Dockerfiles or docker-compose files.
- **Critical Failure**: Database migrations failing to apply automatically during image container startup.

## Suggested Tools
- `hadolint` (Dockerfile linter)
- `trivy` / `snyk` (Container vulnerability scanners)
- Docker Engine runtime monitors

## Final Output Format
The skill must generate:

Score: [Score]/100
Status: [PASS / WARNING / FAIL]

Critical Issues:
- [List of critical DevOps/deployment flaws, if any]

Recommendations:
- [Actionable steps to secure, optimize, or streamline deployment workflows]
