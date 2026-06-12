from pydantic import BaseModel, Field, field_validator, model_validator
from typing import List


class PredictedScoreline(BaseModel):
    home_team_goals: int = Field(..., ge=0)
    away_team_goals: int = Field(..., ge=0)


class Probabilities(BaseModel):
    home_win_probability: float = Field(..., ge=0, le=100)
    draw_probability: float = Field(..., ge=0, le=100)
    away_win_probability: float = Field(..., ge=0, le=100)


class CleanSheetProbability(BaseModel):
    home_team: float = Field(..., ge=0, le=100)
    away_team: float = Field(..., ge=0, le=100)


class GoalScorers(BaseModel):
    home: List[str] = Field(default_factory=list)
    away: List[str] = Field(default_factory=list)


class MatchPrediction(BaseModel):
    predicted_winner: str
    predicted_scoreline: PredictedScoreline
    probabilities: Probabilities
    clean_sheet_probability: CleanSheetProbability
    first_goal_team: str
    both_teams_to_score_probability: float = Field(..., ge=0, le=100)
    total_goals_prediction: int = Field(..., ge=0)
    goal_scorers: GoalScorers = Field(default_factory=GoalScorers)

    @field_validator("predicted_winner")
    @classmethod
    def validate_winner(cls, v: str) -> str:
        allowed = {"home", "away", "draw"}
        if v.lower() not in allowed:
            raise ValueError(f"predicted_winner must be one of {allowed}")
        return v.lower()

    @field_validator("first_goal_team")
    @classmethod
    def validate_first_goal(cls, v: str) -> str:
        allowed = {"home", "away", "none"}
        if v.lower() not in allowed:
            raise ValueError(f"first_goal_team must be one of {allowed}")
        return v.lower()

    @model_validator(mode="after")
    def validate_goal_scorers(self):
        home_count = len(self.goal_scorers.home)
        away_count = len(self.goal_scorers.away)
        expected_home = self.predicted_scoreline.home_team_goals
        expected_away = self.predicted_scoreline.away_team_goals
        if home_count != expected_home:
            raise ValueError(
                f"Number of home goal scorers ({home_count}) must equal predicted home goals ({expected_home})"
            )
        if away_count != expected_away:
            raise ValueError(
                f"Number of away goal scorers ({away_count}) must equal predicted away goals ({expected_away})"
            )
        return self


class PlayerPrediction(BaseModel):
    player_id: str = Field(..., min_length=1)
    player_name: str = Field(..., min_length=1)
    goal_probability: float = Field(..., ge=0, le=100)
    predicted_goals: int = Field(..., ge=0)
    assist_probability: float = Field(..., ge=0, le=100)


class PredictionSubmission(BaseModel):
    team_id: str = Field(..., min_length=1)
    match_id: str = Field(..., min_length=1)
    submission_id: str = Field(..., min_length=1)
    idempotency_key: str = Field(..., min_length=1)
    match_prediction: MatchPrediction
    player_predictions: List[PlayerPrediction]

    @field_validator("player_predictions")
    @classmethod
    def validate_player_list(cls, v: List[PlayerPrediction]) -> List[PlayerPrediction]:
        if not v:
            raise ValueError("player_predictions cannot be empty")
        return v
