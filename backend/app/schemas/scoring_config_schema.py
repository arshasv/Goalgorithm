import uuid
from datetime import datetime

from pydantic import BaseModel, Field, model_validator


def _check_positive(name: str, v: int | float | None, errors: list) -> None:
    if v is not None and v < 0:
        errors.append(f"{name} cannot be negative")


# --- Guidelines response ---

GUIDELINE_DESCRIPTIONS: list[dict] = [
    {"key": "winner_points_correct", "label": "Winner — Correct", "description": "Points awarded when a team correctly predicts the match winner."},
    {"key": "winner_points_incorrect", "label": "Winner — Incorrect", "description": "Points awarded when the predicted winner is wrong."},
    {"key": "scoreline_points_exact", "label": "Scoreline — Exact", "description": "Points awarded for predicting the exact final score (both home and away goals match)."},
    {"key": "scoreline_points_margin", "label": "Scoreline — Margin Only", "description": "Points awarded when the predicted goal margin and direction match the actual result, but not the exact goals."},
    {"key": "scoreline_points_incorrect", "label": "Scoreline — Incorrect", "description": "Points awarded when neither the exact score nor the margin is correct."},
    {"key": "probability_threshold", "label": "Probability Threshold (±%)", "description": "Maximum absolute percentage difference allowed between predicted and actual probabilities. All five probability fields must be within this range to earn points."},
    {"key": "probability_points_pass", "label": "Probability — Pass", "description": "Points awarded when all predicted probabilities are within the threshold."},
    {"key": "probability_points_fail", "label": "Probability — Fail", "description": "Points awarded when any predicted probability falls outside the threshold."},
    {"key": "player_points_exact", "label": "Player Performance — Exact", "description": "Points per player when predicted goals exactly match actual goals (difference = 0)."},
    {"key": "player_points_close", "label": "Player Performance — Close", "description": "Points per player when predicted goals are off by exactly 1."},
    {"key": "player_points_wrong", "label": "Player Performance — Wrong", "description": "Points per player when the prediction differs by 2 or more goals."},
    {"key": "player_avg_threshold_exact", "label": "Player Avg Threshold — Exact (≥)", "description": "Minimum average player score required for the team to receive exact points."},
    {"key": "player_avg_threshold_close", "label": "Player Avg Threshold — Close (≥)", "description": "Minimum average player score required for the team to receive close points."},
    {"key": "max_base_score", "label": "Max Base Score", "description": "The maximum possible base score for a single match (winner + scoreline + probability + player)."},
    {"key": "technical_max_per_category", "label": "Technical Eval — Max Per Category", "description": "Maximum score per technical evaluation dimension (code quality, backend, teamwork, AI explanation)."},
    {"key": "technical_max_total", "label": "Technical Eval — Max Total", "description": "Maximum total technical evaluation score across all four categories."},
    {"key": "presentation_ai_explanation_max", "label": "Presentation — AI Explanation Max", "description": "Maximum points for the AI explanation component of the presentation evaluation."},
    {"key": "presentation_qa_score_max", "label": "Presentation — Q&A Max", "description": "Maximum points for the Q&A component of the presentation evaluation."},
    {"key": "presentation_delivery_score_max", "label": "Presentation — Delivery Max", "description": "Maximum points for the delivery component of the presentation evaluation."},
    {"key": "presentation_denominator", "label": "Presentation — Denominator", "description": "Fixed denominator used in presentation score normalization formula."},
    {"key": "presentation_max_marks", "label": "Presentation — Max Marks", "description": "Maximum final presentation score after normalization."},
    {"key": "multiplier_a", "label": "Grade A Multiplier", "description": "Score multiplier applied to the top-ranked team (unique highest raw score)."},
    {"key": "multiplier_b", "label": "Grade B Multiplier", "description": "Score multiplier applied to middle-ranked teams."},
    {"key": "multiplier_c", "label": "Grade C Multiplier", "description": "Score multiplier applied to the lowest-ranked team (unique lowest raw score)."},
    {"key": "phase1_max_marks", "label": "Phase 1 — Max Marks", "description": "Maximum Phase 1 (AI accuracy) score after normalization."},
]


class ScoringConfigCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    winner_points_correct: int = 5
    winner_points_incorrect: int = 0
    scoreline_points_exact: int = 10
    scoreline_points_margin: int = 5
    scoreline_points_incorrect: int = 0
    probability_threshold: float = 15.0
    probability_points_pass: int = 5
    probability_points_fail: int = 0
    player_points_exact: int = 5
    player_points_close: int = 2
    player_points_wrong: int = 0
    player_avg_threshold_exact: float = 4.0
    player_avg_threshold_close: float = 2.0
    max_base_score: int = 25
    technical_max_per_category: int = 5
    technical_max_total: int = 20
    presentation_ai_explanation_max: int = 20
    presentation_qa_score_max: int = 15
    presentation_delivery_score_max: int = 15
    presentation_denominator: int = 150
    presentation_max_marks: int = 20
    multiplier_a: int = 3
    multiplier_b: int = 2
    multiplier_c: int = 1
    phase1_max_marks: int = 60
    presentation_criteria: list[dict] | None = None
    presentation_judge_count: int = 2

    @model_validator(mode="after")
    def validate_rules(self) -> "ScoringConfigCreate":
        errors: list[str] = []
        for f in ["winner_points_correct", "winner_points_incorrect",
                   "scoreline_points_exact", "scoreline_points_margin", "scoreline_points_incorrect"]:
            _check_positive(f, getattr(self, f, None), errors)
        for f in ["probability_points_pass", "probability_points_fail",
                   "player_points_exact", "player_points_close", "player_points_wrong",
                   "max_base_score",
                   "technical_max_per_category", "technical_max_total",
                   "presentation_ai_explanation_max", "presentation_qa_score_max",
                   "presentation_delivery_score_max", "presentation_denominator", "presentation_max_marks",
                   "multiplier_a", "multiplier_b", "multiplier_c",
                   "phase1_max_marks", "presentation_judge_count"]:
            _check_positive(f, getattr(self, f, None), errors)
        if self.probability_threshold < 0:
            errors.append("probability_threshold cannot be negative")
        if self.probability_threshold > 100:
            errors.append("probability_threshold must be ≤ 100")
        if self.player_avg_threshold_exact < 0:
            errors.append("player_avg_threshold_exact cannot be negative")
        if self.player_avg_threshold_close < 0:
            errors.append("player_avg_threshold_close cannot be negative")
        if errors:
            raise ValueError("; ".join(errors))
        return self


class ScoringConfigUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    winner_points_correct: int | None = None
    winner_points_incorrect: int | None = None
    scoreline_points_exact: int | None = None
    scoreline_points_margin: int | None = None
    scoreline_points_incorrect: int | None = None
    probability_threshold: float | None = None
    probability_points_pass: int | None = None
    probability_points_fail: int | None = None
    player_points_exact: int | None = None
    player_points_close: int | None = None
    player_points_wrong: int | None = None
    player_avg_threshold_exact: float | None = None
    player_avg_threshold_close: float | None = None
    max_base_score: int | None = None
    technical_max_per_category: int | None = None
    technical_max_total: int | None = None
    presentation_ai_explanation_max: int | None = None
    presentation_qa_score_max: int | None = None
    presentation_delivery_score_max: int | None = None
    presentation_denominator: int | None = None
    presentation_max_marks: int | None = None
    multiplier_a: int | None = None
    multiplier_b: int | None = None
    multiplier_c: int | None = None
    phase1_max_marks: int | None = None
    presentation_criteria: list[dict] | None = None
    presentation_judge_count: int | None = None

    @model_validator(mode="after")
    def validate_rules(self) -> "ScoringConfigUpdate":
        errors: list[str] = []
        for f in ["winner_points_correct", "winner_points_incorrect",
                   "scoreline_points_exact", "scoreline_points_margin", "scoreline_points_incorrect",
                   "probability_points_pass", "probability_points_fail",
                   "player_points_exact", "player_points_close", "player_points_wrong",
                   "max_base_score",
                   "technical_max_per_category", "technical_max_total",
                   "presentation_ai_explanation_max", "presentation_qa_score_max",
                   "presentation_delivery_score_max", "presentation_denominator", "presentation_max_marks",
                   "multiplier_a", "multiplier_b", "multiplier_c",
                   "phase1_max_marks", "presentation_judge_count"]:
            val = getattr(self, f, None)
            if val is not None:
                _check_positive(f, val, errors)
        if self.probability_threshold is not None:
            if self.probability_threshold < 0:
                errors.append("probability_threshold cannot be negative")
            if self.probability_threshold > 100:
                errors.append("probability_threshold must be ≤ 100")
        if self.player_avg_threshold_exact is not None and self.player_avg_threshold_exact < 0:
            errors.append("player_avg_threshold_exact cannot be negative")
        if self.player_avg_threshold_close is not None and self.player_avg_threshold_close < 0:
            errors.append("player_avg_threshold_close cannot be negative")
        if errors:
            raise ValueError("; ".join(errors))
        return self


class ScoringConfigResponse(BaseModel):
    id: uuid.UUID
    name: str
    is_active: bool
    version: int
    created_at: datetime
    winner_points_correct: int
    winner_points_incorrect: int
    scoreline_points_exact: int
    scoreline_points_margin: int
    scoreline_points_incorrect: int
    probability_threshold: float
    probability_points_pass: int
    probability_points_fail: int
    player_points_exact: int
    player_points_close: int
    player_points_wrong: int
    player_avg_threshold_exact: float
    player_avg_threshold_close: float
    max_base_score: int
    technical_max_per_category: int
    technical_max_total: int
    presentation_ai_explanation_max: int
    presentation_qa_score_max: int
    presentation_delivery_score_max: int
    presentation_denominator: int
    presentation_max_marks: int
    multiplier_a: int
    multiplier_b: int
    multiplier_c: int
    phase1_max_marks: int
    presentation_criteria: list[dict] | None = None
    presentation_judge_count: int

    model_config = {"from_attributes": True}



class ScoringConfigGuidelines(BaseModel):
    config: ScoringConfigResponse | None = None
    guidelines: list[dict] = GUIDELINE_DESCRIPTIONS
