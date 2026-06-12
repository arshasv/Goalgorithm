from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.enums import UserRole
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
    if current_user.role == UserRole.ORGANIZER:
        predictions = db.query(PredictionModel).all()
    else:
        team = db.query(TeamModel).filter(TeamModel.user_id == current_user.id).first()
        if team:
            predictions = (
                db.query(PredictionModel)
                .filter(PredictionModel.team_id == team.id)
                .all()
            )
        else:
            predictions = []
    return predictions


@router.post("/predictions")
def submit_prediction(
    payload: PredictionSubmission,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    team = db.query(TeamModel).filter(TeamModel.user_id == current_user.id).first()
    if not team:
        raise HTTPException(status_code=400, detail="Team not found for current user")
    payload.team_id = str(team.id)
    service = PredictionService(db)
    return service.save_prediction(payload.model_dump())
