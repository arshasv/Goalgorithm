# Scoring Engine Correctness

## Purpose
Verify prediction matching algorithms, goal/player probabilities validation, score card multipliers, leaderboard aggregation correctness, and tie-breaking.

## Files Analyzed
- backend/app/scoring_engine/**/*.py
- backend/app/services/scoring_service.py

## Checks Performed
- Validate that match outcome points and player score calculations align with specs.
- Check dynamic presentation score averages calculation logic for N judges.
- Verify leaderboard data sorting hierarchy and tie-breaker sorting logic.
- Verify transaction safety during scoring batch updates.

## Scoring Criteria
90-100: Production Grade
80-89: Minor improvements needed
70-79: Acceptable but needs fixes
Below 70: Not production ready

## Point Distribution
Prediction Score Math - 35 points
Judge-Based Average Calculations - 35 points
Leaderboard & Sorting Accuracy - 30 points

## Failure Conditions
- Incorrect scoring calculations violating competition rules.
- Failure to calculate presentation score average correctly across N judges.
- Concurrent scoring calculation causing data override.

## Suggested Tools
pytest, parametrized tests

## Final Output Format
Score: XX/100
Status: PASS / WARNING / FAIL
Critical Issues:
Recommendations:
