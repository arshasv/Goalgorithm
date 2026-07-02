def calculate_clean_sheet_score(prediction: dict, actual_result: dict, config: dict | None = None) -> float:
    match_pred = prediction["match_prediction"]
    cs_preds = match_pred.get("clean_sheet_predictions")
    legacy_cs = match_pred.get("clean_sheet_probability")
    
    if not cs_preds and not legacy_cs:
        return 0.0

    actual_scoreline = actual_result["final_score"]
    home_cs = actual_scoreline["away_team_goals"] == 0
    away_cs = actual_scoreline["home_team_goals"] == 0

    pred_home_cs = None
    pred_away_cs = None

    if cs_preds and len(cs_preds) >= 2:
        # Assume first is home, second is away
        pred_home_cs = cs_preds[0].get("prediction", False)
        pred_away_cs = cs_preds[1].get("prediction", False)
    elif legacy_cs:
        pred_home_cs = legacy_cs.get("home_team", 0) > 50.0
        pred_away_cs = legacy_cs.get("away_team", 0) > 50.0
    else:
        return 0.0

    home_correct = pred_home_cs == home_cs
    away_correct = pred_away_cs == away_cs

    if home_correct and away_correct:
        return float(config.get("clean_sheet_points_correct", 2.5)) if config else 2.5
    elif home_correct or away_correct:
        return float(config.get("clean_sheet_points_one_team", 1.0)) if config else 1.0
    return float(config.get("clean_sheet_points_incorrect", 0.0)) if config else 0.0
