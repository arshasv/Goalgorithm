from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.actual_result import ActualResultModel
from app.models.evaluation import (
    PresentationEvaluationModel,
    TechnicalEvaluationModel,
)
from app.models.leaderboard import LeaderboardModel
from app.models.match import MatchModel
from app.models.prediction import PredictionModel
from app.models.score import ScoreModel
from app.models.team import TeamModel
from app.models.user import UserModel
from app.models.enums import UserRole

router = APIRouter(tags=["scores"])


def _get_team_name_map(db: Session) -> dict[str, str]:
    return {str(t.id): t.name for t in db.query(TeamModel).all()}

def _get_team_id_map(db: Session) -> dict[str, str]:
    return {str(t.id): t.team_id for t in db.query(TeamModel).all()}


@router.get("/scores/daily")
def get_daily_scores(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    scores = (
        db.query(ScoreModel)
        .filter(ScoreModel.base_score.isnot(None))
        .all()
    )
    matches = {str(m.id): m for m in db.query(MatchModel).all()}
    team_names = _get_team_name_map(db)
    team_codes = _get_team_id_map(db)

    daily: dict[date, dict[str, dict]] = {}
    for s in scores:
        match = matches.get(s.match_id)
        if not match:
            continue
        d = match.scheduled_at.date()
        if d not in daily:
            daily[d] = {}
        team_name = team_names.get(s.team_id, s.team_id)
        team_code = team_codes.get(s.team_id, "")
        if team_name not in daily[d]:
            daily[d][team_name] = {"total_score": 0, "team_code": team_code}
        daily[d][team_name]["total_score"] += s.base_score or 0

    result = []
    for d in sorted(daily.keys(), reverse=True):
        entries = [
            {"team_name": name, "team_code": data["team_code"], "total_score": round(data["total_score"], 1)}
            for name, data in daily[d].items()
        ]
        entries.sort(key=lambda x: x["total_score"], reverse=True)
        for i, e in enumerate(entries):
            e["rank"] = i + 1
        result.append({"date": d.isoformat(), "teams": entries})

    return result


@router.get("/scores/match-breakdown")
def get_match_breakdown(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    matches = db.query(MatchModel).order_by(MatchModel.match_number).all()
    team_names = _get_team_name_map(db)
    team_codes = _get_team_id_map(db)

    actuals = {
        str(a.match_id): a for a in db.query(ActualResultModel).all()
    }
    scores_by_match: dict[str, list[ScoreModel]] = {}
    all_scores = db.query(ScoreModel).all()
    for s in all_scores:
        scores_by_match.setdefault(s.match_id, []).append(s)

    predictions_by_key: dict[tuple[str, str], PredictionModel] = {}
    for p in db.query(PredictionModel).all():
        predictions_by_key[(p.team_id, p.match_id)] = p

    result = []
    for m in matches:
        mid = str(m.id)
        actual = actuals.get(mid)
        match_scores = scores_by_match.get(mid, [])

        teams = []
        for s in match_scores:
            team_name = team_names.get(s.team_id, s.team_id)
            pred = predictions_by_key.get((s.team_id, mid))
            prediction_detail = None
            if pred:
                prediction_detail = {
                    "predicted_winner": pred.predicted_winner.value
                    if pred.predicted_winner
                    else None,
                    "predicted_home_goals": pred.predicted_home_goals,
                    "predicted_away_goals": pred.predicted_away_goals,
                    "status": pred.status.value if pred.status else None,
                }

            teams.append({
                "team_id": s.team_id,
                "team_code": team_codes.get(s.team_id, ""),
                "team_name": team_name,
                "prediction": prediction_detail,
                "score_breakdown": {
                    "winner_points": s.winner_points,
                    "scoreline_points": s.scoreline_points,
                    "probability_points": s.probability_points,
                    "player_points": s.player_points,
                    "base_score": s.base_score,
                    "earned_points": s.earned_points,
                },
            })

        actual_detail = None
        if actual:
            actual_detail = {
                "actual_winner": actual.actual_winner.value
                if actual.actual_winner
                else None,
                "actual_home_goals": actual.actual_home_goals,
                "actual_away_goals": actual.actual_away_goals,
            }

        result.append({
            "match_id": mid,
            "match_number": m.match_number,
            "home_team_name": m.home_team_name,
            "away_team_name": m.away_team_name,
            "scheduled_at": m.scheduled_at.isoformat(),
            "status": m.status.value if m.status else None,
            "actual_result": actual_detail,
            "teams": teams,
        })

    return result


def _get_team_id_for_user(
    db: Session, user: UserModel
) -> str | None:
    team = (
        db.query(TeamModel)
        .filter(TeamModel.user_id == user.id)
        .first()
    )
    return str(team.id) if team else None


@router.get("/evaluations/technical")
def get_technical_evaluations(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    team_names = _get_team_name_map(db)
    team_codes = _get_team_id_map(db)

    if current_user.role == UserRole.ORGANIZER:
        evaluations = db.query(TechnicalEvaluationModel).all()
    else:
        team_id = _get_team_id_for_user(db, current_user)
        if not team_id:
            return []
        evaluations = (
            db.query(TechnicalEvaluationModel)
            .filter(TechnicalEvaluationModel.team_id == team_id)
            .all()
        )

    return [
        {
            "team_id": e.team_id,
            "team_code": team_codes.get(e.team_id, ""),
            "team_name": team_names.get(e.team_id, e.team_id),
            "code_quality": e.code_quality,
            "backend_quality": e.backend_quality,
            "teamwork": e.teamwork,
            "ai_explanation": e.ai_explanation,
            "total_score": e.total_score,
            "submitted_at": e.submitted_at.isoformat()
            if e.submitted_at
            else None,
        }
        for e in evaluations
    ]


@router.get("/evaluations/presentation")
def get_presentation_evaluations(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    team_names = _get_team_name_map(db)
    team_codes = _get_team_id_map(db)

    if current_user.role == UserRole.ORGANIZER:
        evaluations = db.query(PresentationEvaluationModel).all()
    else:
        team_id = _get_team_id_for_user(db, current_user)
        if not team_id:
            return []
        evaluations = (
            db.query(PresentationEvaluationModel)
            .filter(PresentationEvaluationModel.team_id == team_id)
            .all()
        )

    return [
        {
            "team_id": e.team_id,
            "team_code": team_codes.get(e.team_id, ""),
            "team_name": team_names.get(e.team_id, e.team_id),
            "ai_explanation_score": e.ai_explanation_score,
            "qa_score": e.qa_score,
            "delivery_score": e.delivery_score,
            "raw_total": e.raw_total,
            "presentation_score": e.presentation_score,
            "rank": e.rank,
            "grade": e.grade.value if e.grade else None,
            "multiplier": e.multiplier,
            "submitted_at": e.submitted_at.isoformat()
            if e.submitted_at
            else None,
        }
        for e in evaluations
    ]
