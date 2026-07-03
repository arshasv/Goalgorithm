def get_tier_points(prob: float, high_t, high_p, med_t, med_p, low_t, low_p, fail_p) -> float:
    val = float(prob)
    # Scale from [0, 1] to [0, 100] if necessary
    if 0.0 < val <= 1.0:
        val = val * 100.0
    if val >= high_t:
        return float(high_p)
    elif val >= med_t:
        return float(med_p)
    elif val >= low_t:
        return float(low_p)
    return float(fail_p)


def calculate_probability_score_breakdown(
    prediction: dict,
    actual_result: dict,
    config: dict | None = None,
) -> dict:
    mp = prediction.get("match_prediction") or {}
    pred_winner = str(mp.get("predicted_winner", "draw")).lower().strip()
    actual_winner = str(actual_result.get("actual_winner", "draw")).lower().strip()

    # 1. Winner Confidence
    winner_conf_pts = 0.0
    if pred_winner == actual_winner:
        probs = mp.get("probabilities", {})
        winner_prob = 0.0
        if pred_winner == "home":
            winner_prob = probs.get("home_win_probability") or 0.0
        elif pred_winner == "away":
            winner_prob = probs.get("away_win_probability") or 0.0
        elif pred_winner == "draw":
            winner_prob = probs.get("draw_probability") or 0.0

        winner_conf_pts = get_tier_points(
            winner_prob,
            config.get("prob_winner_high_threshold", 70.0) if config else 70.0,
            config.get("prob_winner_high_points", 2.0) if config else 2.0,
            config.get("prob_winner_medium_threshold", 50.0) if config else 50.0,
            config.get("prob_winner_medium_points", 1.5) if config else 1.5,
            config.get("prob_winner_low_threshold", 30.0) if config else 30.0,
            config.get("prob_winner_low_points", 1.0) if config else 1.0,
            config.get("prob_winner_fail_points", 0.0) if config else 0.0,
        )

    # 2. BTTS Probability
    actual_scoreline = actual_result.get("final_score") or {}
    actual_home = actual_scoreline.get("home_team_goals")
    actual_away = actual_scoreline.get("away_team_goals")
    if actual_home is not None and actual_away is not None:
        actual_btts = actual_home > 0 and actual_away > 0
    else:
        actual_btts = False

    btts_data = mp.get("both_teams_to_score")
    pred_btts = None
    btts_prob = 0.0
    if isinstance(btts_data, dict):
        pred_btts = btts_data.get("prediction")
        btts_prob = btts_data.get("probability") or 0.0
    else:
        pred_btts = btts_data
        btts_prob = mp.get("both_teams_to_score_probability") or 0.0

    if pred_btts is None:
        if btts_prob > 0.0:
            pred_btts = (btts_prob >= 50.0 or (btts_prob <= 1.0 and btts_prob >= 0.5))
        else:
            pred_btts = False

    btts_prob_pts = 0.0
    if pred_btts == actual_btts:
        btts_prob_pts = get_tier_points(
            btts_prob,
            config.get("prob_btts_high_threshold", 70.0) if config else 70.0,
            config.get("prob_btts_high_points", 1.0) if config else 1.0,
            config.get("prob_btts_medium_threshold", 50.0) if config else 50.0,
            config.get("prob_btts_medium_points", 0.75) if config else 0.75,
            config.get("prob_btts_low_threshold", 30.0) if config else 30.0,
            config.get("prob_btts_low_points", 0.5) if config else 0.5,
            config.get("prob_btts_fail_points", 0.0) if config else 0.0,
        )

    # 3. First Team To Score Probability
    pred_first_team = None
    first_team_prob = 0.0
    fts_data = mp.get("first_team_to_score")
    if isinstance(fts_data, dict):
        pred_first_team = fts_data.get("team")
        first_team_prob = fts_data.get("probability") or 0.0
    else:
        pred_first_team = mp.get("first_goal_team")
        first_team_prob = mp.get("first_goal_team_probability") or 0.0

    if pred_first_team is not None:
        pred_first_team = str(pred_first_team).lower().strip()
    actual_first = str(actual_result.get("first_team_to_score", "none")).lower().strip()

    fts_prob_pts = 0.0
    if pred_first_team == actual_first:
        fts_prob_pts = get_tier_points(
            first_team_prob,
            config.get("prob_first_goal_high_threshold", 70.0) if config else 70.0,
            config.get("prob_first_goal_high_points", 2.0) if config else 2.0,
            config.get("prob_first_goal_medium_threshold", 50.0) if config else 50.0,
            config.get("prob_first_goal_medium_points", 1.5) if config else 1.5,
            config.get("prob_first_goal_low_threshold", 30.0) if config else 30.0,
            config.get("prob_first_goal_low_points", 1.0) if config else 1.0,
            config.get("prob_first_goal_fail_points", 0.0) if config else 0.0,
        )

    return {
        "winner_confidence_points": winner_conf_pts,
        "btts_probability_points": btts_prob_pts,
        "first_team_to_score_probability_points": fts_prob_pts,
    }


def calculate_probability_score(
    prediction: dict,
    actual_result: dict,
    config: dict | None = None,
) -> float:
<<<<<<< HEAD
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
=======
    breakdown = calculate_probability_score_breakdown(prediction, actual_result, config)
    return breakdown["winner_confidence_points"] + breakdown["btts_probability_points"] + breakdown["first_team_to_score_probability_points"]
>>>>>>> develop
