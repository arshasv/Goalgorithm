Score: 72/100
Status: WARNING
Critical Issues:
- Containers run as the privileged root user, presenting major container breakout security risks.
- No multi-stage build structure for frontend image (deploys dev server via npm run dev instead of optimized nginx builds).
- Missing resource limits (limits/reservations) and API health probes in Docker Compose configurations.

Recommendations:
- Incorporate dedicated non-root users inside Dockerfiles.
- Refactor frontend build to use multi-stage nginx configurations.
- Configure memory/CPU resource bounds and health check probes inside compose config.
