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
        self, evaluations: list[dict]
    ) -> list[dict]:
        config_dict, config_id = _load_active_config(self.db)
        result = calculate_presentation_scores(evaluations, config_dict)

        from app.models.evaluation import PresentationEvaluationModel, Grade

        for ev in result:
            team_id = ev["team_id"]
            existing = self.db.query(PresentationEvaluationModel).filter(
                PresentationEvaluationModel.team_id == team_id
            ).first()

            grade_val = ev.get("grade")
            grade_enum = Grade(grade_val) if grade_val and grade_val in ("A", "B", "C") else None

            if existing:
                existing.presentation_score = ev["presentation_score"]
                existing.raw_total = ev.get("raw_total")
                existing.rank = ev.get("rank")
                existing.grade = grade_enum
                existing.multiplier = ev.get("multiplier")
                self.db.commit()
            else:
                pres_eval = PresentationEvaluationModel(
                    team_id=team_id,
                    ai_explanation_score=ev.get("ai_explanation_score"),
                    qa_score=ev.get("qa_score"),
                    delivery_score=ev.get("delivery_score"),
                    raw_total=ev.get("raw_total"),
                    presentation_score=ev["presentation_score"],
                    rank=ev.get("rank"),
                    grade=grade_enum,
                    multiplier=ev.get("multiplier"),
                )
                self.db.add(pres_eval)
                self.db.commit()

        return result

    def compute_and_save_leaderboard(
        self, scores_input: list[dict]
    ) -> list[dict]:
        ranked = calculate_leaderboard(scores_input)

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
