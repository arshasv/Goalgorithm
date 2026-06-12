# Error Responses

## Standard Envelope

Every error response follows this structure:

```json
{
  "success": false,
  "error_code": "ERROR_CODE",
  "message": "Readable explanation",
  "details": {}
}
```

## HTTP Status Codes

| Code | Meaning | Common error_codes |
|---|---|---|
| 400 | Bad request / business rule violation | `INVALID_COMPETITION_STATE`, `FOREIGN_KEY_VIOLATION`, `NULL_CONSTRAINT_VIOLATION`, `LEADERBOARD_ERROR` |
| 404 | Resource not found | `RESOURCE_NOT_FOUND` |
| 409 | Conflict / duplicate entry | `PREDICTION_ALREADY_EXISTS`, `ACTUAL_RESULT_ALREADY_EXISTS`, `DUPLICATE_ENTRY` |
| 422 | Validation failure | `VALIDATION_ERROR` |
| 500 | Unexpected server error | `INTERNAL_SERVER_ERROR` |

## Error Scenarios

### Duplicate Prediction (409)

```json
{
  "success": false,
  "error_code": "PREDICTION_ALREADY_EXISTS",
  "message": "Prediction already exists for this team and match",
  "details": {}
}
```

### Duplicate Actual Result (409)

```json
{
  "success": false,
  "error_code": "ACTUAL_RESULT_ALREADY_EXISTS",
  "message": "Actual result already exists for this match",
  "details": {}
}
```

### Resource Not Found (404)

```json
{
  "success": false,
  "error_code": "RESOURCE_NOT_FOUND",
  "message": "Team not found",
  "details": {
    "resource_type": "Team"
  }
}
```

### Validation Error (422)

```json
{
  "success": false,
  "error_code": "VALIDATION_ERROR",
  "message": "Invalid request data",
  "details": [
    {
      "field": "match_prediction.predicted_winner",
      "message": "Value must be one of: home, away, draw"
    }
  ]
}
```

### Unexpected Error (500)

```json
{
  "success": false,
  "error_code": "INTERNAL_SERVER_ERROR",
  "message": "Unexpected server error occurred",
  "details": {}
}
```

## Related Documentation

- [Error Handling Architecture](../architecture/error-handling-architecture.md)
