# Prediction Architecture

## Data Flow
```
Team Client
    │
    │  POST /api/v1/predictions
    │  Body: PredictionSubmission JSON
    │
    ▼
API Layer (prediction_routes.py)
    │  → validates with PredictionSubmission schema
    │
    ▼
Schema Validation (Pydantic v2)
    │  → field validators: winner enum, first_goal enum, ranges, non-empty list
    │
    ▼
PredictionService.save_prediction()
    │  → checks for existing prediction (team_id + match_id unique)
    │  → raises PredictionAlreadyExistsException if duplicate
    │  → persists via PredictionRepository
    │
    ▼
Response
    ├── New prediction accepted: {"status": "accepted", ...} (200)
    ├── Duplicate team+match: 409 PREDICTION_ALREADY_EXISTS
    ├── Schema invalid: 422 VALIDATION_ERROR
    └── Unexpected error: 500 INTERNAL_SERVER_ERROR
```

## Route Responsibility
- `prediction_routes.py`: receive → validate → call service → return response
- No scoring logic in routes
- No error handling in routes — exceptions propagate to global handlers

## Error Scenarios

| Scenario | Error Code | HTTP |
|---|---|---|
| Duplicate prediction (same team + match) | `PREDICTION_ALREADY_EXISTS` | 409 |
| Schema violation | `VALIDATION_ERROR` | 422 |
| Missing team or match resource | `FOREIGN_KEY_VIOLATION` | 400 |
| Unexpected server error | `INTERNAL_SERVER_ERROR` | 500 |

## Related Documentation
- [Feature: Prediction Management](../features/prediction-management.md)
- [API: Prediction API](../api/prediction-api.md)
- [Error Handling Architecture](error-handling-architecture.md)
