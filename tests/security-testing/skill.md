# Security Testing

## Purpose
This QA skill evaluates the security posture of both backend and frontend systems. It focuses on validating authentication strength (JWT, OTP mechanisms), authorization enforcement (Role-Based Access Control, routing protection), data validation boundaries, vulnerability prevention (SQL injection, XSS, CSRF), and configuration safety (exposed secrets, dotenv leaks) to ensure the system is resilient to attacks.

## Files Analyzed
- `backend/app/api/auth_routes.py` (Authentication endpoints)
- `backend/app/api/deps.py` (Auth dependencies and RBAC permissions)
- `backend/app/config.py` (Secret loads and credentials verification)
- `backend/app/email/service.py` (OTP generation, delivery, and verification)
- `react-frontend/src/contexts/AuthContext.jsx` (Client session verification)
- `react-frontend/src/config/env.js` (Frontend env validation)
- All SQLAlchemy model/service query patterns (SQLi vulnerability analysis)

## Checks Performed
1. **JWT Implementation & Security**: Validate that tokens use secure algorithms (e.g. HS256), have realistic expiration times (e.g. 15-60 mins), check signature validity, and store roles securely.
2. **Password & OTP Hardening**: Verify passwords are encrypted using strong hashing schemes (e.g. bcrypt, Argon2). Ensure OTPs are cryptographically random, short-lived (e.g. 5-10 mins), hashed in the DB, and invalidated immediately upon successful consumption or reset.
3. **Role-Based Access Control (RBAC)**: Ensure endpoints containing organizer privileges explicitly invoke an organizer check dependency (e.g., `get_current_organizer`). Verify that a team leader role cannot call administrative routes.
4. **Input Sanitization & Injection Defense**: Inspect database access layers. Ensure SQL queries use ORM parameterized structures instead of raw string formatting (`f-strings`) to block SQL injection. Ensure Pydantic validates input schemas for correct email format, text bounds, etc.
5. **Cross-Site Scripting (XSS) & Header Checks**: Check frontend page displays for raw rendering of user-supplied HTML. Verify backend returns standard secure headers (CORS bounds, CSP headers, Content-Type-Options).
6. **Credential Leak & Env Exposure**: Perform static analysis on project files to detect hardcoded API keys, private tokens, passwords, and `.env` template bypasses.

## Scoring Criteria
- **90 - 100: Production Grade**: Solid cryptographic hashes, secure JWT configs, strict backend RBAC, zero raw SQL strings, no exposed secrets, and robust OTP lifecycles.
- **80 - 89: Minor Improvements Needed**: Strong core security, but minor issues like missing CSRF headers on public endpoints, slightly long JWT expiration times, or minor validator constraints missing.
- **70 - 79: Acceptable but Needs Fixes**: Incomplete OTP invalidation patterns (e.g. OTP reusable within its window), partial RBAC (some endpoints lack explicit role checks), or minor input validation gaps.
- **Below 70: Not Production Ready**: Plaintext passwords, lack of backend permission validation (client-side role checks only), direct SQL injection vulnerabilities, or hardcoded secrets.

## Point Distribution
- **Authentication & Cryptography (JWT/Hashing/OTP) - 30 Points**: Robust hashing, secure tokens, secure OTP lifecycles.
- **Authorization & RBAC Enforcement - 30 Points**: Backend routing roles validation, context extraction.
- **Injection & Input Validation - 25 Points**: Parameterized DB queries, comprehensive schema checking.
- **Secrets Management & Environment - 15 Points**: Safe configs, no credentials leaks in repository history.

## Failure Conditions
- **Critical Failure (Instant Sub-70 Score)**: Any database query executing raw unsanitized input concatenation (SQL Injection vulnerability).
- **Critical Failure (Instant Sub-70 Score)**: Passwords stored in plain text or hashed using legacy insecure algorithms (e.g. MD5, SHA1).
- **Critical Failure (Instant Sub-70 Score)**: Admin routes that lack server-side role validation (allowing any user token to submit results).

## Suggested Tools
- `bandit` (Python security linter)
- `gitleaks` (Checking for credential leaks)
- `owasp-dependency-check` / `pip-audit` (Vulnerability scanning)
- `sqlmap` (Database injection verification)

## Final Output Format
The skill must generate:

Score: [Score]/100
Status: [PASS / WARNING / FAIL]

Critical Issues:
- [List of critical security flaws, if any]

Recommendations:
- [Actionable steps to patch vulnerabilities or enhance cryptographic controls]
