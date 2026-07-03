def calculate_clean_sheet_score(
    prediction: dict,
    actual_result: dict,
    config: dict | None = None,
) -> float:
    both_correct_pts = (
        config.get("clean_sheet_both_correct", 2.5) if config else 2.5
    )
    one_correct_pts = (
        config.get("clean_sheet_one_correct", 1.0) if config else 1.0
    )
    none_pts = (
        config.get("clean_sheet_none", 0.0) if config else 0.0
    )

    match_pred = prediction.get("match_prediction") or {}
    pred_scoreline = match_pred.get("predicted_scoreline") or {}

    p_home_goals = pred_scoreline.get("home_team_goals")
    p_away_goals = pred_scoreline.get("away_team_goals")

    home_pred_cs = None
    away_pred_cs = None

    # Check clean_sheet_predictions
    csp = match_pred.get("clean_sheet_predictions")
    if csp and isinstance(csp, list) and len(csp) >= 2:
        home_pred_cs = csp[0].get("prediction")
        away_pred_cs = csp[1].get("prediction")

    # Check legacy clean_sheet_probability
    legacy_cs = match_pred.get("clean_sheet_probability")
    if (home_pred_cs is None or away_pred_cs is None) and legacy_cs:
        h_val = legacy_cs.get("home_team")
        a_val = legacy_cs.get("away_team")

        if isinstance(h_val, bool):
            home_pred_cs = h_val
        elif isinstance(h_val, (int, float)):
            home_pred_cs = (
                h_val >= 50.0 or (0.0 < h_val <= 1.0 and h_val >= 0.5)
            )

        if isinstance(a_val, bool):
            away_pred_cs = a_val
        elif isinstance(a_val, (int, float)):
            away_pred_cs = (
                a_val >= 50.0 or (0.0 < a_val <= 1.0 and a_val >= 0.5)
            )

    # Fallback to predicted scoreline
    if home_pred_cs is None and p_away_goals is not None:
        home_pred_cs = (p_away_goals == 0)

    if away_pred_cs is None and p_home_goals is not None:
        away_pred_cs = (p_home_goals == 0)

    if home_pred_cs is None:
        home_pred_cs = False

    if away_pred_cs is None:
        away_pred_cs = False

    actual_scoreline = actual_result.get("final_score") or {}
    actual_home_goals = actual_scoreline.get("home_team_goals")
    actual_away_goals = actual_scoreline.get("away_team_goals")

    if actual_home_goals is None or actual_away_goals is None:
        return float(none_pts)

    actual_home_cs = (actual_away_goals == 0)
    actual_away_cs = (actual_home_goals == 0)

    correct_count = 0

    if home_pred_cs == actual_home_cs:
        correct_count += 1

    if away_pred_cs == actual_away_cs:
        correct_count += 1

    if correct_count == 2:
        return float(both_correct_pts)
    elif correct_count == 1:
        return float(one_correct_pts)

    return float(none_pts)