# Accessibility Bugs

## Summary
- **Total Bugs:** 1
- **Open:** 0
- **Fixed:** 1
- **Wontfix:** 0

---

## Bug FE-005: Form labels not correctly associated with inputs

**Status:** FIXED
**Priority:** HIGH
**Category:** Accessibility

### Description
Form labels were not correctly associated with inputs in `AddMatchModal.jsx`. Screen readers could not identify form fields.

### Resolution
Verified all 4 label/input pairs in `src/components/matches/AddMatchModal.jsx` now have proper `htmlFor`/`id` associations:
- `<label htmlFor="matchNumber">` ↔ `<input id="matchNumber">` (line 61–62)
- `<label htmlFor="homeTeam">` ↔ `<input id="homeTeam">` (line 67–68)
- `<label htmlFor="awayTeam">` ↔ `<input id="awayTeam">` (line 71–72)
- `<label htmlFor="kickoff">` ↔ `<input id="kickoff">` (line 76–77) — was already correct
