import json
import uuid
import sys
sys.path.append('.')

from app.model_execution.services.model_serializer import ModelSerializer
from app.schemas.prediction_schema import PredictionSubmission
from pydantic import ValidationError

native_output = {
  "score_prediction": {
    "predicted_scoreline": {
      "home_goals": 1,
      "away_goals": 0,
      "home_team": "United States",
      "away_team": "Bosnia and Herzegovina"
    },
    "total_goals": 1
  },
  "match_prediction": {
    "win_probabilities": {
      "home_team": { "probability": 62 },
      "draw": { "probability": 30 },
      "away_team": { "probability": 8 }
    }
  },
  "goal_insights": {
    "first_team_to_score": { "team": "United States", "probability": 65 },
    "both_teams_to_score": { "prediction": False, "probability": 44 }
  },
  "player_prediction": {
    "home_team": {
      "goal": [ { "name": "Folarin Balogun", "predictions": [ { "goal_count": 1, "probability": 23 } ] } ],
      "clean_sheet_prediction": { "goalkeeper": "Matt Turner", "prediction": False, "probability": 43 }
    },
    "away_team": {
      "goal": [ { "name": "Bosnia and Herzegovina Forward 1", "predictions": [ { "goal_count": 1, "probability": 20 } ] } ],
      "clean_sheet_prediction": { "goalkeeper": "Bosnia and Herzegovina Goalkeeper", "prediction": False, "probability": 22 }
    }
  }
}

team_uuid = uuid.uuid4()
match_uuid = uuid.uuid4()

serializer_payload = ModelSerializer.serialize_output(native_output, team_uuid, match_uuid)

print("GENERATED JSON FROM MODEL_SERIALIZER:")
print(json.dumps(serializer_payload, indent=4, default=str))

try:
    # Disable the adapter logic for a moment to see if the RAW serializer output matches the schema natively!
    # The adapter intercepts it, but let's see what Pydantic natively expects.
    sub = PredictionSubmission(**serializer_payload)
    print("SUCCESS: Serializer payload is fully compatible with PredictionSubmission")
except ValidationError as e:
    print("422 UNPROCESSABLE ENTITY:")
    print(e.json())
