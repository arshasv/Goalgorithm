from sqlalchemy.orm import Session

from app.models.enums import Winner, FirstGoalTeam
from app.repositories.prediction_repository import PredictionRepository


class PredictionService:
    def __init__(self, db: Session):
        self.db = db
        self.pred_repo = PredictionRepository(db)

    def save_prediction(self, payload: dict) -> dict:
        idempotency_key = payload.get("idempotency_key")
        if idempotency_key:
            existing = self.pred_repo.get_by_idempotency_key(idempotency_key)
            if existing:
                return {
                    "status": "duplicate",
                    "message": "Prediction already submitted",
                    "team_id": existing.team_id,
                    "match_id": existing.match_id,
                }

        mp = payload["match_prediction"]
        create_kwargs = {
            "team_id": payload["team_id"],
            "match_id": payload["match_id"],
            "submission_id": payload["submission_id"],
            "predicted_winner": Winner(mp["predicted_winner"]),
            "home_win_probability": mp.get("probabilities", {}).get("home_win_probability"),
            "draw_probability": mp.get("probabilities", {}).get("draw_probability"),
            "away_win_probability": mp.get("probabilities", {}).get("away_win_probability"),
            "predicted_home_goals": mp.get("predicted_scoreline", {}).get("home_team_goals"),
            "predicted_away_goals": mp.get("predicted_scoreline", {}).get("away_team_goals"),
            "home_clean_sheet_probability": mp.get("clean_sheet_probability", {}).get("home_team"),
            "away_clean_sheet_probability": mp.get("clean_sheet_probability", {}).get("away_team"),
            "first_goal_team": FirstGoalTeam(mp["first_goal_team"]) if mp.get("first_goal_team") else None,
            "both_teams_to_score_probability": mp.get("both_teams_to_score_probability"),
            "total_goals_prediction": mp.get("total_goals_prediction"),
            "goal_scorers": mp.get("goal_scorers"),
            "raw_payload": payload,
        }
        if idempotency_key:
            create_kwargs["idempotency_key"] = idempotency_key

        prediction = self.pred_repo.create(**create_kwargs)

        player_data_list = [
            {
                "player_id": pp["player_id"],
                "player_name": pp["player_name"],
                "goal_probability": pp.get("goal_probability"),
                "predicted_goals": pp.get("predicted_goals"),
                "assist_probability": pp.get("assist_probability"),
            }
            for pp in payload.get("player_predictions", [])
        ]
        if player_data_list:
            self.pred_repo.add_player_predictions(prediction, player_data_list)

        return {
            "status": "accepted",
            "team_id": prediction.team_id,
            "match_id": prediction.match_id,
        }
