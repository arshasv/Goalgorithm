from app.scoring_engine.base_score.base_score_calculator import calculate_base_score
import json

prediction = {
    "team_id": "test",
    "match_id": "test",
    "match_prediction": {
        "predicted_winner": "home",
        "predicted_scoreline": {"home_team_goals": 2, "away_team_goals": 1},
        "both_teams_to_score": {"prediction": True, "probability": 80},
        "first_team_to_score": {"team": "home", "probability": 80},
        "probabilities": {"home_win_probability": 80},
        "player_performance": [
            {"player_id": "1", "predicted_goals": 1}
        ]
    }
}

actual_result = {
    "actual_winner": "home",
    "final_score": {"home_team_goals": 2, "away_team_goals": 1},
    "first_team_to_score": "home",
    "actual_player_performance": [
        {"player_id": "1", "goals_scored": 1}
    ]
}

res = calculate_base_score(prediction, actual_result)
print(json.dumps(res, indent=2))
