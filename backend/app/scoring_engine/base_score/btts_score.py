def calculate_btts_score(
    prediction: dict,
    actual_result: dict,
    config: dict | None = None,
) -> float:
    points_correct = config.get("btts_points_correct", 2.5) if config else 2.5
    points_incorrect = config.get("btts_points_incorrect", 0.0) if config else 0.0

    match_pred = prediction.get("match_prediction") or {}
    pred_btts = None

    if match_pred.get("both_teams_to_score") is not None:
        if isinstance(match_pred["both_teams_to_score"], dict):
            pred_btts = match_pred["both_teams_to_score"].get("prediction")
        else:
            pred_btts = match_pred["both_teams_to_score"]
    elif match_pred.get("both_teams_to_score_probability") is not None:
        prob = match_pred["both_teams_to_score_probability"]
        pred_btts = prob >= 50.0 or (0.0 < prob <= 1.0 and prob >= 0.5)

    if pred_btts is None:
        # Fallback: check predicted scoreline
        pred_scoreline = match_pred.get("predicted_scoreline") or {}
        p_home_goals = pred_scoreline.get("home_team_goals")
        p_away_goals = pred_scoreline.get("away_team_goals")
        if p_home_goals is not None and p_away_goals is not None:
            pred_btts = p_home_goals > 0 and p_away_goals > 0

    if pred_btts is None:
        return float(points_incorrect)

    actual_scoreline = actual_result.get("final_score") or {}
    actual_home = actual_scoreline.get("home_team_goals")
    actual_away = actual_scoreline.get("away_team_goals")
    if actual_home is None or actual_away is None:
        return float(points_incorrect)
    actual_btts = actual_home > 0 and actual_away > 0

    if pred_btts == actual_btts:
        return float(points_correct)
    return float(points_incorrect)
