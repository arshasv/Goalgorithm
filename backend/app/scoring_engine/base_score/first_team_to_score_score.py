def calculate_first_team_to_score_score(
    prediction: dict,
    actual_result: dict,
    config: dict | None = None,
) -> float:
    points_correct = (
        config.get("first_team_to_score_points_correct", 2.5)
        if config
        else 2.5
    )
    points_incorrect = (
        config.get("first_team_to_score_points_incorrect", 0.0)
        if config
        else 0.0
    )

    match_pred = prediction.get("match_prediction") or {}
    pred_first_team = None

    if match_pred.get("first_team_to_score") is not None:
        if isinstance(match_pred["first_team_to_score"], dict):
            pred_first_team = match_pred["first_team_to_score"].get("team")
        else:
            pred_first_team = match_pred["first_team_to_score"]
    elif match_pred.get("first_goal_team") is not None:
        pred_first_team = match_pred["first_goal_team"]

    if pred_first_team is None:
        return float(points_incorrect)

    pred_first_team = str(pred_first_team).lower().strip()
    actual_first = str(
        actual_result.get("first_team_to_score", "none")
    ).lower().strip()

    if pred_first_team == actual_first:
        return float(points_correct)

    return float(points_incorrect)