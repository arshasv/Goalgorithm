from sqlalchemy.orm import Session

from app.models.score import ScoreModel
from app.models.scoring_config import ScoringConfigModel
from app.repositories.score_repository import (
    CumulativePhaseScoreRepository,
    ScoreRepository,
)
from app.scoring_engine.base_score.base_score_calculator import calculate_base_score
from app.scoring_engine.technical_evaluation.technical_score import (
    calculate_technical_score,
)
from app.scoring_engine.presentation_evaluation.presentation_score import (
    PHASE3_FIXED_DENOMINATOR,
    PHASE3_MAX_MARKS,
    calculate_presentation_scores,
)
from app.services.leaderboard_service import calculate_leaderboard


def _load_active_config(db: Session) -> tuple[dict | None, str | None]:
    config_record = db.query(ScoringConfigModel).filter(
        ScoringConfigModel.is_active.is_(True)
    ).first()
    if not config_record:
        return None, None
    return config_record.to_dict(), str(config_record.id)


class ScoringService:
    def __init__(self, db: Session):
        self.db = db
        self.score_repo = ScoreRepository(db)
        self.cumulative_repo = CumulativePhaseScoreRepository(db)

    def calculate_and_save_match_score(
        self, prediction: dict, actual_result: dict, actual_probabilities: dict | None = None
    ) -> dict:
        config_dict, config_id = _load_active_config(self.db)
        result = calculate_base_score(prediction, actual_result, actual_probabilities, config_dict)

        score = ScoreModel(
            team_id=prediction["team_id"],
            match_id=prediction["match_id"],
            winner_points=result["breakdown"].get("winner_score"),
            scoreline_points=result["breakdown"].get("scoreline_score"),
            probability_points=result["breakdown"].get("probability_score"),
            player_points=result["breakdown"].get("player_score"),
            base_score=result["base_score"],
            config_id=config_id,
        )
        self.db.add(score)
        self.db.commit()
        self.db.refresh(score)

        return result

    def calculate_and_save_technical_score(self, evaluation: dict) -> dict:
        config_dict, config_id = _load_active_config(self.db)
        result = calculate_technical_score(evaluation, config_dict)

        from app.models.evaluation import TechnicalEvaluationModel

        team_id = evaluation["team_id"]
        existing = self.db.query(TechnicalEvaluationModel).filter(
            TechnicalEvaluationModel.team_id == team_id
        ).first()
        if existing:
            for key, value in {
                "code_quality": evaluation.get("code_quality"),
                "backend_quality": evaluation.get("backend_quality"),
                "teamwork": evaluation.get("teamwork"),
                "ai_explanation": evaluation.get("ai_explanation"),
                "total_score": result["technical_score"],
            }.items():
                setattr(existing, key, value)
            self.db.commit()
        else:
            tech_eval = TechnicalEvaluationModel(
                team_id=team_id,
                code_quality=evaluation.get("code_quality"),
                backend_quality=evaluation.get("backend_quality"),
                teamwork=evaluation.get("teamwork"),
                ai_explanation=evaluation.get("ai_explanation"),
                total_score=result["technical_score"],
            )
            self.db.add(tech_eval)
            self.db.commit()

        return result

    def calculate_and_save_presentation_scores(
        self, evaluations: list[dict], round_id: str | None = None
    ) -> list[dict]:
        config, _ = _load_active_config(self.db)
        result = calculate_presentation_scores(evaluations, config)

        from app.models.evaluation import PresentationEvaluationModel

        for ev in result:
            team_id = ev["team_id"]
            query = self.db.query(PresentationEvaluationModel).filter(
                PresentationEvaluationModel.team_id == team_id
            )
            if round_id:
                query = query.filter(PresentationEvaluationModel.round_id == round_id)
            else:
                # To handle legacy items without round_id, fallback to picking the first one
                pass
                
            existing = query.first()

            if existing:
                existing.presentation_score = ev["presentation_score"]
                existing.raw_total = ev["raw_total"]
                existing.rank = ev["rank"]
                existing.grade = ev["grade"]
                existing.multiplier = ev["multiplier"]
                existing.judge_count = ev["judge_count"]
                existing.judge_scores = ev["judge_scores"]
                existing.presentation_criteria_config = ev["presentation_criteria_config"]
                existing.max_marks = ev["max_marks"]
                existing.round_id = round_id
                self.db.commit()
            else:
                pres_eval = PresentationEvaluationModel(
                    team_id=team_id,
                    raw_total=ev["raw_total"],
                    presentation_score=ev["presentation_score"],
                    rank=ev["rank"],
                    grade=ev["grade"],
                    multiplier=ev["multiplier"],
                    judge_count=ev["judge_count"],
                    judge_scores=ev["judge_scores"],
                    presentation_criteria_config=ev["presentation_criteria_config"],
                    max_marks=ev["max_marks"],
                    round_id=round_id
                )
                self.db.add(pres_eval)
                self.db.commit()

        return result


    def compute_and_save_leaderboard(
        self, scores_input: list[dict] = None
    ) -> list[dict]:
        from app.models.team import TeamModel
        from app.models.evaluation import TechnicalEvaluationModel, PresentationEvaluationModel
        
        teams = self.db.query(TeamModel).all()
        all_scores = self.db.query(ScoreModel).all()
        tech_evals = self.db.query(TechnicalEvaluationModel).all()
        pres_evals = self.db.query(PresentationEvaluationModel).all()
        
        config_dict, _ = _load_active_config(self.db)
        phase1_max = config_dict.get("phase1_max_marks", 60) if config_dict else 60
        
        team_base_scores = {str(t.id): 0.0 for t in teams}
        for s in all_scores:
            if s.base_score is not None:
                tid = str(s.team_id)
                if tid in team_base_scores:
                    team_base_scores[tid] += s.base_score
                
        max_base_score = max(team_base_scores.values()) if team_base_scores else 0.0
        
        tech_map = {str(e.team_id): e.total_score for e in tech_evals}
        # Aggregate presentation rounds (multiple rounds per team)
        team_pres_totals = {}
        unique_rounds = set()
        has_null_round = False
        
        for e in pres_evals:
            if e.raw_total is not None:
                if e.round_id is not None:
                    unique_rounds.add(e.round_id)
                else:
                    has_null_round = True
                    
                tid = str(e.team_id)
                weighted = e.raw_total * (e.multiplier or 1)
                team_pres_totals[tid] = team_pres_totals.get(tid, 0.0) + weighted
                
        round_count = len(unique_rounds) + (1 if has_null_round else 0)
        presentation_denominator = max(round_count * 150, 150)
                
        # Normalize to max 20 using dynamic denominator
        pres_map = {
            tid: round((total / presentation_denominator) * PHASE3_MAX_MARKS, 2)
            for tid, total in team_pres_totals.items()
        }
        
        computed_input = []
        for t in teams:
            tid = str(t.id)
            base = team_base_scores[tid]
            if max_base_score > 0:
                p1 = (base / max_base_score) * phase1_max
            else:
                p1 = 0.0
                
            computed_input.append({
                "team_id": tid,
                "phase1_score": round(p1, 2),
                "technical_score": tech_map.get(tid, 0.0),
                "presentation_score": pres_map.get(tid, 0.0)
            })

        ranked = calculate_leaderboard(computed_input)

        from app.models.leaderboard import LeaderboardModel

        for entry in ranked:
            team_id = entry["team_id"]
            existing = self.db.query(LeaderboardModel).filter(
                LeaderboardModel.team_id == team_id
            ).first()

            scores = entry.get("scores", {})

            if existing:
                existing.rank = entry["rank"]
                existing.phase1_score = scores.get("ai_accuracy")
                existing.technical_score = scores.get("technical")
                existing.presentation_score = scores.get("presentation")
                existing.final_score = entry["final_score"]
                existing.is_final = True
            else:
                leaderboard_entry = LeaderboardModel(
                    team_id=team_id,
                    rank=entry["rank"],
                    phase1_score=scores.get("ai_accuracy"),
                    technical_score=scores.get("technical"),
                    presentation_score=scores.get("presentation"),
                    final_score=entry["final_score"],
                    is_final=True,
                )
                self.db.add(leaderboard_entry)
        self.db.commit()

        return ranked
