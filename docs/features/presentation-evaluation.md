# Presentation Evaluation

## Purpose
Accept peer review panel scores for Phase 3 (Presentation), apply relative ranking multipliers, and normalize results to a 20-mark scale.

## User / Actor
Peer Review Panel (submission), System (automated ranking + normalization)

## Input
List of presentation evaluations (one per team):
- `team_id`
- `ai_explanation_score` (0–20)
- `qa_score` (0–15)
- `delivery_score` (0–15)

## Processing Workflow
1. Panel submits raw scores for all teams
2. Compute raw total per team: `ai_explanation_score + qa_score + delivery_score` (max 50)
3. Rank teams by raw total descending
4. Assign grades: top unique = A (3×), bottom unique = C (1×), all others = B (2×)
5. Compute `multiplied = raw_total × multiplier`
6. Normalize: `presentation_score = (multiplied / 150) × 20`, rounded to 2 decimals

## Validation Rules
- Each sub-score within defined per-field max
- Negative values rejected

## Output
```json
{
  "team_id": "...",
  "raw_score": 48,
  "rank": 1,
  "grade": "A",
  "multiplier": 3,
  "presentation_score": 19.2
}
```

## Related APIs
- `POST /api/v1/presentation-score`

## Related Database Entities
- `presentation_evaluations` — stores Phase 3 raw scores and computed results
