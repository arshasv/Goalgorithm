import json
from pydantic import BaseModel
import sys
sys.path.append('.')
from app.schemas.prediction_schema import PredictionSubmission

def map_fields(data: dict) -> dict:
    if not isinstance(data, dict):
        return data
        
    data = data.copy()

    # If 'output' is at root, extract its contents to root level so we process it
    if "output" in data and isinstance(data["output"], dict):
        out = data.pop("output")
        for k, v in out.items():
            # if we already have it at root (from frontend), don't override, or do?
            data[k] = v

    if "match_prediction" not in data:
        data["match_prediction"] = {}
    elif not isinstance(data["match_prediction"], dict):
        data["match_prediction"] = {}
    else:
        data["match_prediction"] = data["match_prediction"].copy()

    match_pred = data["match_prediction"]

    # Map score_prediction fields
    if "score_prediction" in data and isinstance(data["score_prediction"], dict):
        score_pred = data.pop("score_prediction")
        if "predicted_scoreline" in score_pred and isinstance(score_pred["predicted_scoreline"], dict):
            scoreline = score_pred["predicted_scoreline"].copy()
            if "home_goals" in scoreline:
                scoreline["home_team_goals"] = scoreline.pop("home_goals")
            if "away_goals" in scoreline:
                scoreline["away_team_goals"] = scoreline.pop("away_goals")
            match_pred["predicted_scoreline"] = scoreline
        
        if "total_goals" in score_pred:
            match_pred["total_goals_prediction"] = score_pred["total_goals"]

    # Map win_probabilities
    if "win_probabilities" in match_pred and isinstance(match_pred["win_probabilities"], dict):
        win_probs = match_pred.pop("win_probabilities")
        probabilities = match_pred.get("probabilities", {})
        if isinstance(probabilities, dict):
            probabilities = probabilities.copy()
        else:
            probabilities = {}
            
        if "home_team" in win_probs and isinstance(win_probs["home_team"], dict):
            probabilities["home_win_probability"] = win_probs["home_team"].get("probability")
        elif "home_win_probability" in win_probs:
            probabilities["home_win_probability"] = win_probs["home_win_probability"]

        if "draw" in win_probs and isinstance(win_probs["draw"], dict):
            probabilities["draw_probability"] = win_probs["draw"].get("probability")
        elif "draw_probability" in win_probs:
            probabilities["draw_probability"] = win_probs["draw_probability"]

        if "away_team" in win_probs and isinstance(win_probs["away_team"], dict):
            probabilities["away_win_probability"] = win_probs["away_team"].get("probability")
        elif "away_win_probability" in win_probs:
            probabilities["away_win_probability"] = win_probs["away_win_probability"]

        match_pred["probabilities"] = probabilities

    # Map goal_insights
    if "goal_insights" in data and isinstance(data["goal_insights"], dict):
        insights = data.pop("goal_insights")
        if "first_team_to_score" in insights:
            match_pred["first_team_to_score"] = insights["first_team_to_score"]
            if isinstance(match_pred["first_team_to_score"], dict):
                team_val = match_pred["first_team_to_score"].get("team")
                if team_val == "home_team":
                    match_pred["first_team_to_score"]["team"] = "home"
                elif team_val == "away_team":
                    match_pred["first_team_to_score"]["team"] = "away"
        if "both_teams_to_score" in insights:
            match_pred["both_teams_to_score"] = insights["both_teams_to_score"]

    clean_sheet_preds = []
    
    # Process native player_prediction object
    if "player_prediction" in data and isinstance(data["player_prediction"], dict):
        player_pred = data.pop("player_prediction")
        new_players = data.get("player_predictions", [])
        if not isinstance(new_players, list):
            new_players = []

        for side in ["home_team", "away_team"]:
            if side in player_pred and isinstance(player_pred[side], dict):
                side_data = player_pred[side]
                short_side = "home" if side == "home_team" else "away"
                
                # Goal predictions
                goal_list = side_data.get("goal", [])
                for p in goal_list:
                    if not isinstance(p, dict): continue
                    name = p.get("name")
                    preds = p.get("predictions", [])
                    if not preds: continue
                    best_pred = max(preds, key=lambda x: x.get("probability", 0) if isinstance(x, dict) else 0)
                    predicted_goals = best_pred.get("goal_count", 0)
                    goal_prob = best_pred.get("probability", 0)
                    
                    new_players.append({
                        "player_name": name,
                        "team": short_side,
                        "predicted_goals": predicted_goals,
                        "probability": goal_prob
                    })
                
                # Clean sheet
                cs = side_data.get("clean_sheet_prediction", {})
                if cs and isinstance(cs, dict) and (cs.get("goalkeeper") or cs.get("prediction") is not None):
                    clean_sheet_preds.append(cs)
                    
        data["player_predictions"] = new_players

    # Map clean_sheet_predictions
    if "clean_sheet_predictions" in data and isinstance(data["clean_sheet_predictions"], list):
        clean_sheet_preds.extend(data.pop("clean_sheet_predictions"))
        
    if clean_sheet_preds:
        match_pred["clean_sheet_predictions"] = clean_sheet_preds

    # Legacy flat map if player_predictions array already provided directly
    if "player_predictions" in data and isinstance(data["player_predictions"], list):
        new_players = []
        for p in data["player_predictions"]:
            if isinstance(p, dict):
                p = p.copy()
                if "name" in p:
                    p["player_name"] = p.pop("name")
                if "goal_count" in p:
                    p["predicted_goals"] = p.pop("goal_count")
                
                team_val = p.get("team")
                if team_val == "home_team":
                    p["team"] = "home"
                elif team_val == "away_team":
                    p["team"] = "away"
            new_players.append(p)
        data["player_predictions"] = new_players

    data["match_prediction"] = match_pred
    return data

data = {
  "team_id": "test_team",
  "match_id": "test_match",
  "submission_id": "test_sub",
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

try:
    mapped = map_fields(data)
    print("MAPPED DATA:")
    print(json.dumps(mapped, indent=2))
    
    # Simulate assigning PredictionSubmission
    sub = PredictionSubmission(**mapped)
    print("SUCCESS")
except Exception as e:
    print("FAILED")
    print(e)
