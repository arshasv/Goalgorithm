SCORELINE_POINTS_EXACT = 10
SCORELINE_POINTS_MARGIN = 5
SCORELINE_POINTS_INCORRECT = 0


def _goal_margin(home_goals: int, away_goals: int) -> int:
    return abs(home_goals - away_goals)


def _goal_direction(home_goals: int, away_goals: int) -> str:
    if home_goals > away_goals:
        return "home"
    if away_goals > home_goals:
        return "away"
    return "draw"


def calculate_scoreline_score(
    prediction: dict,
    actual_result: dict,
) -> int:
    pred_scoreline = prediction["match_prediction"]["predicted_scoreline"]
    actual_scoreline = actual_result["final_score"]

    pred_home = pred_scoreline["home_team_goals"]
    pred_away = pred_scoreline["away_team_goals"]
    actual_home = actual_scoreline["home_team_goals"]
    actual_away = actual_scoreline["away_team_goals"]

    if (pred_home, pred_away) == (actual_home, actual_away):
        return SCORELINE_POINTS_EXACT

    pred_margin = _goal_margin(pred_home, pred_away)
    actual_margin = _goal_margin(actual_home, actual_away)
    pred_direction = _goal_direction(pred_home, pred_away)
    actual_direction = _goal_direction(actual_home, actual_away)

    if pred_margin == actual_margin and pred_direction == actual_direction:
        return SCORELINE_POINTS_MARGIN

    return SCORELINE_POINTS_INCORRECT
