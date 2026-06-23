# Business Logic Correctness

## Purpose
This QA skill evaluates the algorithmic correctness, mathematical safety, edge-case coverage, and transaction boundaries of the core business logic of the GOALGORITHM FIFA AI Challenge Scoring platform. It validates prediction score calculations, match result scoring, leaderboard aggregation, multiplier updates, tie-breaking mechanisms, and dynamic presentation evaluations (multi-judge scoring).

## Files Analyzed
- `backend/app/scoring_engine/**/*.py` (Scoring rules, normalization, multipliers)
- `backend/app/services/scoring_service.py` (Scoring processing flows)
- `backend/app/api/scoring_routes.py` (Presentation/Technical submissions endpoint handlers)
- `backend/app/models/evaluation.py` (Evaluation structures)

## Checks Performed
1. **FIFA Prediction Scoring Integrity**: Verify the mathematical scoring rules for predictions: matches predicted outcomes, clean sheets, correct scorelines, first goal team, goal probabilities, and player-specific stats. Ensure calculations match the specification exactly.
2. **Dynamic Presentation Average Logic**: Ensure dynamic multi-judge evaluation is correct: `Final Score = Sum(all judge scores) / Number of Judges`. Verify calculations support fractional values, handle variable judge counts (1 to N), and use the correct dynamically configured criteria.
3. **Leaderboard Aggregation & Tie-breaking**: Verify leaderboard totals aggregate technical scores, presentation scores, and prediction points. Ensure rank sorting correctly handles tie scores, using proper tie-breaking logic (or assigning equal ranks without crashing).
4. **Multiplier Safety and Normalization**: Audit scores normalization logic. Verify that normalization formulas scale final scores to their correct maximum bounds (e.g. 20% weights) and do not exceed limits.
5. **Race Condition & Transaction Safety**: Ensure that when match outcomes or judge scores are submitted, scores updates are transaction-safe, preventing stale reads or double-write corruption of team ranks.
6. **Edge Case Inputs Validation**: Check calculation boundaries: zero-score submissions, missing prediction items, absent team submissions, or invalid score integers (e.g. negative goals).

## Scoring Criteria
- **90 - 100: Production Grade**: Mathematical scoring match specifications exactly, dynamic N-judge averages computed correctly, transaction boundaries prevent race conditions, and tie-breaking is fully handled.
- **80 - 89: Minor Improvements Needed**: Correct core formulas, but lacks precise float rounding rules (causing minor display variations), or basic error logging on edge calculation failures.
- **70 - 79: Acceptable but Needs Fixes**: Inaccuracies in scoring under rare circumstances (e.g. ties), rounding issues that affect leaderboard placement, or duplicate score runs possible.
- **Below 70: Not Production Ready**: Incorrect scoring calculations, missing judge averaging logic (e.g. only saving the last judge), or calculation routes that crash on absent data.

## Point Distribution
- **FIFA Challenge Score Formulas - 30 Points**: Exact match prediction rules, player probabilities, correct scorelines points.
- **Multi-Judge Presentation Scoring - 25 Points**: Dynamic N-judges averages, dynamic criteria marks checking.
- **Leaderboard Ranks & Tie-breaking - 25 Points**: Correct total summation, precise rank sorting, tie handling.
- **Transaction Safety & Float Rounding - 20 Points**: Thread safety, ACID updates, consistent decimal representation.

## Failure Conditions
- **Critical Failure (Instant Sub-70 Score)**: Any error in the calculation of the final leaderboard scores, causing incorrect team rankings.
- **Critical Failure (Instant Sub-70 Score)**: Dynamic judge scoring logic that overwrites previous judge inputs rather than averaging them, or fails to divide by the correct N judges.
- **Critical Failure**: Database deadlocks when multiple match score calculations occur concurrently.

## Suggested Tools
- Custom unit test assertions using parameter inputs (table-driven tests)
- `pytest` parametrized matrices
- Mathematical verification script outputs

## Final Output Format
The skill must generate:

Score: [Score]/100
Status: [PASS / WARNING / FAIL]

Critical Issues:
- [List of business calculation bugs or algorithm flaws, if any]

Recommendations:
- [Actionable steps to patch formulas, enhance mathematical safety, or fix concurrency issues]
