def calculate_probability_score(
    prediction: dict,
    actual_result: dict,
    config: dict | None = None,
) -> float:
    score = 0.0
    mp = prediction["match_prediction"]
    actual_scoreline = actual_result["final_score"]
    actual_home = actual_scoreline["home_team_goals"]
    actual_away = actual_scoreline["away_team_goals"]
    actual_winner = actual_result["actual_winner"]
    pred_winner = mp.get("predicted_winner")

    max_prob = float(config.get("probability_points_pass", 5.0)) if config else 5.0
    
    # A. Winner confidence accuracy (Max 40% of max_prob)
    if pred_winner == actual_winner:
        probs = mp.get("probabilities", {})
        highest_prob = max([
            probs.get("home_win_probability", 0),
            probs.get("draw_probability", 0),
            probs.get("away_win_probability", 0)
        ] + [0])
        
        if highest_prob >= 70:
            score += max_prob * 0.4
        elif highest_prob >= 50:
            score += max_prob * 0.3
        elif highest_prob >= 30:
            score += max_prob * 0.2

    # B. BTTS Probability (Max 20% of max_prob)
    actual_btts = actual_home > 0 and actual_away > 0
    btts_dict = mp.get("both_teams_to_score")
    pred_btts = None
    btts_prob = 0
    
    if btts_dict and isinstance(btts_dict, dict):
        pred_btts = btts_dict.get("prediction")
        btts_prob = btts_dict.get("probability", 0)
    else:
        pred_btts = mp.get("both_teams_to_score_probability", 0) >= 50.0
        btts_prob = mp.get("both_teams_to_score_probability", 0)

    if pred_btts == actual_btts:
        if btts_prob >= 70:
            score += max_prob * 0.2
        elif btts_prob >= 50:
            score += max_prob * 0.15
        elif btts_prob >= 30:
            score += max_prob * 0.1

    # C. First Team to Score Probability (Max 40% of max_prob)
    pred_first_team = None
    ftts_prob = 0
    
    if mp.get("first_team_to_score") is not None:
        pred_first_team = mp["first_team_to_score"].get("team", "").lower()
        ftts_prob = mp["first_team_to_score"].get("probability", 0)
    elif mp.get("first_goal_team") is not None:
        pred_first_team = mp.get("first_goal_team", "").lower()
        ftts_prob = mp.get("first_goal_probability", 0)
        
    actual_first = actual_result.get("first_team_to_score", "none").lower()
    
    if pred_first_team == actual_first and pred_first_team != "none":
        if ftts_prob >= 70:
            score += max_prob * 0.4
        elif ftts_prob >= 50:
            score += max_prob * 0.3
        elif ftts_prob >= 30:
            score += max_prob * 0.2

    return min(score, max_prob)
