import uuid

class ModelSerializer:
    @staticmethod
    def serialize_output(model_output: dict, team_id: uuid.UUID, match_id: uuid.UUID) -> dict:
        """
        Validates model output and converts it into the existing prediction JSON schema.
        Expected model output:
        {
         "predicted_winner":"",
         "score":{
           "teamA":0,
           "teamB":0
         },
         "confidence":90
        }
        """
        if not isinstance(model_output, dict):
            raise ValueError("Model output must be a dictionary")
        if "predicted_winner" not in model_output:
            raise ValueError("Missing 'predicted_winner' in model output")
        if "score" not in model_output:
            raise ValueError("Missing 'score' in model output")
            
        winner = str(model_output["predicted_winner"]).lower()
        if winner not in ["home", "away", "draw"]:
            raise ValueError(f"Invalid predicted_winner: {winner}. Must be home, away, or draw.")
            
        score = model_output["score"]
        if not isinstance(score, dict):
            raise ValueError("'score' must be a dictionary")
            
        confidence = float(model_output.get("confidence", 0.0))
        
        home_goals = int(score.get("teamA", 0))
        away_goals = int(score.get("teamB", 0))
        
        submission_id = f"exec_{uuid.uuid4()}"
        
        payload = {
            "team_id": str(team_id),
            "match_id": str(match_id),
            "submission_id": submission_id,
            "match_prediction": {
                "predicted_winner": winner,
                "predicted_scoreline": {
                    "home_team_goals": home_goals,
                    "away_team_goals": away_goals
                },
                "probabilities": {
                    "home_win_probability": confidence if winner == "home" else 0.0,
                    "away_win_probability": confidence if winner == "away" else 0.0,
                    "draw_probability": confidence if winner == "draw" else 0.0,
                }
            }
        }
        return payload
