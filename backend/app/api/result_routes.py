from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_organizer
from app.database.session import get_db
from app.schemas import ActualResultSubmission
from app.services.result_service import ResultService

router = APIRouter(tags=["actual-results"])


@router.post("/actual-results")
def submit_actual_result(
    payload: ActualResultSubmission,
    db: Session = Depends(get_db),
    _organizer: object = Depends(get_current_organizer),
):
    service = ResultService(db)
    return service.save_actual_result(payload.model_dump())
