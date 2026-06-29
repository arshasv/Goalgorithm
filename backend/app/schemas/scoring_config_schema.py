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
    {"key": "first_team_to_score_points_correct", "label": "First Team to Score — Correct", "description": "Points awarded for correctly predicting the first team to score."},
    {"key": "first_team_to_score_points_incorrect", "label": "First Team to Score — Incorrect", "description": "Points awarded when the first team to score prediction is wrong."},
    {"key": "scoreline_points_exact", "label": "Scoreline — Exact", "description": "Points awarded for predicting the exact final score (both home and away goals match)."},
    {"key": "scoreline_points_one_team_correct", "label": "Scoreline — One Team Correct", "description": "Points awarded when one team's goal count is predicted correctly but not the other."},
    {"key": "scoreline_points_margin", "label": "Scoreline — Margin Only", "description": "Points awarded when the predicted goal margin and direction match the actual result, but not the exact goals."},
    {"key": "scoreline_points_incorrect", "label": "Scoreline — Incorrect", "description": "Points awarded when neither the exact score nor the margin is correct."},
    {"key": "btts_points_correct", "label": "BTTS — Correct", "description": "Points awarded for correctly predicting whether both teams score."},
    {"key": "btts_points_incorrect", "label": "BTTS — Incorrect", "description": "Points awarded when the BTTS prediction is wrong."},
    {"key": "prob_winner_high_threshold", "label": "Prob — Winner High Threshold (≥%)", "description": "Minimum confidence % for the highest tier of winner probability points."},
    {"key": "prob_winner_high_points", "label": "Prob — Winner High Tier Points", "description": "Points when winner confidence ≥ the high threshold."},
    {"key": "prob_winner_medium_threshold", "label": "Prob — Winner Medium Threshold (≥%)", "description": "Minimum confidence % for the middle tier of winner probability points."},
    {"key": "prob_winner_medium_points", "label": "Prob — Winner Medium Tier Points", "description": "Points when winner confidence ≥ the medium threshold but below the high threshold."},
    {"key": "prob_winner_low_threshold", "label": "Prob — Winner Low Threshold (≥%)", "description": "Minimum confidence % for the lowest tier of winner probability points."},
    {"key": "prob_winner_low_points", "label": "Prob — Winner Low Tier Points", "description": "Points when winner confidence ≥ the low threshold but below the medium threshold."},
    {"key": "prob_winner_fail_points", "label": "Prob — Winner Fail Points", "description": "Points when winner confidence is below the low threshold."},
    {"key": "prob_btts_high_threshold", "label": "Prob — BTTS High Threshold (≥%)", "description": "Minimum confidence % for the highest tier of BTTS probability points."},
    {"key": "prob_btts_high_points", "label": "Prob — BTTS High Tier Points", "description": "Points when BTTS confidence ≥ the high threshold."},
    {"key": "prob_btts_medium_threshold", "label": "Prob — BTTS Medium Threshold (≥%)", "description": "Minimum confidence % for the middle tier of BTTS probability points."},
    {"key": "prob_btts_medium_points", "label": "Prob — BTTS Medium Tier Points", "description": "Points when BTTS confidence ≥ the medium threshold but below the high threshold."},
    {"key": "prob_btts_low_threshold", "label": "Prob — BTTS Low Threshold (≥%)", "description": "Minimum confidence % for the lowest tier of BTTS probability points."},
    {"key": "prob_btts_low_points", "label": "Prob — BTTS Low Tier Points", "description": "Points when BTTS confidence ≥ the low threshold but below the medium threshold."},
    {"key": "prob_btts_fail_points", "label": "Prob — BTTS Fail Points", "description": "Points when BTTS confidence is below the low threshold."},
    {"key": "prob_first_goal_high_threshold", "label": "Prob — First Goal High Threshold (≥%)", "description": "Minimum confidence % for the highest tier of first goal probability points."},
    {"key": "prob_first_goal_high_points", "label": "Prob — First Goal High Tier Points", "description": "Points when first goal confidence ≥ the high threshold."},
    {"key": "prob_first_goal_medium_threshold", "label": "Prob — First Goal Medium Threshold (≥%)", "description": "Minimum confidence % for the middle tier of first goal probability points."},
    {"key": "prob_first_goal_medium_points", "label": "Prob — First Goal Medium Tier Points", "description": "Points when first goal confidence ≥ the medium threshold but below the high threshold."},
    {"key": "prob_first_goal_low_threshold", "label": "Prob — First Goal Low Threshold (≥%)", "description": "Minimum confidence % for the lowest tier of first goal probability points."},
    {"key": "prob_first_goal_low_points", "label": "Prob — First Goal Low Tier Points", "description": "Points when first goal confidence ≥ the low threshold but below the medium threshold."},
    {"key": "prob_first_goal_fail_points", "label": "Prob — First Goal Fail Points", "description": "Points when first goal confidence is below the low threshold."},
    {"key": "player_goals_all_correct", "label": "Player — All Goal Scorers Correct", "description": "Points when every predicted goal scorer correctly matches the actual scorers."},
    {"key": "player_goals_half_correct", "label": "Player — ≥50% Goal Scorers Correct", "description": "Points when at least half of predicted goal scorers are correct."},
    {"key": "player_goals_at_least_one", "label": "Player — At Least One Scorer Correct", "description": "Points when at least one predicted goal scorer is correct."},
    {"key": "player_goals_none", "label": "Player — No Scorers Correct", "description": "Points when no predicted goal scorers are correct."},
    {"key": "clean_sheet_both_correct", "label": "Clean Sheet — Both Teams Correct", "description": "Points when both team clean sheet predictions are correct."},
    {"key": "clean_sheet_one_correct", "label": "Clean Sheet — One Team Correct", "description": "Points when exactly one team's clean sheet prediction is correct."},
    {"key": "clean_sheet_none", "label": "Clean Sheet — None Correct", "description": "Points when no clean sheet predictions are correct."},
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

    # Winner Prediction (Max 5)
    winner_points_correct: float = 2.5
    winner_points_incorrect: float = 0.0
    first_team_to_score_points_correct: float = 2.5
    first_team_to_score_points_incorrect: float = 0.0

    # Scoreline Prediction (Max 10)
    scoreline_points_exact: float = 7.5
    scoreline_points_one_team_correct: float = 4.0
    scoreline_points_margin: float = 3.0
    scoreline_points_incorrect: float = 0.0
    btts_points_correct: float = 2.5
    btts_points_incorrect: float = 0.0

    # Probability Accuracy — Winner Confidence
    prob_winner_high_threshold: float = 70.0
    prob_winner_high_points: float = 2.0
    prob_winner_medium_threshold: float = 50.0
    prob_winner_medium_points: float = 1.5
    prob_winner_low_threshold: float = 30.0
    prob_winner_low_points: float = 1.0
    prob_winner_fail_points: float = 0.0

    # Probability Accuracy — BTTS
    prob_btts_high_threshold: float = 70.0
    prob_btts_high_points: float = 1.0
    prob_btts_medium_threshold: float = 50.0
    prob_btts_medium_points: float = 0.75
    prob_btts_low_threshold: float = 30.0
    prob_btts_low_points: float = 0.5
    prob_btts_fail_points: float = 0.0

    # Probability Accuracy — First Team to Score
    prob_first_goal_high_threshold: float = 70.0
    prob_first_goal_high_points: float = 2.0
    prob_first_goal_medium_threshold: float = 50.0
    prob_first_goal_medium_points: float = 1.5
    prob_first_goal_low_threshold: float = 30.0
    prob_first_goal_low_points: float = 1.0
    prob_first_goal_fail_points: float = 0.0

    # Player Performance — Goal Scorers
    player_goals_all_correct: float = 2.5
    player_goals_half_correct: float = 1.5
    player_goals_at_least_one: float = 1.0
    player_goals_none: float = 0.0

    # Player Performance — Clean Sheet
    clean_sheet_both_correct: float = 2.5
    clean_sheet_one_correct: float = 1.0
    clean_sheet_none: float = 0.0

    # Legacy fields (kept for backward compat)
    probability_threshold: float = 15.0
    probability_points_pass: float = 5.0
    probability_points_fail: float = 0.0
    probability_high_threshold: float = 15.0
    probability_high_points: float = 5.0
    probability_medium_threshold: float = 30.0
    probability_medium_points: float = 2.0
    player_points_exact: float = 5.0
    player_points_close: float = 2.0
    player_points_wrong: float = 0.0
    player_avg_threshold_exact: float = 4.0
    player_avg_threshold_close: float = 2.0
    total_goals_points_exact: float = 5.0
    total_goals_points_wrong: float = 0.0
    clean_sheet_points_correct: float = 5.0
    clean_sheet_points_incorrect: float = 0.0

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
                   "first_team_to_score_points_correct", "first_team_to_score_points_incorrect",
                   "scoreline_points_exact", "scoreline_points_one_team_correct",
                   "scoreline_points_margin", "scoreline_points_incorrect",
                   "btts_points_correct", "btts_points_incorrect",
                   "prob_winner_high_points", "prob_winner_medium_points", "prob_winner_low_points",
                   "prob_winner_fail_points",
                   "prob_btts_high_points", "prob_btts_medium_points", "prob_btts_low_points",
                   "prob_btts_fail_points",
                   "prob_first_goal_high_points", "prob_first_goal_medium_points", "prob_first_goal_low_points",
                   "prob_first_goal_fail_points",
                   "player_goals_all_correct", "player_goals_half_correct", "player_goals_at_least_one",
                   "player_goals_none",
                   "clean_sheet_both_correct", "clean_sheet_one_correct", "clean_sheet_none",
                   "probability_points_pass", "probability_points_fail",
                   "probability_high_points", "probability_medium_points",
                   "player_points_exact", "player_points_close", "player_points_wrong",
                   "total_goals_points_exact", "total_goals_points_wrong",
                   "clean_sheet_points_correct", "clean_sheet_points_incorrect",
                   "max_base_score",
                   "technical_max_per_category", "technical_max_total",
                   "presentation_ai_explanation_max", "presentation_qa_score_max",
                   "presentation_delivery_score_max", "presentation_denominator", "presentation_max_marks",
                   "multiplier_a", "multiplier_b", "multiplier_c",
                   "phase1_max_marks", "presentation_judge_count"]:
            _check_positive(f, getattr(self, f, None), errors)
        for thresh in ["prob_winner_high_threshold", "prob_winner_medium_threshold", "prob_winner_low_threshold",
                        "prob_btts_high_threshold", "prob_btts_medium_threshold", "prob_btts_low_threshold",
                        "prob_first_goal_high_threshold", "prob_first_goal_medium_threshold", "prob_first_goal_low_threshold",
                        "probability_threshold", "probability_high_threshold", "probability_medium_threshold"]:
            val = getattr(self, thresh, None)
            if val is not None:
                if val < 0:
                    errors.append(f"{thresh} cannot be negative")
                if val > 100:
                    errors.append(f"{thresh} must be ≤ 100")
        if self.player_avg_threshold_exact < 0:
            errors.append("player_avg_threshold_exact cannot be negative")
        if self.player_avg_threshold_close < 0:
            errors.append("player_avg_threshold_close cannot be negative")
        if errors:
            raise ValueError("; ".join(errors))
        return self


class ScoringConfigUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)

    # Winner Prediction
    winner_points_correct: float | None = None
    winner_points_incorrect: float | None = None
    first_team_to_score_points_correct: float | None = None
    first_team_to_score_points_incorrect: float | None = None

    # Scoreline Prediction
    scoreline_points_exact: float | None = None
    scoreline_points_one_team_correct: float | None = None
    scoreline_points_margin: float | None = None
    scoreline_points_incorrect: float | None = None
    btts_points_correct: float | None = None
    btts_points_incorrect: float | None = None

    # Probability — Winner Confidence
    prob_winner_high_threshold: float | None = None
    prob_winner_high_points: float | None = None
    prob_winner_medium_threshold: float | None = None
    prob_winner_medium_points: float | None = None
    prob_winner_low_threshold: float | None = None
    prob_winner_low_points: float | None = None
    prob_winner_fail_points: float | None = None

    # Probability — BTTS
    prob_btts_high_threshold: float | None = None
    prob_btts_high_points: float | None = None
    prob_btts_medium_threshold: float | None = None
    prob_btts_medium_points: float | None = None
    prob_btts_low_threshold: float | None = None
    prob_btts_low_points: float | None = None
    prob_btts_fail_points: float | None = None

    # Probability — First Team to Score
    prob_first_goal_high_threshold: float | None = None
    prob_first_goal_high_points: float | None = None
    prob_first_goal_medium_threshold: float | None = None
    prob_first_goal_medium_points: float | None = None
    prob_first_goal_low_threshold: float | None = None
    prob_first_goal_low_points: float | None = None
    prob_first_goal_fail_points: float | None = None

    # Player Performance — Goal Scorers
    player_goals_all_correct: float | None = None
    player_goals_half_correct: float | None = None
    player_goals_at_least_one: float | None = None
    player_goals_none: float | None = None

    # Player Performance — Clean Sheet
    clean_sheet_both_correct: float | None = None
    clean_sheet_one_correct: float | None = None
    clean_sheet_none: float | None = None

    # Legacy fields
    probability_threshold: float | None = None
    probability_points_pass: float | None = None
    probability_points_fail: float | None = None
    probability_high_threshold: float | None = None
    probability_high_points: float | None = None
    probability_medium_threshold: float | None = None
    probability_medium_points: float | None = None
    player_points_exact: float | None = None
    player_points_close: float | None = None
    player_points_wrong: float | None = None
    player_avg_threshold_exact: float | None = None
    player_avg_threshold_close: float | None = None
    total_goals_points_exact: float | None = None
    total_goals_points_wrong: float | None = None
    clean_sheet_points_correct: float | None = None
    clean_sheet_points_incorrect: float | None = None

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
                   "first_team_to_score_points_correct", "first_team_to_score_points_incorrect",
                   "scoreline_points_exact", "scoreline_points_one_team_correct",
                   "scoreline_points_margin", "scoreline_points_incorrect",
                   "btts_points_correct", "btts_points_incorrect",
                   "prob_winner_high_points", "prob_winner_medium_points", "prob_winner_low_points",
                   "prob_winner_fail_points",
                   "prob_btts_high_points", "prob_btts_medium_points", "prob_btts_low_points",
                   "prob_btts_fail_points",
                   "prob_first_goal_high_points", "prob_first_goal_medium_points", "prob_first_goal_low_points",
                   "prob_first_goal_fail_points",
                   "player_goals_all_correct", "player_goals_half_correct", "player_goals_at_least_one",
                   "player_goals_none",
                   "clean_sheet_both_correct", "clean_sheet_one_correct", "clean_sheet_none",
                   "probability_points_pass", "probability_points_fail",
                   "probability_high_points", "probability_medium_points",
                   "player_points_exact", "player_points_close", "player_points_wrong",
                   "total_goals_points_exact", "total_goals_points_wrong",
                   "clean_sheet_points_correct", "clean_sheet_points_incorrect",
                   "max_base_score",
                   "technical_max_per_category", "technical_max_total",
                   "presentation_ai_explanation_max", "presentation_qa_score_max",
                   "presentation_delivery_score_max", "presentation_denominator", "presentation_max_marks",
                   "multiplier_a", "multiplier_b", "multiplier_c",
                   "phase1_max_marks", "presentation_judge_count"]:
            val = getattr(self, f, None)
            if val is not None:
                _check_positive(f, val, errors)
        for thresh in ["prob_winner_high_threshold", "prob_winner_medium_threshold", "prob_winner_low_threshold",
                        "prob_btts_high_threshold", "prob_btts_medium_threshold", "prob_btts_low_threshold",
                        "prob_first_goal_high_threshold", "prob_first_goal_medium_threshold", "prob_first_goal_low_threshold",
                        "probability_threshold", "probability_high_threshold", "probability_medium_threshold"]:
            val = getattr(self, thresh, None)
            if val is not None:
                if val < 0:
                    errors.append(f"{thresh} cannot be negative")
                if val > 100:
                    errors.append(f"{thresh} must be ≤ 100")
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

    # Winner Prediction
    winner_points_correct: float
    winner_points_incorrect: float
    first_team_to_score_points_correct: float
    first_team_to_score_points_incorrect: float

    # Scoreline Prediction
    scoreline_points_exact: float
    scoreline_points_one_team_correct: float
    scoreline_points_margin: float
    scoreline_points_incorrect: float
    btts_points_correct: float
    btts_points_incorrect: float

    # Probability — Winner Confidence
    prob_winner_high_threshold: float
    prob_winner_high_points: float
    prob_winner_medium_threshold: float
    prob_winner_medium_points: float
    prob_winner_low_threshold: float
    prob_winner_low_points: float
    prob_winner_fail_points: float

    # Probability — BTTS
    prob_btts_high_threshold: float
    prob_btts_high_points: float
    prob_btts_medium_threshold: float
    prob_btts_medium_points: float
    prob_btts_low_threshold: float
    prob_btts_low_points: float
    prob_btts_fail_points: float

    # Probability — First Team to Score
    prob_first_goal_high_threshold: float
    prob_first_goal_high_points: float
    prob_first_goal_medium_threshold: float
    prob_first_goal_medium_points: float
    prob_first_goal_low_threshold: float
    prob_first_goal_low_points: float
    prob_first_goal_fail_points: float

    # Player Performance — Goal Scorers
    player_goals_all_correct: float
    player_goals_half_correct: float
    player_goals_at_least_one: float
    player_goals_none: float

    # Player Performance — Clean Sheet
    clean_sheet_both_correct: float
    clean_sheet_one_correct: float
    clean_sheet_none: float

    # Legacy fields
    probability_threshold: float
    probability_points_pass: float
    probability_points_fail: float
    probability_high_threshold: float
    probability_high_points: float
    probability_medium_threshold: float
    probability_medium_points: float
    player_points_exact: float
    player_points_close: float
    player_points_wrong: float
    player_avg_threshold_exact: float
    player_avg_threshold_close: float
    total_goals_points_exact: float
    total_goals_points_wrong: float
    clean_sheet_points_correct: float
    clean_sheet_points_incorrect: float

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
