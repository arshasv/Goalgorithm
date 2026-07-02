import requests
import json
from pprint import pprint

url = "http://localhost:8000/api/v1/predictions"

invalid_output = {
  "team_id": "T1",
  "match_id": "M1",
  "submission_id": "SUB-123",
  # "match_prediction" is required but we will omit it to trigger 422
  "player_predictions": [
      {
          "team": "home_team" # missing name
      }
  ]
}

try:
    print("SENDING INVALID REQUEST")
    response = requests.post(url, json=invalid_output)
    print(f"Status Code: {response.status_code}")
    pprint(response.json())
except Exception as e:
    print(e)
