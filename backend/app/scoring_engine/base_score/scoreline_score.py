SCORELINE_POINTS_EXACT = 10.0
SCORELINE_POINTS_MARGIN = 5.0
SCORELINE_POINTS_PARTIAL = 2.5
SCORELINE_POINTS_INCORRECT = 0.0


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

    points_exact = config.get("scoreline_points_exact", SCORELINE_POINTS_EXACT) if config else SCORELINE_POINTS_EXACT
    points_margin = config.get("scoreline_points_margin", SCORELINE_POINTS_MARGIN) if config else SCORELINE_POINTS_MARGIN
    points_partial = config.get("scoreline_points_partial", SCORELINE_POINTS_PARTIAL) if config else SCORELINE_POINTS_PARTIAL
    points_incorrect = config.get("scoreline_points_incorrect", SCORELINE_POINTS_INCORRECT) if config else SCORELINE_POINTS_INCORRECT

    # Priority 1: EXACT SCORE
    if (pred_home, pred_away) == (actual_home, actual_away):
        return float(points_exact)

    pred_margin = pred_home - pred_away
    actual_margin = actual_home - actual_away

    # Priority 2: Correct goal difference
    if pred_margin == actual_margin:
        return float(points_margin)

    # Priority 3: Individual team goal accuracy
    score = 0.0
    if pred_home == actual_home:
        score += float(points_partial)
    if pred_away == actual_away:
        score += float(points_partial)

    return score if score > 0 else float(points_incorrect)

