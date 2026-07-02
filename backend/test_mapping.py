import json
from app.schemas.prediction_schema import PredictionSubmission

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
    sub = PredictionSubmission(**data)
    print("SUCCESS")
    print(sub.model_dump_json(indent=2))
except Exception as e:
    print("FAILED")
    print(e)
