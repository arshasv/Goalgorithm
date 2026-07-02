def calculate_first_team_to_score_score(prediction: dict, actual_result: dict, config: dict | None = None) -> float:
    match_pred = prediction["match_prediction"]
    pred_first_team = None
    
    if match_pred.get("first_team_to_score") is not None:
        pred_first_team = match_pred["first_team_to_score"]["team"].lower()
    elif match_pred.get("first_goal_team") is not None:
        pred_first_team = match_pred["first_goal_team"].lower()
        
    if pred_first_team is None:
        return 0.0
        
    actual_first = actual_result.get("first_team_to_score", "none").lower()
    
    if pred_first_team == actual_first and pred_first_team != "none":
        return float(config.get("first_team_to_score_points_correct", 2.5)) if config else 2.5
    return float(config.get("first_team_to_score_points_incorrect", 0.0)) if config else 0.0
