import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Uuid, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class ScoringConfigModel(Base):
    __tablename__ = "scoring_configs"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # --- Winner Prediction (Max 5) ---
    winner_points_correct: Mapped[float] = mapped_column(Float, default=2.5, nullable=False)
    winner_points_incorrect: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    first_team_to_score_points_correct: Mapped[float] = mapped_column(Float, default=2.5, nullable=False)
    first_team_to_score_points_incorrect: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # --- Scoreline Prediction (Max 10) ---
    scoreline_points_exact: Mapped[float] = mapped_column(Float, default=7.5, nullable=False)
    scoreline_points_one_team_correct: Mapped[float] = mapped_column(Float, default=4.0, nullable=False)
    scoreline_points_margin: Mapped[float] = mapped_column(Float, default=3.0, nullable=False)
    scoreline_points_incorrect: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    btts_points_correct: Mapped[float] = mapped_column(Float, default=2.5, nullable=False)
    btts_points_incorrect: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # --- Probability Accuracy (Max 5) ---
    # Winner Confidence
    prob_winner_high_threshold: Mapped[float] = mapped_column(Float, default=70.0, nullable=False)
    prob_winner_high_points: Mapped[float] = mapped_column(Float, default=2.0, nullable=False)
    prob_winner_medium_threshold: Mapped[float] = mapped_column(Float, default=50.0, nullable=False)
    prob_winner_medium_points: Mapped[float] = mapped_column(Float, default=1.5, nullable=False)
    prob_winner_low_threshold: Mapped[float] = mapped_column(Float, default=30.0, nullable=False)
    prob_winner_low_points: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    prob_winner_fail_points: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # BTTS Probability
    prob_btts_high_threshold: Mapped[float] = mapped_column(Float, default=70.0, nullable=False)
    prob_btts_high_points: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    prob_btts_medium_threshold: Mapped[float] = mapped_column(Float, default=50.0, nullable=False)
    prob_btts_medium_points: Mapped[float] = mapped_column(Float, default=0.75, nullable=False)
    prob_btts_low_threshold: Mapped[float] = mapped_column(Float, default=30.0, nullable=False)
    prob_btts_low_points: Mapped[float] = mapped_column(Float, default=0.5, nullable=False)
    prob_btts_fail_points: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # First Team To Score Probability
    prob_first_goal_high_threshold: Mapped[float] = mapped_column(Float, default=70.0, nullable=False)
    prob_first_goal_high_points: Mapped[float] = mapped_column(Float, default=2.0, nullable=False)
    prob_first_goal_medium_threshold: Mapped[float] = mapped_column(Float, default=50.0, nullable=False)
    prob_first_goal_medium_points: Mapped[float] = mapped_column(Float, default=1.5, nullable=False)
    prob_first_goal_low_threshold: Mapped[float] = mapped_column(Float, default=30.0, nullable=False)
    prob_first_goal_low_points: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    prob_first_goal_fail_points: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # --- Player Performance (Max 5) ---
    # Goal Scorers
    player_goals_all_correct: Mapped[float] = mapped_column(Float, default=2.5, nullable=False)
    player_goals_half_correct: Mapped[float] = mapped_column(Float, default=1.5, nullable=False)
    player_goals_at_least_one: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    player_goals_none: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # Clean Sheet
    clean_sheet_both_correct: Mapped[float] = mapped_column(Float, default=2.5, nullable=False)
    clean_sheet_one_correct: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    clean_sheet_none: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # --- Legacy fields (kept for backward compat) ---
    probability_threshold: Mapped[float] = mapped_column(Float, default=15.0, nullable=False)
    probability_points_pass: Mapped[float] = mapped_column(Float, default=5.0, nullable=False)
    probability_points_fail: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    probability_high_threshold: Mapped[float] = mapped_column(Float, default=15.0, nullable=False)
    probability_high_points: Mapped[float] = mapped_column(Float, default=5.0, nullable=False)
    probability_medium_threshold: Mapped[float] = mapped_column(Float, default=30.0, nullable=False)
    probability_medium_points: Mapped[float] = mapped_column(Float, default=2.0, nullable=False)
    player_points_exact: Mapped[float] = mapped_column(Float, default=5.0, nullable=False)
    player_points_close: Mapped[float] = mapped_column(Float, default=2.0, nullable=False)
    player_points_wrong: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    player_avg_threshold_exact: Mapped[float] = mapped_column(Float, default=4.0, nullable=False)
    player_avg_threshold_close: Mapped[float] = mapped_column(Float, default=2.0, nullable=False)
    total_goals_points_exact: Mapped[float] = mapped_column(Float, default=5.0, nullable=False)
    total_goals_points_wrong: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    clean_sheet_points_correct: Mapped[float] = mapped_column(Float, default=5.0, nullable=False)
    clean_sheet_points_incorrect: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    max_base_score: Mapped[int] = mapped_column(Integer, default=25, nullable=False)

    technical_max_per_category: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    technical_max_total: Mapped[int] = mapped_column(Integer, default=20, nullable=False)

    presentation_ai_explanation_max: Mapped[int] = mapped_column(Integer, default=20, nullable=False)
    presentation_qa_score_max: Mapped[int] = mapped_column(Integer, default=15, nullable=False)
    presentation_delivery_score_max: Mapped[int] = mapped_column(Integer, default=15, nullable=False)
    presentation_denominator: Mapped[int] = mapped_column(Integer, default=150, nullable=False)
    presentation_max_marks: Mapped[int] = mapped_column(Integer, default=20, nullable=False)

    multiplier_a: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    multiplier_b: Mapped[int] = mapped_column(Integer, default=2, nullable=False)
    multiplier_c: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    phase1_max_marks: Mapped[int] = mapped_column(Integer, default=60, nullable=False)

    presentation_criteria: Mapped[list | None] = mapped_column(JSON, nullable=True)
    presentation_judge_count: Mapped[int] = mapped_column(Integer, default=2, nullable=False)

    def to_dict(self) -> dict:
        d = {
            "id": str(self.id),
            "name": self.name,
            "is_active": self.is_active,
            "version": self.version,
            "created_at": self.created_at.isoformat(),
            "winner_points_correct": self.winner_points_correct,
            "winner_points_incorrect": self.winner_points_incorrect,
            "first_team_to_score_points_correct": self.first_team_to_score_points_correct,
            "first_team_to_score_points_incorrect": self.first_team_to_score_points_incorrect,
            "scoreline_points_exact": self.scoreline_points_exact,
            "scoreline_points_one_team_correct": self.scoreline_points_one_team_correct,
            "scoreline_points_margin": self.scoreline_points_margin,
            "scoreline_points_incorrect": self.scoreline_points_incorrect,
            "btts_points_correct": self.btts_points_correct,
            "btts_points_incorrect": self.btts_points_incorrect,
            "prob_winner_high_threshold": self.prob_winner_high_threshold,
            "prob_winner_high_points": self.prob_winner_high_points,
            "prob_winner_medium_threshold": self.prob_winner_medium_threshold,
            "prob_winner_medium_points": self.prob_winner_medium_points,
            "prob_winner_low_threshold": self.prob_winner_low_threshold,
            "prob_winner_low_points": self.prob_winner_low_points,
            "prob_winner_fail_points": self.prob_winner_fail_points,
            "prob_btts_high_threshold": self.prob_btts_high_threshold,
            "prob_btts_high_points": self.prob_btts_high_points,
            "prob_btts_medium_threshold": self.prob_btts_medium_threshold,
            "prob_btts_medium_points": self.prob_btts_medium_points,
            "prob_btts_low_threshold": self.prob_btts_low_threshold,
            "prob_btts_low_points": self.prob_btts_low_points,
            "prob_btts_fail_points": self.prob_btts_fail_points,
            "prob_first_goal_high_threshold": self.prob_first_goal_high_threshold,
            "prob_first_goal_high_points": self.prob_first_goal_high_points,
            "prob_first_goal_medium_threshold": self.prob_first_goal_medium_threshold,
            "prob_first_goal_medium_points": self.prob_first_goal_medium_points,
            "prob_first_goal_low_threshold": self.prob_first_goal_low_threshold,
            "prob_first_goal_low_points": self.prob_first_goal_low_points,
            "prob_first_goal_fail_points": self.prob_first_goal_fail_points,
            "player_goals_all_correct": self.player_goals_all_correct,
            "player_goals_half_correct": self.player_goals_half_correct,
            "player_goals_at_least_one": self.player_goals_at_least_one,
            "player_goals_none": self.player_goals_none,
            "clean_sheet_both_correct": self.clean_sheet_both_correct,
            "clean_sheet_one_correct": self.clean_sheet_one_correct,
            "clean_sheet_none": self.clean_sheet_none,
            "probability_threshold": self.probability_threshold,
            "probability_points_pass": self.probability_points_pass,
            "probability_points_fail": self.probability_points_fail,
            "probability_high_threshold": self.probability_high_threshold,
            "probability_high_points": self.probability_high_points,
            "probability_medium_threshold": self.probability_medium_threshold,
            "probability_medium_points": self.probability_medium_points,
            "player_points_exact": self.player_points_exact,
            "player_points_close": self.player_points_close,
            "player_points_wrong": self.player_points_wrong,
            "player_avg_threshold_exact": self.player_avg_threshold_exact,
            "player_avg_threshold_close": self.player_avg_threshold_close,
            "total_goals_points_exact": self.total_goals_points_exact,
            "total_goals_points_wrong": self.total_goals_points_wrong,
            "clean_sheet_points_correct": self.clean_sheet_points_correct,
            "clean_sheet_points_incorrect": self.clean_sheet_points_incorrect,
            "max_base_score": self.max_base_score,
            "technical_max_per_category": self.technical_max_per_category,
            "technical_max_total": self.technical_max_total,
            "presentation_ai_explanation_max": self.presentation_ai_explanation_max,
            "presentation_qa_score_max": self.presentation_qa_score_max,
            "presentation_delivery_score_max": self.presentation_delivery_score_max,
            "presentation_denominator": self.presentation_denominator,
            "presentation_max_marks": self.presentation_max_marks,
            "multiplier_a": self.multiplier_a,
            "multiplier_b": self.multiplier_b,
            "multiplier_c": self.multiplier_c,
            "phase1_max_marks": self.phase1_max_marks,
            "presentation_criteria": self.presentation_criteria or [
                {"name": "Problem Understanding", "max_score": 10},
                {"name": "Feature Engineering", "max_score": 15},
                {"name": "Team Work", "max_score": 10},
                {"name": "Presentation Quality", "max_score": 10},
                {"name": "Q&A", "max_score": 5}
            ],
            "presentation_judge_count": self.presentation_judge_count,
        }
        return d

