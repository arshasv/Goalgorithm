from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_organizer
from app.database.session import get_db
from app.schemas import (
    ActualResultSubmission,
    PredictionSubmission,
    PresentationEvaluation,
    TechnicalEvaluation,
)
from app.services.scoring_service import ScoringService

router = APIRouter(tags=["scoring"])


class MatchScoreRequest(BaseModel):
    prediction: PredictionSubmission
    actual_result: ActualResultSubmission


@router.post("/calculate-match-score")
def calculate_match_score(
    payload: MatchScoreRequest,
    db: Session = Depends(get_db),
    _organizer: object = Depends(get_current_organizer),
):
    service = ScoringService(db)
    return service.calculate_and_save_match_score(
        payload.prediction.model_dump(),
        payload.actual_result.model_dump(),
    )


@router.post("/technical-score")
def calculate_technical(
    evaluation: TechnicalEvaluation,
    db: Session = Depends(get_db),
    _organizer: object = Depends(get_current_organizer),
):
    service = ScoringService(db)
    return service.calculate_and_save_technical_score(evaluation.model_dump())


@router.post("/presentation-score")
def calculate_presentation(
    evaluations: list[PresentationEvaluation],
    db: Session = Depends(get_db),
    _organizer: object = Depends(get_current_organizer),
):
    service = ScoringService(db)
    return service.calculate_and_save_presentation_scores(
        [ev.model_dump() for ev in evaluations]
    )
