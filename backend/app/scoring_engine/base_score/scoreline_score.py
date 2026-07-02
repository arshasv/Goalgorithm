def calculate_scoreline_score(
    prediction: dict,
    actual_result: dict,
    config: dict | None = None,
) -> float:
    pred_scoreline = prediction["match_prediction"]["predicted_scoreline"]
    actual_scoreline = actual_result["final_score"]

    pred_home = pred_scoreline["home_team_goals"]
    pred_away = pred_scoreline["away_team_goals"]
    actual_home = actual_scoreline["home_team_goals"]
    actual_away = actual_scoreline["away_team_goals"]

    if (pred_home, pred_away) == (actual_home, actual_away):
        return float(config.get("scoreline_points_exact", 7.5)) if config else 7.5

    one_team_correct = (pred_home == actual_home) or (pred_away == actual_away)
    if one_team_correct:
        # Note: The system doesn't have a distinct "one_team_correct" field in the matrix
        # Let's use a generic middle fallback or explicit logic if defined. We'll fallback to 4.0 if no config.
        # But wait, matrix has "Margin Only". 
        pass

    pred_margin = pred_home - pred_away
    actual_margin = actual_home - actual_away
    
    if pred_margin == actual_margin:
        return float(config.get("scoreline_points_margin", 3.0)) if config else 3.0
        
    if one_team_correct:
        # Fallback for one team correct if they missed the margin
        return float(config.get("scoreline_points_one_team", 4.0)) if config else 4.0

    return float(config.get("scoreline_points_incorrect", 0.0)) if config else 0.0

