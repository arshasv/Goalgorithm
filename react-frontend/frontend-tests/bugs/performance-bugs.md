# Performance Bugs

## Summary
- **Total Bugs:** 1
- **Open:** 0
- **Fixed:** 1
- **Wontfix:** 0

---

## Bug FE-004: No code splitting for route-level chunks

**Status:** FIXED
**Priority:** MEDIUM
**Category:** Performance

### Description
All page components are bundled into a single JavaScript chunk on initial load, even though many are only needed for specific authenticated routes. This increases Time to Interactive (TTI) for users on slow connections.

### Resolution
Verified from `src/App.jsx`:
- All 18 page imports use `React.lazy(() => import('./path'))` pattern (lines 6–23)
- `<Suspense>` wraps `<Routes>` with `.page-loading .loading-spinner` fallback (line 54)
- Build output confirms separate chunks: `dist/assets/LoginView-*.js`, `OrganizerDashboard-*.js`, etc.
- Main bundle reduced to shared code only (~228KB)
