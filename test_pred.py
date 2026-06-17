import requests

payload = {
    "team_id": "self",
    "match_id": "M1",
    "submission_id": "sub-123",
    "match_prediction": {
        "predicted_winner": "home",
        "predicted_scoreline": {
            "home_team_goals": 1,
            "away_team_goals": 0
        },
        "probabilities": {
            "home_win_probability": 60,
            "draw_probability": 20,
            "away_win_probability": 20
        },
        "clean_sheet_probability": {
            "home_team": 30,
            "away_team": 20
        },
        "first_goal_team": "home",
        "both_teams_to_score_probability": 50,
        "total_goals_prediction": 1,
        "goal_scorers": {
            "home": ["Player 1"],
            "away": []
        }
    },
    "player_predictions": [
        {
            "player_id": "P1",
            "player_name": "Player 1",
            "goal_probability": 50,
            "predicted_goals": 1,
            "assist_probability": 10
        }
    ]
}

r = requests.post("http://localhost:8000/api/v1/auth/login", data={"username": "user1", "password": "password"})
token = r.json().get("access_token")

res = requests.post("http://localhost:8000/api/v1/predictions", json=payload, headers={"Authorization": f"Bearer {token}"})
print(res.status_code)
print(res.text)
