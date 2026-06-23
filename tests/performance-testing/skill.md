# Performance Testing

## Purpose
This QA skill evaluates the speed, resource utilization, responsiveness, and scalability of frontend and backend subsystems. It checks client-side rendering speed, bundle structure, backend query speeds, asynchronous task handling, caching efficiency, and infrastructure container bounds under load to ensure a highly responsive user experience.

## Files Analyzed
- `react-frontend/vite.config.js` (Frontend compiler/bundler options)
- `react-frontend/src/**/*.jsx` (Lazy load and rendering layout)
- `backend/app/main.py` (Async lifecycle and server-side configs)
- `backend/app/services/**/*.py` (High-load computation rules)
- `docker-compose.yml` (Container resource configuration bounds)

## Checks Performed
1. **Frontend Asset Optimization**: Verify script bundles are optimized (e.g. chunking, tree-shaking, minimal dependency footprint). Check if heavy libraries are lazy-loaded and images/icons are optimized.
2. **Client-Side Rendering Metrics**: Check for redundant rendering triggers in React, layout shifts, or blocked execution paths in UI transitions.
3. **Backend Response Latency**: Analyze average and 95th percentile response times for core API endpoints. Identify long-running tasks that block the server thread.
4. **Asynchronous Handling & Thread Safety**: Verify non-CPU-bound operations (e.g. email sending, third-party API fetches, file operations) use `async`/`await` correctly and do not run synchronously, blocking FastAPI's single-threaded event loop.
5. **Database Query Efficiency & Latency**: Measure execution speeds of read/write queries. Check for long-running transactions and index usage.
6. **Infrastructure Resource Management**: Check if Docker containers are configured with sensible memory and CPU resource limits to prevent memory leaks and container crashing.

## Scoring Criteria
- **90 - 100: Production Grade**: Sub-second API response times, non-blocking asynchronous operations, optimized bundle splits in frontend, lazy-loading, and container resource limits configured.
- **80 - 89: Minor Improvements Needed**: Fast responses overall, but minor bottlenecks in non-critical endpoints, lack of query caching, or slightly large JS bundles.
- **70 - 79: Acceptable but Needs Fixes**: Sync email sending blocking API responses, noticeable page layout rendering lag, or heavy unoptimized loop calculations.
- **Below 70: Not Production Ready**: Blocked event loops, high response latency (>3s on simple lookups), database locks, or infinite rendering loops in the frontend.

## Point Distribution
- **Backend Async Efficiency & Response Latency - 30 Points**: Proper async/await usage, fast REST API responses, non-blocking IO.
- **Database Speed & Query Profiling - 25 Points**: Low query latency, absence of locking transactions, connection pool tuning.
- **Frontend Assets & Rendering Speed - 25 Points**: Efficient bundles, lazy loading, minimal rendering cycles, fast page load.
- **Infrastructure Performance Bounds - 20 Points**: Docker resource limits, container scaling settings.

## Failure Conditions
- **Critical Failure (Instant Sub-70 Score)**: Blocked event loops in the backend, such as sending emails or calling external APIs synchronously inside standard routes.
- **Critical Failure (Instant Sub-70 Score)**: Frontend loading heavy library bundles on landing pages, causing first-contentful-paint (FCP) latency greater than 4 seconds.
- **Critical Failure**: Database transaction locks blocking multiple client threads during competition updates.

## Suggested Tools
- `Lighthouse` / Chrome DevTools Performance (Frontend asset and paint rendering analysis)
- `locust` / `k6` (Backend load and concurrency stress testing)
- `cProfile` / FastAPI Middleware Profilers (Backend code execution profiling)

## Final Output Format
The skill must generate:

Score: [Score]/100
Status: [PASS / WARNING / FAIL]

Critical Issues:
- [List of critical performance bottlenecks, if any]

Recommendations:
- [Actionable steps to resolve latency, improve async performance, or optimize assets]
