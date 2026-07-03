import requests
import json
import logging
from pprint import pprint

# Start logging
logging.basicConfig(level=logging.INFO)

url = "http://localhost:8000/api/v1/predictions"

# Find a valid team_id and match_id from the system
headers = {"Content-Type": "application/json"}
# Wait, this is unauthenticated. We can't hit it directly unless we mock auth or find a way.
# Or I can just write a unit test or call the service directly with the Fast API TestClient.

from fastapi.testclient import TestClient
import sys
sys.path.append(".")
from app.main import app

client = TestClient(app)

native_output = {
  "team_id": "T1",
  "match_id": "M1",
  "submission_id": "SUB-123",
  "output": {
    "match_prediction": {
      "win_probabilities": {
        "home_team": { "team": "United States", "probability": 62 },
        "draw": { "probability": 30 },
        "away_team": { "team": "Bosnia and Herzegovina", "probability": 8 }
      }
    },
    "score_prediction": {
      "predicted_scoreline": {
        "home_team": "United States", "home_goals": 1,
        "away_team": "Bosnia and Herzegovina", "away_goals": 0
      },
      "total_goals": 1
    },
    "goal_insights": {
      "first_team_to_score": { "team": "United States", "probability": 65 },
      "both_teams_to_score": { "prediction": False, "probability": 44 }
    },
    "player_prediction": {
      "home_team": {
        "team": "United States",
        "goal": [
          { "name": "Folarin Balogun", "predictions": [ { "goal_count": 1, "probability": 23 } ] }
        ],
        "clean_sheet_prediction": { "goalkeeper": "Matt Turner", "prediction": False, "probability": 43 }
      },
      "away_team": {
        "team": "Bosnia and Herzegovina",
        "goal": [
          { "name": "Bosnia and Herzegovina Forward 1", "predictions": [ { "goal_count": 1, "probability": 20 } ] }
        ],
        "clean_sheet_prediction": { "goalkeeper": "Bosnia and Herzegovina Goalkeeper", "prediction": False, "probability": 22 }
      }
    }
  }
}

print("SENDING REQUEST")
# We need to bypass auth by mocking or finding a valid endpoint. 
# We'll just run it against the Pydantic schema directly as FastAPI would do.
from app.schemas.prediction_schema import PredictionSubmission

try:
    sub = PredictionSubmission(**native_output)
    print("SUCCESS, parsed:")
    pprint(sub.model_dump())
except Exception as e:
    print("VALIDATION ERROR:")
    print(e)
