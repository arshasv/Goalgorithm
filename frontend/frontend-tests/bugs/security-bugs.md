# Security Bugs

## Summary
- **Total Bugs:** 1
- **Open:** 1
- **Fixed:** 0
- **Wontfix:** 0

---

## Bug FE-008: JWT stored in localStorage without additional security

**Status:** NOT FIXED
**Priority:** HIGH
**Category:** Security

### Description
The JWT access token is stored and managed using `localStorage`, making it vulnerable to XSS attacks. If an attacker can inject JavaScript, they can steal the token and impersonate the user.

### Evidence from code
- `src/contexts/AuthContext.jsx`:
  - Line 13: `const [token, setToken] = useState(localStorage.getItem('token') || null)` — reads token from localStorage on mount
  - Line 73: `localStorage.setItem('token', data.access_token)` — stores token after login
  - Line 8: `const clearAuth = () => { localStorage.removeItem('token'); }` — removes token on logout
- `src/api/axios.js`:
  - Line 13: `const token = localStorage.getItem('token')` — reads token for each request
  - Line 27: `localStorage.removeItem('token')` — removes token on 401
- No httpOnly cookies, sessionStorage, or refresh token rotation mechanism
- Token is decoded client-side using `jwt-decode` library (AuthContext.jsx line 33)

### Required fix
Implement httpOnly cookie-based authentication or use a short-lived token with refresh token rotation. If localStorage must be used, implement additional XSS protections and consider token encryption.
