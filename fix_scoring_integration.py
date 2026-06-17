import re

with open("backend/app/api/scoring_routes.py", "r") as f:
    content = f.read()

new_endpoint = """
@router.post("/matches/{match_id}/calculate-scores")
def calculate_all_scores_for_match(
    match_id: str,
    db: Session = Depends(get_db),
    _organizer: object = Depends(get_current_organizer),
):
    from app.models.prediction import PredictionModel
    from app.models.actual_result import ActualResultModel
    from app.models.score import ScoreModel
    from fastapi import HTTPException
    
    actual = db.query(ActualResultModel).filter(ActualResultModel.match_id == match_id).first()
    if not actual:
        raise HTTPException(status_code=400, detail="Actual result not found for this match.")
        
    predictions = db.query(PredictionModel).filter(PredictionModel.match_id == match_id).all()
    if not predictions:
        return {"status": "no_predictions", "calculated_count": 0}
        
    # Build ActualResultSubmission equivalent payload
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

    service = ScoringService(db)
    count = 0
    for p in predictions:
        # Build PredictionSubmission payload
        pred_payload = {
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
                "first_goal_team": p.first_goal_team or "none",
                "both_teams_to_score_probability": p.btts_probability or 0.0,
                "goal_scorers": p.goal_scorers or {"home": [], "away": []}
            },
            "player_predictions": [
                {
                    "player_id": pp.player_id,
                    "player_name": pp.player_name,
                    "goal_probability": pp.goal_probability or 0.0,
                    "predicted_goals": pp.predicted_goals or 0,
                    "assist_probability": pp.assist_probability or 0.0
                } for pp in p.player_predictions
            ]
        }
        
        # Check if score already exists
        existing = db.query(ScoreModel).filter(ScoreModel.match_id == match_id, ScoreModel.team_id == p.team_id).first()
        if existing:
            # delete old score to recalculate
            db.delete(existing)
            db.commit()
            
        service.calculate_and_save_match_score(pred_payload, actual_payload)
        count += 1
        
    return {"status": "success", "calculated_count": count}
"""

if "calculate_all_scores_for_match" not in content:
    with open("backend/app/api/scoring_routes.py", "a") as f:
        f.write(new_endpoint)

