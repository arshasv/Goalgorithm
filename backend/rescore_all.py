from app.database.session import SessionLocal
from app.models.match import MatchModel
from app.models.prediction import PredictionModel
from app.models.actual_result import ActualResultModel
from app.models.score import ScoreModel
from app.models.enums import Grade
from app.services.scoring_service import ScoringService

def rescore_all():
    db = SessionLocal()
    try:
        service = ScoringService(db)
        matches = db.query(MatchModel).all()
        for match in matches:
            actual = db.query(ActualResultModel).filter(ActualResultModel.match_id == match.id).first()
            if not actual:
                continue
            predictions = db.query(PredictionModel).filter(PredictionModel.match_id == str(match.id)).all()
            if not predictions:
                continue
                
            actual_payload = {
                "match_id": actual.match_id,
                "actual_winner": actual.actual_winner.value if actual.actual_winner else "draw",
                "final_score": {
                    "home_team_goals": actual.actual_home_goals or 0,
                    "away_team_goals": actual.actual_away_goals or 0
                },
                "goal_scorers": actual.goal_scorers or {"home": [], "away": []},
                "player_results": [
                    {
                        "player_id": pa.player_id,
                        "player_name": pa.player_name,
                        "actual_goals": pa.actual_goals or 0
                    } for pa in actual.player_actuals
                ]
            }
            if not actual_payload["player_results"]:
                actual_payload["player_results"] = [{"player_id": "NONE", "player_name": "No Scorers", "actual_goals": 0}]

            pred_payloads = []
            for p in predictions:
                pred_payloads.append({
                    "team_id": p.team_id,
                    "match_id": p.match_id,
                    "submission_id": p.id,
                    "idempotency_key": p.id,
                    "match_prediction": {
                        "predicted_winner": p.predicted_winner.value if p.predicted_winner else "draw",
                        "predicted_scoreline": {
                            "home_team_goals": p.predicted_home_goals or 0,
                            "away_team_goals": p.predicted_away_goals or 0
                        },
                        "probabilities": {
                            "home_win_probability": p.home_win_probability or 0.0,
                            "draw_probability": p.draw_probability or 0.0,
                            "away_win_probability": p.away_win_probability or 0.0
                        },
                        "clean_sheet_probability": {
                            "home_team": p.home_clean_sheet_probability or 0.0,
                            "away_team": p.away_clean_sheet_probability or 0.0
                        },
                        "first_goal_team": p.first_goal_team.value if p.first_goal_team else "none",
                        "both_teams_to_score": {
                            "prediction": p.both_teams_to_score_prediction if p.both_teams_to_score_prediction is not None else False,
                            "probability": p.both_teams_to_score_probability or 0.0
                        },
                        "total_goals_prediction": p.total_goals_prediction or 0,
                        "goal_scorers": p.goal_scorers or {"home": [], "away": []}
                    },
                    "player_predictions": [
                        {
                            "player_id": pp.player_id or f"pp-{pp.player_name}",
                            "player_name": pp.player_name,
                            "goal_probability": pp.goal_probability or 0.0,
                            "predicted_goals": pp.predicted_goals or 0,
                            "assist_probability": pp.assist_probability or 0.0
                        } for pp in p.player_predictions
                    ]
                })
                
            db.query(ScoreModel).filter(ScoreModel.match_id == str(match.id)).delete(synchronize_session='fetch')
            db.commit()
            
            for pred_payload in pred_payloads:
                service.calculate_and_save_match_score(pred_payload, actual_payload)
                
            scores = db.query(ScoreModel).filter(ScoreModel.match_id == str(match.id)).order_by(ScoreModel.base_score.desc()).all()
            current_rank = 1
            for i, s in enumerate(scores):
                if i > 0 and s.base_score == scores[i-1].base_score:
                    pass
                else:
                    current_rank = i + 1
                s.match_rank = current_rank
                if current_rank == 1:
                    s.grade = Grade.A
                    s.multiplier = 3
                elif current_rank in [2, 3, 4]:
                    s.grade = Grade.B
                    s.multiplier = 2
                else:
                    s.grade = Grade.C
                    s.multiplier = 1
                s.earned_points = s.base_score * s.multiplier
            db.commit()

        service.compute_and_save_leaderboard(None)
        print("Rescored all matches successfully.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    rescore_all()
