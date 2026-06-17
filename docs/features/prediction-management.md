# Prediction Management

## Purpose
Accept, validate, and store team prediction JSON files submitted before each match freeze deadline. Enforce schema compliance, deadline cutoffs, and duplicate prevention.

## User / Actor
Participant Team (submission), Organizer (view history), System (automated validation)

## Input
Prediction JSON per team per match:
- `team_id`, `match_id`, `submission_id`
- `match_prediction`: predicted_winner, predicted_scoreline, probabilities, clean_sheet_probability, first_goal_team, both_teams_to_score_probability, total_goals_prediction
- `player_predictions`: list of per-player predictions (player_id, player_name, goal_probability, predicted_goals, assist_probability)

## Processing Workflow
1. Team submits prediction JSON via API
2. System validates against Pydantic schema
3. Schema checks: required fields, data types, value ranges, enum values, non-empty player list
4. Service checks for existing prediction by (team_id, match_id) — rejects duplicates with 409
5. Valid payload → stored; invalid → rejected with appropriate error

## Validation Rules
- `predicted_winner` must be `home`, `away`, or `draw`
- `first_goal_team` must be `home`, `away`, or `none`
- Probability fields: 0–100
- Scoreline goals: non-negative integers
- `goal_scorers` array lengths must exactly match the `predicted_scoreline` goals
- `player_predictions` must not be empty
- `team_id`, `match_id`, `submission_id` must be non-empty strings

> **Format Reference**: For an exact JSON schema, required field rules, and a full JSON example, see the [Prediction Format Reference](../api/prediction_format_reference.md) and the root `sample_prediction.json` file.

## Duplicate Handling
- A unique constraint on `(team_id, match_id)` prevents two predictions for the same team in the same match
- Duplicate submissions receive a **409 Conflict** with error code `PREDICTION_ALREADY_EXISTS`
- This check is performed in the service layer before any write operation

## Output
- Success (new prediction): `{"status": "accepted", "team_id": "...", "match_id": "..."}` (200)
- Duplicate: 409 `PREDICTION_ALREADY_EXISTS`
- Validation failure: 422 `VALIDATION_ERROR`

## Related APIs
- `POST /api/v1/predictions` — submit prediction

## Related Database Entities
- `predictions` — stores submitted prediction data
- `player_predictions` — stores per-player prediction entries
- `teams` — references team identity
- `matches` — references match context
