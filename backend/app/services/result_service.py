from sqlalchemy.orm import Session

from app.models.actual_result import ActualResultModel, PlayerActualModel
from app.models.enums import Winner


class ResultService:
    def __init__(self, db: Session):
        self.db = db

    def save_actual_result(self, payload: dict) -> dict:
        actual_result = ActualResultModel(
            match_id=payload["match_id"],
            actual_winner=Winner(payload["actual_winner"]),
            actual_home_goals=payload.get("final_score", {}).get("home_team_goals"),
            actual_away_goals=payload.get("final_score", {}).get("away_team_goals"),
            goal_scorers=payload.get("goal_scorers"),
        )
        self.db.add(actual_result)
        self.db.flush()

        for pr in payload.get("player_results", []):
            player_actual = PlayerActualModel(
                actual_result_id=actual_result.id,
                player_id=pr["player_id"],
                player_name=pr["player_name"],
                actual_goals=pr.get("actual_goals"),
            )
            self.db.add(player_actual)
        self.db.commit()
        self.db.refresh(actual_result)

        return {
            "status": "accepted",
            "match_id": actual_result.match_id,
        }
