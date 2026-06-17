from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.enums import UserRole
from app.models.match import MatchModel
from app.models.prediction import PredictionModel
from app.models.team import TeamModel
from app.models.user import UserModel
from app.schemas import PredictionSubmission
from app.services.prediction_service import PredictionService

router = APIRouter(tags=["predictions"])


@router.get("/predictions")
def list_predictions(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    teams = db.query(TeamModel).all()
    team_by_uuid = {str(t.id): t for t in teams}
    team_by_letter = {t.team_id: t for t in teams}

    # Build match lookup: match_id (string like "M32") → readable label
    matches = db.query(MatchModel).all()
    match_by_id = {str(m.id): m for m in matches}
    # Also index by match_number string for legacy IDs
    match_by_num = {f"M{m.match_number}": m for m in matches if m.match_number}

    if str(current_user.role).upper() == UserRole.ORGANIZER.value:
        predictions = db.query(PredictionModel).all()
    else:
        team = db.query(TeamModel).filter(TeamModel.user_id == current_user.id).first()
        if team:
            predictions = (
                db.query(PredictionModel)
                .filter(PredictionModel.team_id == str(team.id))
                .all()
            )
        else:
            predictions = []

    result = []
    for p in predictions:
        tm = team_by_uuid.get(str(p.team_id)) or team_by_letter.get(str(p.team_id))
        # Resolve match to human-readable name
        match_obj = match_by_id.get(str(p.match_id)) or match_by_num.get(str(p.match_id))
        if match_obj:
            match_label = f"M{match_obj.match_number}: {match_obj.home_team_name} vs {match_obj.away_team_name}"
        else:
            match_label = str(p.match_id)

        result.append({
            "id": str(p.id),
            "team_id": str(p.team_id),
            "team_code": tm.team_id if tm else '',
            "team_name": tm.name if tm else '',
            "team_leader_name": tm.team_leader_name if tm else '',
            "match_id": p.match_id,
            "match_label": match_label,
            "submission_id": p.submission_id,
            "idempotency_key": p.idempotency_key,
            "status": p.status.value if p.status else None,
            "match_prediction": {
                "predicted_winner": p.predicted_winner.value if p.predicted_winner else None,
                "predicted_scoreline": {
                    "home_team_goals": p.predicted_home_goals,
                    "away_team_goals": p.predicted_away_goals,
                },
                "probabilities": {
                    "home_win_probability": p.home_win_probability,
                    "draw_probability": p.draw_probability,
                    "away_win_probability": p.away_win_probability,
                },
                "first_goal_team": p.first_goal_team.value if p.first_goal_team else None,
                "both_teams_to_score_probability": p.both_teams_to_score_probability,
                "total_goals_prediction": p.total_goals_prediction,
                "goal_scorers": p.goal_scorers or {},
            },
            "player_predictions": [
                {
                    "player_id": pp.player_id,
                    "player_name": pp.player_name,
                    "goal_probability": pp.goal_probability,
                    "predicted_goals": pp.predicted_goals,
                    "assist_probability": pp.assist_probability,
                }
                for pp in p.player_predictions
            ] if p.player_predictions else [],
            "submitted_at": p.submitted_at.isoformat() if p.submitted_at else None,
        })
    return result



@router.post("/predictions")
def submit_prediction(
    payload: PredictionSubmission,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    if str(current_user.role).upper() == UserRole.ORGANIZER.value:
        import uuid
        try:
            team_uuid = uuid.UUID(payload.team_id)
            team = db.query(TeamModel).filter(TeamModel.id == team_uuid).first()
        except ValueError:
            team = db.query(TeamModel).filter(TeamModel.team_id == payload.team_id).first()
        if not team:
            raise HTTPException(status_code=400, detail=f"Team not found for given team_id: {payload.team_id}")
    else:
        team = db.query(TeamModel).filter(TeamModel.user_id == current_user.id).first()
        if not team:
            raise HTTPException(status_code=400, detail="Team not found for current user")
            
    payload.team_id = str(team.id)
    service = PredictionService(db)
    return service.save_prediction(payload.model_dump())
