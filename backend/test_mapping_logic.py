import json
from pydantic import BaseModel
import sys
sys.path.append('.')
from app.schemas.prediction_schema import PredictionSubmission

def map_fields(data: dict) -> dict:
    if not isinstance(data, dict):
        return data

    # Ensure match_prediction exists
    if "match_prediction" not in data:
        data["match_prediction"] = {}

    match_pred = data["match_prediction"]

    # Map score_prediction
    if "score_prediction" in data:
        score_pred = data.pop("score_prediction")
        if "predicted_scoreline" in score_pred:
            scoreline = score_pred["predicted_scoreline"]
            # Map home_goals -> home_team_goals
            if "home_goals" in scoreline:
                scoreline["home_team_goals"] = scoreline.pop("home_goals")
            # Map away_goals -> away_team_goals
            if "away_goals" in scoreline:
                scoreline["away_team_goals"] = scoreline.pop("away_goals")
            match_pred["predicted_scoreline"] = scoreline
        
        if "total_goals" in score_pred:
            match_pred["total_goals_prediction"] = score_pred["total_goals"]

    # Map win_probabilities -> probabilities
    if "win_probabilities" in match_pred:
        match_pred["probabilities"] = match_pred.pop("win_probabilities")

    # Map goal_insights
    if "goal_insights" in data:
        insights = data.pop("goal_insights")
        if "first_team_to_score" in insights:
            match_pred["first_team_to_score"] = insights["first_team_to_score"]
        if "both_teams_to_score" in insights:
            match_pred["both_teams_to_score"] = insights["both_teams_to_score"]

    # Map clean_sheet_predictions at root
    if "clean_sheet_predictions" in data:
        match_pred["clean_sheet_predictions"] = data.pop("clean_sheet_predictions")

    # Map player_predictions
    if "player_predictions" in data and isinstance(data["player_predictions"], list):
        for p in data["player_predictions"]:
            if "name" in p:
                p["player_name"] = p.pop("name")

    return data

data = {
  "team_id": "team-123",
  "match_id": "match-456",
  "submission_id": "sub-789",
  "score_prediction": {
    "predicted_scoreline": {
      "home_goals": 2,
      "away_goals": 1
    },
    "total_goals": 3
  },
  "match_prediction": {
    "win_probabilities": {
       "home_win_probability": 0.5,
       "draw_probability": 0.2,
       "away_win_probability": 0.3
    }
  },
  "goal_insights": {
    "first_team_to_score": {
       "team": "home",
       "probability": 10
    },
    "both_teams_to_score": {
       "prediction": True,
       "probability": 10
    }
  },
  "player_predictions": [
    {
      "name": "Player 1",
      "team": "home",
      "predicted_goals": 1,
      "probability": 0.5
    }
  ],
  "clean_sheet_predictions": [
    {
       "goalkeeper": "GK 1",
       "prediction": True,
       "probability": 10
    }
  ]
}

try:
    mapped = map_fields(data)
    sub = PredictionSubmission(**mapped)
    print("SUCCESS")
except Exception as e:
    print("FAILED")
    print(e)
