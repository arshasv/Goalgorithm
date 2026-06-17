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
    entries = db.query(LeaderboardModel).all()
    entries_by_team = {str(e.team_id): e for e in entries}

    result = []
    # Assign ranks to all teams. If not calculated, rank is end of the list.
    for team in teams:
        e = entries_by_team.get(str(team.id))
        if e:
            result.append({
                "id": str(e.id),
                "team_id": str(e.team_id),
                "team_code": team.team_id,
                "team_name": team.name,
                "rank": e.rank,
                "phase1_score": e.phase1_score,
                "technical_score": e.technical_score,
                "presentation_score": e.presentation_score,
                "final_score": e.final_score,
                "is_final": e.is_final,
                "generated_at": e.generated_at.isoformat(),
            })
        else:
            result.append({
                "id": f"dummy-{team.id}",
                "team_id": str(team.id),
                "team_code": team.team_id,
                "team_name": team.name,
                "rank": 999,
                "phase1_score": 0.0,
                "technical_score": 0.0,
                "presentation_score": 0.0,
                "final_score": 0.0,
                "is_final": False,
                "generated_at": None,
            })
    
    result.sort(key=lambda x: (-x["final_score"], x["team_name"]))
    # Recalculate rank based on sort just to be clean for uncalculated teams
    for i, res in enumerate(result):
        if res["rank"] == 999 or res["rank"] == 0:
            res["rank"] = i + 1

    return result
