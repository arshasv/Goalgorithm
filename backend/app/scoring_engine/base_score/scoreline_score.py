from app.scoring_engine.base_score.btts_score import calculate_btts_score


def calculate_scoreline_score_breakdown(
    prediction: dict,
    actual_result: dict,
    config: dict | None = None,
) -> dict:
    pts_exact = config.get("scoreline_points_exact", 7.5) if config else 7.5
    pts_one_team = config.get("scoreline_points_one_team_correct", 4.0) if config else 4.0
    pts_margin = config.get("scoreline_points_margin", 3.0) if config else 3.0
    pts_incorrect = config.get("scoreline_points_incorrect", 0.0) if config else 0.0

    match_pred = prediction.get("match_prediction") or {}
    pred_scoreline = match_pred.get("predicted_scoreline") or {}
    actual_scoreline = actual_result.get("final_score") or {}

    pred_home = pred_scoreline.get("home_team_goals")
    pred_away = pred_scoreline.get("away_team_goals")
    actual_home = actual_scoreline.get("home_team_goals")
    actual_away = actual_scoreline.get("away_team_goals")

    if pred_home is None or pred_away is None or actual_home is None or actual_away is None:
        return {
            "exact_scoreline_points": float(pts_incorrect),
            "one_team_score_points": float(pts_incorrect),
            "goal_difference_points": float(pts_incorrect),
        }

    # 1. Exact Scoreline
    if pred_home == actual_home and pred_away == actual_away:
        return {
            "exact_scoreline_points": float(pts_exact),
            "one_team_score_points": 0.0,
            "goal_difference_points": 0.0,
        }

    # 2. Partials
    one_team_score_points = 0.0

    # One Team Goals Correct
    if (
        (pred_home == actual_home and pred_away != actual_away)
        or
        (pred_home != actual_home and pred_away == actual_away)
    ):
        one_team_score_points = float(pts_one_team)

    # Goal Difference Correct
    goal_difference_points = 0.0
    if (pred_home - pred_away) == (actual_home - actual_away):
        goal_difference_points = float(pts_margin)

    return {
        "exact_scoreline_points": 0.0,
        "one_team_score_points": one_team_score_points,
        "goal_difference_points": goal_difference_points,
    }


def calculate_scoreline_score(
    prediction: dict,
    actual_result: dict,
    config: dict | None = None,
) -> float:
    # Get config values or fall back to defaults
    pts_exact = config.get("scoreline_points_exact", 7.5) if config else 7.5
    pts_one_team = config.get("scoreline_points_one_team_correct", 4.0) if config else 4.0
    pts_margin = config.get("scoreline_points_margin", 3.0) if config else 3.0
    pts_btts = config.get("btts_points_correct", 2.5) if config else 2.5
    pts_incorrect = config.get("scoreline_points_incorrect", 0.0) if config else 0.0

    match_pred = prediction.get("match_prediction") or {}
    pred_scoreline = match_pred.get("predicted_scoreline") or {}
    actual_scoreline = actual_result.get("final_score") or {}

    pred_home = pred_scoreline.get("home_team_goals")
    pred_away = pred_scoreline.get("away_team_goals")
    actual_home = actual_scoreline.get("home_team_goals")
    actual_away = actual_scoreline.get("away_team_goals")

    if pred_home is None or pred_away is None or actual_home is None or actual_away is None:
        return float(pts_incorrect)

    # 1. Exact Scoreline
    if pred_home == actual_home and pred_away == actual_away:
        return float(pts_exact)

    # 2. Partials
    partial_score = 0.0

    # One Team Goals Correct
    if (
        (pred_home == actual_home and pred_away != actual_away)
        or
        (pred_home != actual_home and pred_away == actual_away)
    ):
        partial_score += float(pts_one_team)

    # Goal Difference Correct
    if (pred_home - pred_away) == (actual_home - actual_away):
        partial_score += float(pts_margin)

    # BTTS Correct
    btts_val = calculate_btts_score(prediction, actual_result, config)
    if btts_val > 0.0:
        partial_score += float(pts_btts)

# Cap the scoreline category at 10 points
return min(10.0, partial_score) if partial_score > 0 else float(pts_incorrect)