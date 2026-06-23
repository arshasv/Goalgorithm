from pydantic import BaseModel
from fastapi import APIRouter, Depends, UploadFile, File, Form, Response
from sqlalchemy.orm import Session
import csv
import io

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
    res = service.calculate_and_save_technical_score(evaluation.model_dump())
    service.compute_and_save_leaderboard(None)
    return res


@router.post("/presentation-score")
def calculate_presentation(
    evaluations: list[PresentationEvaluation],
    round_id: str | None = None,
    db: Session = Depends(get_db),
    _organizer: object = Depends(get_current_organizer),
):
    service = ScoringService(db)
    res = service.calculate_and_save_presentation_scores(
        [ev.model_dump() for ev in evaluations], round_id
    )
    service.compute_and_save_leaderboard(None)
    return res

@router.post("/presentation-score/upload-csv")
def upload_presentation_csv(
    file: UploadFile = File(...),
    round_id: str | None = Form(None),
    db: Session = Depends(get_db),
    _organizer: object = Depends(get_current_organizer),
):
    content = file.file.read()
    buffer = io.StringIO(content.decode('utf-8'))
    reader = csv.DictReader(buffer)
    
    from app.models.team import TeamModel
    from app.models.judge import JudgeModel
    
    import re
    def normalize_team_name(name: str) -> str:
        n = str(name).lower().strip()
        n = re.sub(r'^team\s+', '', n)
        n = re.sub(r'[-\u2013\u2014]', '-', n)
        n = re.sub(r'\s*-\s*', '-', n)
        return n
        
    def normalize_judge_name(name: str) -> str:
        n = str(name).lower().strip()
        # Remove anything in parentheses
        n = re.sub(r'\(.*?\)', '', n).strip()
        return n
        
    db_teams = db.query(TeamModel).all()
    db_judges = db.query(JudgeModel).all()
    
    from app.services.scoring_service import ScoringService, _load_active_config
    
    service = ScoringService(db)
    config, _ = _load_active_config(db)
    criteria = config.get("presentation_criteria", []) if config else []
    if not criteria:
        criteria = [
            {"name": "Problem Understanding", "max_score": 10},
            {"name": "Feature Engineering", "max_score": 15},
            {"name": "Team Work", "max_score": 10},
            {"name": "Presentation Quality", "max_score": 10},
            {"name": "Q&A", "max_score": 5}
        ]
    
    eval_map = {}
    processed = 0
    failed = 0
    errors = []
    
    try:
        for row_idx, row in enumerate(reader):
            team_name = str(row.get("Team Name", "")).strip()
            judge_name = str(row.get("Judge Name", "")).strip()
            
            team_id = None
            norm_csv_team = normalize_team_name(team_name)
            
            for t in db_teams:
                norm_db = normalize_team_name(t.name)
                if norm_csv_team and (norm_csv_team == norm_db or norm_csv_team in norm_db or norm_db in norm_csv_team):
                    team_id = str(t.id)
                    break
                    
            judge_id = None
            norm_csv_judge = normalize_judge_name(judge_name)
            raw_csv_judge = str(judge_name).lower().strip()
            
            for j in db_judges:
                norm_db_judge = normalize_judge_name(j.name)
                # Check for "Sayooj V.V (Judge1)" vs "Judge1" vs "Sayooj V.V"
                if raw_csv_judge in j.name.lower() or j.name.lower() in raw_csv_judge or norm_csv_judge == norm_db_judge:
                    judge_id = str(j.id)
                    break
            
            if not team_id:
                errors.append(f"Row {row_idx + 2}: Unknown team '{team_name}'")
                failed += 1
                continue
            if not judge_id:
                errors.append(f"Row {row_idx + 2}: Unknown judge '{judge_name}'")
                failed += 1
                continue
            
            scores = {}
            row_valid = True
            for c in criteria:
                c_name = c["name"].strip()
                # Handle exact match or fuzzy match (e.g., trailing spaces)
                val = None
                for key in row.keys():
                    if key and key.strip() == c_name:
                        val = row[key]
                        break
                        
                if val is not None and str(val).strip() != "":
                    try:
                        scores[c["name"]] = float(val)
                    except ValueError:
                        errors.append(f"Row {row_idx + 2}: Invalid score for {c_name}")
                        row_valid = False
                else:
                    scores[c["name"]] = 0.0
                    
            if row_valid:
                if team_id not in eval_map:
                    eval_map[team_id] = []
                eval_map[team_id].append({"judge_id": judge_id, "scores": scores})
                processed += 1
            else:
                failed += 1
                
        if eval_map:
            evals_list = []
            for tid, j_scores in eval_map.items():
                evals_list.append({
                    "team_id": tid,
                    "judge_scores": j_scores
                })
            service.calculate_and_save_presentation_scores(evals_list, round_id)
            service.compute_and_save_leaderboard(None)
            
    except Exception as e:
        errors.append(f"Server error during processing: {str(e)}")
        failed += 1
        
    return {"message": "CSV processed successfully", "processed": processed, "failed": failed, "errors": errors}

@router.post("/presentation-score/reset")
def reset_presentation_scores(
    round_id: str | None = None,
    db: Session = Depends(get_db),
    _organizer: object = Depends(get_current_organizer),
):
    from app.models.evaluation import PresentationEvaluationModel
    
    query = db.query(PresentationEvaluationModel)
    if round_id:
        query = query.filter(PresentationEvaluationModel.round_id == round_id)
        
    evals = query.all()
    count = len(evals)
    for ev in evals:
        ev.judge_scores = None
        ev.raw_total = None
        ev.presentation_score = None
        ev.rank = None
        ev.grade = None
        ev.multiplier = None
        ev.judge_count = None
        ev.max_marks = None
        ev.presentation_criteria_config = None
    db.commit()
    
    service = ScoringService(db)
    service.compute_and_save_leaderboard(None)
    
    return {"message": "Presentation scores reset successfully", "count": count}

@router.get("/presentation-score/template")
def download_presentation_template():
    content = "Team Name,Judge Name,Problem Understanding,Feature Engineering,Team Work,Presentation Quality,Q&A\n"
    return Response(content=content, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=presentation_scores_template.csv"})

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
                "clean_sheet_probability": {
                    "home_team": p.home_clean_sheet_probability or 0.0,
                    "away_team": p.away_clean_sheet_probability or 0.0
                },
                "first_goal_team": p.first_goal_team or "none",
                "both_teams_to_score_probability": p.both_teams_to_score_probability or 0.0,
                "total_goals_prediction": p.total_goals_prediction or 0,
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
        
    service.compute_and_save_leaderboard(None)
    return {"status": "success", "calculated_count": count}
