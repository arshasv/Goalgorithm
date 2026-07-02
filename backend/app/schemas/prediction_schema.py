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

    @model_validator(mode="before")
    @classmethod
    def map_uploaded_json_fields(cls, data: dict):
        print("map_uploaded_json_fields executed", flush=True)
        print(f"Incoming payload: {data}", flush=True)

        if not isinstance(data, dict):
            return data
            
        # Copy to avoid mutating original payload directly
        data = data.copy()

        # Extract native 'output' block if present
        if "output" in data and isinstance(data["output"], dict):
            out = data.pop("output")
            for k, v in out.items():
                data[k] = v

        if "match_prediction" not in data:
            data["match_prediction"] = {}
        elif not isinstance(data["match_prediction"], dict):
            data["match_prediction"] = {}
        else:
            data["match_prediction"] = data["match_prediction"].copy()

        match_pred = data["match_prediction"]

        home_team_name = None
        away_team_name = None

        # Map score_prediction fields
        if "score_prediction" in data and isinstance(data["score_prediction"], dict):
            score_pred = data.pop("score_prediction")
            if "predicted_scoreline" in score_pred and isinstance(score_pred["predicted_scoreline"], dict):
                scoreline = score_pred["predicted_scoreline"].copy()
                home_team_name = scoreline.get("home_team")
                away_team_name = scoreline.get("away_team")
                
                if "home_goals" in scoreline:
                    scoreline["home_team_goals"] = scoreline.pop("home_goals")
                if "away_goals" in scoreline:
                    scoreline["away_team_goals"] = scoreline.pop("away_goals")
                match_pred["predicted_scoreline"] = scoreline
            
            if "total_goals" in score_pred:
                match_pred["total_goals_prediction"] = score_pred["total_goals"]

        # Map win_probabilities
        if "win_probabilities" in match_pred and isinstance(match_pred["win_probabilities"], dict):
            win_probs = match_pred.pop("win_probabilities")
            probabilities = match_pred.get("probabilities", {})
            if isinstance(probabilities, dict):
                probabilities = probabilities.copy()
            else:
                probabilities = {}
                
            if "home_team" in win_probs and isinstance(win_probs["home_team"], dict):
                probabilities["home_win_probability"] = win_probs["home_team"].get("probability")
            elif "home_win_probability" in win_probs:
                probabilities["home_win_probability"] = win_probs["home_win_probability"]

            if "draw" in win_probs and isinstance(win_probs["draw"], dict):
                probabilities["draw_probability"] = win_probs["draw"].get("probability")
            elif "draw_probability" in win_probs:
                probabilities["draw_probability"] = win_probs["draw_probability"]

            if "away_team" in win_probs and isinstance(win_probs["away_team"], dict):
                probabilities["away_win_probability"] = win_probs["away_team"].get("probability")
            elif "away_win_probability" in win_probs:
                probabilities["away_win_probability"] = win_probs["away_win_probability"]

            match_pred["probabilities"] = probabilities

        # Map goal_insights
        if "goal_insights" in data and isinstance(data["goal_insights"], dict):
            insights = data.pop("goal_insights")
            if "first_team_to_score" in insights:
                match_pred["first_team_to_score"] = insights["first_team_to_score"]
                # Normalize team names identically to ModelSerializer
                if isinstance(match_pred["first_team_to_score"], dict):
                    team_val = match_pred["first_team_to_score"].get("team")
                    if team_val == "home_team" or (home_team_name and team_val == home_team_name):
                        match_pred["first_team_to_score"]["team"] = "home"
                    elif team_val == "away_team" or (away_team_name and team_val == away_team_name):
                        match_pred["first_team_to_score"]["team"] = "away"
            if "both_teams_to_score" in insights:
                match_pred["both_teams_to_score"] = insights["both_teams_to_score"]

        clean_sheet_preds = []
        
        # Process native player_prediction object (home_team/away_team split)
        if "player_prediction" in data and isinstance(data["player_prediction"], dict):
            player_pred = data.pop("player_prediction")
            flat_player_predictions = []

            for side in ["home_team", "away_team"]:
                if side in player_pred and isinstance(player_pred[side], dict):
                    side_data = player_pred[side]
                    short_side = "home" if side == "home_team" else "away"
                    
                    # Goal predictions
                    goal_list = side_data.get("goal", [])
                    for p in goal_list:
                        if not isinstance(p, dict): continue
                        name = p.get("name")
                        preds = p.get("predictions", [])
                        if not preds: continue
                        best_pred = max(preds, key=lambda x: x.get("probability", 0) if isinstance(x, dict) else 0)
                        predicted_goals = best_pred.get("goal_count", 0)
                        goal_prob = best_pred.get("probability", 0)
                        
                        flat_player_predictions.append({
                            "player_name": name,
                            "team": short_side,
                            "predicted_goals": predicted_goals,
                            "probability": goal_prob
                        })
                    
                    # Clean sheet
                    cs = side_data.get("clean_sheet_prediction", {})
                    if cs and isinstance(cs, dict) and (cs.get("goalkeeper") or cs.get("prediction") is not None):
                        clean_sheet_preds.append(cs)
                        
            data["player_predictions"] = flat_player_predictions

        # Map flat clean_sheet_predictions (if provided flatly)
        if "clean_sheet_predictions" in data and isinstance(data["clean_sheet_predictions"], list):
            clean_sheet_preds.extend(data.pop("clean_sheet_predictions"))
            
        if clean_sheet_preds:
            match_pred["clean_sheet_predictions"] = clean_sheet_preds

        # Legacy map if player_predictions array already provided directly
        if "player_predictions" in data and isinstance(data["player_predictions"], list):
            new_players = []
            for p in data["player_predictions"]:
                if isinstance(p, dict):
                    p = p.copy()
                    if "name" in p:
                        p["player_name"] = p.pop("name")
                    if "goal_count" in p:
                        p["predicted_goals"] = p.pop("goal_count")
                    
                    team_val = p.get("team")
                    if team_val == "home_team" or (home_team_name and team_val == home_team_name):
                        p["team"] = "home"
                    elif team_val == "away_team" or (away_team_name and team_val == away_team_name):
                        p["team"] = "away"
                new_players.append(p)
            data["player_predictions"] = new_players

        data["match_prediction"] = match_pred

        print(f"Transformed payload: {data}", flush=True)
        if data.get("player_predictions"):
            print(f"First player_prediction element: {data['player_predictions'][0]}", flush=True)

        return data
