from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_organizer
from app.database.session import get_db
from app.models.leaderboard import LeaderboardModel
from app.models.team import TeamModel
from app.services.scoring_service import ScoringService

router = APIRouter(tags=["leaderboard"])


class LeaderboardEntry(BaseModel):
    team_id: str = Field(..., min_length=1)
    phase1_score: float = Field(..., ge=0, le=60)
    technical_score: float = Field(..., ge=0, le=20)
    presentation_score: float = Field(..., ge=0, le=20)


@router.post("/leaderboard/calculate")
def generate_leaderboard(
    scores: list[LeaderboardEntry],
    db: Session = Depends(get_db),
    _organizer: object = Depends(get_current_organizer),
):
    service = ScoringService(db)
    data = [s.model_dump() for s in scores]
    return service.compute_and_save_leaderboard(data)


@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    teams = db.query(TeamModel).all()
    team_by_uuid = {str(t.id): t for t in teams}
    team_by_letter = {t.team_id: t for t in teams}
    entries = (
        db.query(LeaderboardModel)
        .order_by(LeaderboardModel.rank)
        .all()
    )
    result = []
    for e in entries:
        tm = team_by_uuid.get(str(e.team_id)) or team_by_letter.get(str(e.team_id))
        result.append({
            "id": str(e.id),
            "team_id": str(e.team_id),
            "team_code": tm.team_id if tm else '',
            "team_name": tm.name if tm else '',
            "rank": e.rank,
            "phase1_score": e.phase1_score,
            "technical_score": e.technical_score,
            "presentation_score": e.presentation_score,
            "final_score": e.final_score,
            "is_final": e.is_final,
            "generated_at": e.generated_at.isoformat(),
        })
    return result
