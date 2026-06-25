from sqlalchemy.orm import Session

from app.models.enums import Winner, FirstGoalTeam
from app.repositories.prediction_repository import PredictionRepository


class PredictionService:
    def __init__(self, db: Session):
        self.db = db
        self.pred_repo = PredictionRepository(db)

    def save_prediction(self, payload: dict) -> dict:
        import uuid
        # Fallback to submission_id or generate a new UUID if neither exists
        idempotency_key = payload.get("idempotency_key") or payload.get("submission_id") or str(uuid.uuid4())
        
        existing = self.pred_repo.get_by_idempotency_key(idempotency_key)
        if existing:
            return {
                "status": "duplicate",
                "message": "Prediction already submitted",
                "team_id": existing.team_id,
                "match_id": existing.match_id,
            }

        mp = payload["match_prediction"]
        
        # If prediction for this team and match already exists, remove it
        existing_pred = self.pred_repo.get_by_team_and_match(payload["team_id"], payload["match_id"])
        if existing_pred:
            from app.models.prediction import PlayerPredictionModel
            self.db.query(PlayerPredictionModel).filter(PlayerPredictionModel.prediction_id == existing_pred.id).delete()
            self.db.delete(existing_pred)
            self.db.commit()

        # --- Resolve predicted_winner ---
        # The schema auto-calculates this from probabilities if not provided,
        # so by the time we get here it should always be set.
        predicted_winner = Winner(mp["predicted_winner"])

        # --- Resolve first_goal_team ---
        first_goal_team_val = None
        first_goal_team_probability = None

        # AI format: first_team_to_score: { team, probability }
        fts = mp.get("first_team_to_score")
        if fts and isinstance(fts, dict):
            team_raw = fts.get("team", "").lower()
            first_goal_team_probability = fts.get("probability")
            # Map to enum if possible
            if team_raw in ("home", "away", "none"):
                first_goal_team_val = FirstGoalTeam(team_raw)
            else:
                # Store as team name — keep in raw payload, map to closest enum
                first_goal_team_val = None  # Will be stored via raw_payload

        # Legacy/manual format: first_goal_team: "home"/"away"/"none"
        if first_goal_team_val is None and mp.get("first_goal_team"):
            fgt_raw = mp["first_goal_team"]
            if isinstance(fgt_raw, str) and fgt_raw.lower() in ("home", "away", "none"):
                first_goal_team_val = FirstGoalTeam(fgt_raw.lower())

        # --- Resolve BTTS ---
        btts_prediction = None
        btts_probability = None

        # AI format: both_teams_to_score: { prediction, probability }
        btts = mp.get("both_teams_to_score")
        if btts and isinstance(btts, dict):
            btts_prediction = btts.get("prediction")
            btts_probability = btts.get("probability")

        # Legacy/manual format: both_teams_to_score_probability
        if btts_probability is None and mp.get("both_teams_to_score_probability") is not None:
            btts_probability = mp["both_teams_to_score_probability"]

        # --- Resolve clean sheet ---
        clean_sheet_predictions_json = None
        home_cs_prob = None
        away_cs_prob = None

        # AI format: clean_sheet_predictions: [{ goalkeeper, prediction, probability }]
        csp = mp.get("clean_sheet_predictions")
        if csp and isinstance(csp, list):
            clean_sheet_predictions_json = csp
            # Also extract flat probabilities for backward compat with scoring engine
            for entry in csp:
                if isinstance(entry, dict):
                    prob = entry.get("probability")
                    # Try to assign to home/away based on available info
                    if home_cs_prob is None:
                        home_cs_prob = prob
                    elif away_cs_prob is None:
                        away_cs_prob = prob

        # Legacy format: clean_sheet_probability: { home_team, away_team }
        legacy_cs = mp.get("clean_sheet_probability")
        if legacy_cs and isinstance(legacy_cs, dict):
            if home_cs_prob is None:
                home_cs_prob = legacy_cs.get("home_team")
            if away_cs_prob is None:
                away_cs_prob = legacy_cs.get("away_team")

        create_kwargs = {
            "team_id": uuid.UUID(payload["team_id"]) if isinstance(payload["team_id"], str) else payload["team_id"],
            "match_id": uuid.UUID(payload["match_id"]) if isinstance(payload["match_id"], str) else payload["match_id"],
            "submission_id": payload["submission_id"],
            "predicted_winner": predicted_winner,
            "home_win_probability": mp.get("probabilities", {}).get("home_win_probability"),
            "draw_probability": mp.get("probabilities", {}).get("draw_probability"),
            "away_win_probability": mp.get("probabilities", {}).get("away_win_probability"),
            "predicted_home_goals": mp.get("predicted_scoreline", {}).get("home_team_goals"),
            "predicted_away_goals": mp.get("predicted_scoreline", {}).get("away_team_goals"),
            "total_goals_prediction": mp.get("total_goals_prediction"),
            "both_teams_to_score_prediction": btts_prediction,
            "both_teams_to_score_probability": btts_probability,
            "first_goal_team": first_goal_team_val,
            "first_goal_team_probability": first_goal_team_probability,
            "clean_sheet_predictions": clean_sheet_predictions_json,
            "home_clean_sheet_probability": home_cs_prob,
            "away_clean_sheet_probability": away_cs_prob,
            "goal_scorers": mp.get("goal_scorers"),
            "raw_payload": payload,
            "idempotency_key": idempotency_key,
        }

        prediction = self.pred_repo.create(**create_kwargs)

        # --- Player predictions ---
        player_data_list = []
        for pp in payload.get("player_predictions", []):
            player_data_list.append({
                "player_name": pp["player_name"],
                "team": pp.get("team"),
                "predicted_goals": pp.get("predicted_goals", 0),
                "goal_probability": pp.get("goal_probability") or pp.get("probability"),
                "player_id": pp.get("player_id"),
                "assist_probability": pp.get("assist_probability"),
            })

        if player_data_list:
            self.pred_repo.add_player_predictions(prediction, player_data_list)

        return {
            "status": "accepted",
            "team_id": prediction.team_id,
            "match_id": prediction.match_id,
        }
