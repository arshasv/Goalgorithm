import json
import uuid
import sys
sys.path.append('.')

from app.model_execution.services.model_serializer import ModelSerializer
from app.schemas.prediction_schema import PredictionSubmission

# The native AI JSON output
native_output = {
  "output": {
    "match_prediction": {
      "win_probabilities": {
        "home_team": {
          "team": "United States",
          "probability": 62
        },
        "draw": {
          "probability": 30
        },
        "away_team": {
          "team": "Bosnia and Herzegovina",
          "probability": 8
        }
      }
    },
    "score_prediction": {
      "predicted_scoreline": {
        "home_team": "United States",
        "home_goals": 1,
        "away_team": "Bosnia and Herzegovina",
        "away_goals": 0
      },
      "total_goals": 1
    },
    "goal_insights": {
      "first_team_to_score": {
        "team": "United States",
        "probability": 65
      },
      "both_teams_to_score": {
        "prediction": False,
        "probability": 44
      }
    },
    "player_prediction": {
      "home_team": {
        "team": "United States",
        "goal": [
          {
            "name": "Folarin Balogun",
            "predictions": [
              {
                "goal_count": 1,
                "probability": 23
              }
            ]
          }
        ],
        "clean_sheet_prediction": {
          "goalkeeper": "Matt Turner",
          "prediction": False,
          "probability": 43
        }
      },
      "away_team": {
        "team": "Bosnia and Herzegovina",
        "goal": [
          {
            "name": "Bosnia and Herzegovina Forward 1",
            "predictions": [
              {
                "goal_count": 1,
                "probability": 20
              }
            ]
          }
        ],
        "clean_sheet_prediction": {
          "goalkeeper": "Bosnia and Herzegovina Goalkeeper",
          "prediction": False,
          "probability": 22
        }
      }
    }
  }
}

team_uuid = uuid.uuid4()
match_uuid = uuid.uuid4()

# 1. Workflow 1: Backend ModelSerializer
serializer_payload = ModelSerializer.serialize_output(native_output, team_uuid, match_uuid)

# 2. Workflow 2: Manual JSON Upload directly to Pydantic (simulating API post)
upload_payload = native_output.copy()
upload_payload["team_id"] = str(team_uuid)
upload_payload["match_id"] = str(match_uuid)
upload_payload["submission_id"] = serializer_payload["submission_id"] # Align submission_id for comparison

pydantic_parsed = PredictionSubmission(**upload_payload)
parsed_dump = pydantic_parsed.model_dump()

# Compare them
def normalize_output(data):
    # Remove dynamic or default values that aren't critical for comparison
    data = json.loads(json.dumps(data))
    if 'idempotency_key' in data:
        del data['idempotency_key']
    
    # Sort lists so ordering doesn't break equality
    data['player_predictions'] = sorted(data['player_predictions'], key=lambda x: x.get('player_name', ''))
    data['match_prediction']['clean_sheet_predictions'] = sorted(data['match_prediction']['clean_sheet_predictions'], key=lambda x: x.get('goalkeeper', ''))
    
    # ModelSerializer produces goal_scorers dict which API upload doesn't natively supply but Pydantic calculates or expects if missing
    # Actually Pydantic validates and calculates some stuff ModelSerializer doesn't (like predicted_winner auto-calculated vs ModelSerializer calculating it)
    if 'predicted_winner' in data['match_prediction']:
        pass
    
    return data

norm_serializer = normalize_output(serializer_payload)

# Pydantic dump includes defaults (like goal_scorers) which ModelSerializer also adds.
norm_pydantic = normalize_output(parsed_dump)

print("SERIALIZER OUTPUT MATCHES ADAPTER UPLOAD OUTPUT?")
# We need to make sure the key elements match.
import deepdiff
diff = deepdiff.DeepDiff(norm_serializer, norm_pydantic, ignore_order=True)

if not diff:
    print("YES! EXACT MATCH.")
else:
    print("DIFFERENCES FOUND:")
    print(diff)
