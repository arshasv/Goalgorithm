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
    pred_winner = mp["predicted_winner"]

    # A. Winner confidence accuracy (2 points)
    if pred_winner == actual_winner:
        probs = mp.get("probabilities", {})
        highest_prob = max([
            probs.get("home_win_probability", 0),
            probs.get("draw_probability", 0),
            probs.get("away_win_probability", 0)
        ] + [0])
        
        if highest_prob >= 70:
            score += 2.0
        elif highest_prob >= 50:
            score += 1.5
        elif highest_prob >= 30:
            score += 1.0

    # B. Both Teams To Score (1 point)
    actual_btts = actual_home > 0 and actual_away > 0
    btts = mp.get("both_teams_to_score")
    pred_btts = None
    if btts and isinstance(btts, dict) and "prediction" in btts:
        pred_btts = btts["prediction"]
    else:
        # Fallback to legacy probability
        pred_btts = mp.get("both_teams_to_score_probability", 0) >= 50.0

    if pred_btts == actual_btts:
        score += 1.0

    # C. Clean Sheet Prediction (2 points)
    actual_home_cs = actual_away == 0
    actual_away_cs = actual_home == 0

    pred_home_cs = None
    pred_away_cs = None

    csp = mp.get("clean_sheet_predictions")
    if csp and isinstance(csp, list) and len(csp) >= 2:
        # Assume first is home, second is away
        pred_home_cs = csp[0].get("prediction", False)
        pred_away_cs = csp[1].get("prediction", False)
    else:
        # Fallback to legacy
        legacy_cs = mp.get("clean_sheet_probability", {})
        pred_home_cs = legacy_cs.get("home_team", 0) >= 50.0
        pred_away_cs = legacy_cs.get("away_team", 0) >= 50.0

    if pred_home_cs == actual_home_cs:
        score += 1.0
    if pred_away_cs == actual_away_cs:
        score += 1.0

    return score
