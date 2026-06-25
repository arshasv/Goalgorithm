from pydantic import BaseModel, Field, field_validator, model_validator
from typing import List, Optional


class PredictedScoreline(BaseModel):
    home_team_goals: int = Field(..., ge=0)
    away_team_goals: int = Field(..., ge=0)


class Probabilities(BaseModel):
    home_win_probability: float = Field(..., ge=0, le=100)
    draw_probability: float = Field(..., ge=0, le=100)
    away_win_probability: float = Field(..., ge=0, le=100)


class CleanSheetProbability(BaseModel):
    """Legacy flat format for backward compat with manual entry."""
    home_team: float = Field(..., ge=0, le=100)
    away_team: float = Field(..., ge=0, le=100)


class CleanSheetEntry(BaseModel):
    """Single clean sheet prediction from AI model output."""
    goalkeeper: str = Field(..., min_length=1)
    prediction: bool
    probability: float = Field(..., ge=0, le=100)


class BothTeamsToScore(BaseModel):
    """BTTS prediction + probability from AI model."""
    prediction: bool
    probability: float = Field(..., ge=0, le=100)


class FirstTeamToScore(BaseModel):
    """First team to score prediction from AI model."""
    team: str = Field(..., min_length=1)
    probability: float = Field(..., ge=0, le=100)


class GoalScorers(BaseModel):
    home: List[str] = Field(default_factory=list)
    away: List[str] = Field(default_factory=list)


class MatchPrediction(BaseModel):
    """Match prediction — supports both AI JSON format and manual entry.
    
    AI format uses:
      - both_teams_to_score: { prediction, probability }
      - first_team_to_score: { team, probability }
      - clean_sheet_predictions: [{ goalkeeper, prediction, probability }]
      - No explicit predicted_winner (calculated from probabilities)
    
    Manual/legacy format uses:
      - predicted_winner: "home"/"away"/"draw"
      - both_teams_to_score_probability: float
      - first_goal_team: "home"/"away"/"none"
      - clean_sheet_probability: { home_team, away_team }
    """
    # Winner — can be provided manually or auto-calculated from probabilities
    predicted_winner: Optional[str] = None
    predicted_scoreline: PredictedScoreline
    probabilities: Probabilities
    total_goals_prediction: Optional[int] = None

    # --- Goal insights (AI format) ---
    both_teams_to_score: Optional[BothTeamsToScore] = None
    first_team_to_score: Optional[FirstTeamToScore] = None

    # --- Clean sheet predictions (AI format) ---
    clean_sheet_predictions: Optional[List[CleanSheetEntry]] = None

    # --- Legacy fields for manual entry / backward compat ---
    clean_sheet_probability: Optional[CleanSheetProbability] = None
    first_goal_team: Optional[str] = None
    both_teams_to_score_probability: Optional[float] = Field(default=None, ge=0, le=100)
    goal_scorers: GoalScorers = Field(default_factory=GoalScorers)

    @field_validator("predicted_winner")
    @classmethod
    def validate_winner(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        allowed = {"home", "away", "draw"}
        if v.lower() not in allowed:
            raise ValueError(f"predicted_winner must be one of {allowed}")
        return v.lower()

    @field_validator("first_goal_team")
    @classmethod
    def validate_first_goal(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        allowed = {"home", "away", "none"}
        if v.lower() not in allowed:
            raise ValueError(f"first_goal_team must be one of {allowed}")
        return v.lower()

    @model_validator(mode="after")
    def resolve_computed_fields(self):
        """Auto-calculate predicted_winner from probabilities if not provided.
        Auto-calculate total_goals_prediction from scoreline if not provided.
        Resolve BTTS / first_goal from AI sub-objects to flat fields for compat."""
        # Auto-calculate predicted_winner from highest probability
        if self.predicted_winner is None:
            probs = {
                "home": self.probabilities.home_win_probability,
                "draw": self.probabilities.draw_probability,
                "away": self.probabilities.away_win_probability,
            }
            self.predicted_winner = max(probs, key=probs.get)

        # Auto-calculate total_goals
        if self.total_goals_prediction is None:
            self.total_goals_prediction = (
                self.predicted_scoreline.home_team_goals
                + self.predicted_scoreline.away_team_goals
            )

        # Resolve AI format both_teams_to_score → flat probability
        if self.both_teams_to_score is not None and self.both_teams_to_score_probability is None:
            self.both_teams_to_score_probability = self.both_teams_to_score.probability

        # Resolve AI format first_team_to_score → legacy first_goal_team
        if self.first_team_to_score is not None and self.first_goal_team is None:
            team_val = self.first_team_to_score.team.lower()
            if team_val in ("home", "away", "none"):
                self.first_goal_team = team_val
            else:
                # Store as-is (team name), don't force into enum for display
                self.first_goal_team = team_val

        return self

    @model_validator(mode="after")
    def validate_goal_scorers(self):
        """Validate goal scorers count matches scoreline — only if scorers provided."""
        home_count = len(self.goal_scorers.home)
        away_count = len(self.goal_scorers.away)
        expected_home = self.predicted_scoreline.home_team_goals
        expected_away = self.predicted_scoreline.away_team_goals

        # Only validate if scorers are actually provided (not empty defaults)
        if home_count > 0 or away_count > 0:
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
    """Player-level prediction.
    
    AI format: { player_name, team, predicted_goals, probability }
    Legacy format: { player_id, player_name, goal_probability, predicted_goals, assist_probability }
    """
    player_name: str = Field(..., min_length=1)
    team: Optional[str] = None
    predicted_goals: int = Field(default=0, ge=0)
    probability: Optional[float] = Field(default=None, ge=0, le=100)

    # Legacy fields for manual entry backward compat
    player_id: Optional[str] = None
    goal_probability: Optional[float] = Field(default=None, ge=0, le=100)
    assist_probability: Optional[float] = Field(default=None, ge=0, le=100)

    @model_validator(mode="after")
    def resolve_probability(self):
        """Map probability ↔ goal_probability for cross-format compat."""
        if self.probability is not None and self.goal_probability is None:
            self.goal_probability = self.probability
        elif self.goal_probability is not None and self.probability is None:
            self.probability = self.goal_probability
        return self


class PredictionSubmission(BaseModel):
    team_id: str = Field(..., min_length=1)
    match_id: str = Field(..., min_length=1)
    submission_id: str = Field(..., min_length=1)
    idempotency_key: str | None = None
    match_prediction: MatchPrediction
    player_predictions: List[PlayerPrediction] = Field(default_factory=list)
