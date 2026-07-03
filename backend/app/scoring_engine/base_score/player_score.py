from app.scoring_engine.base_score.clean_sheet_score import calculate_clean_sheet_score


def _normalize_scorer(entry) -> str | None:
    try:
        if isinstance(entry, str):
            return entry
        if isinstance(entry, dict):
            name = entry.get("player_name") or entry.get("name")
            if isinstance(name, str):
                return name
            if name:
                return _normalize_scorer(name)
        return None
    except Exception:
        return None


def _normalize_scorers_list(scorers) -> list[str]:
    if not scorers:
        return []
    res = []
    try:
        for item in scorers:
            norm = _normalize_scorer(item)
            if norm:
                res.append(norm)
    except Exception:
        pass
    return res


def calculate_player_score_breakdown(
    prediction: dict,
    actual_result: dict,
    config: dict | None = None,
) -> dict:
    # 1. Goal Scorers Points
    match_pred = prediction.get("match_prediction") or {}
    pred_home_scorers = list(match_pred.get("goal_scorers", {}).get("home") or [])
    pred_away_scorers = list(match_pred.get("goal_scorers", {}).get("away") or [])

    # Fallback: if goal_scorers field is empty, check player_predictions
    if not pred_home_scorers and not pred_away_scorers:
        player_preds = prediction.get("player_predictions") or []
        for p_pred in player_preds:
            try:
                p_name_raw = p_pred.get("player_name") or p_pred.get("name")
                p_name = _normalize_scorer(p_name_raw)
                p_goals = p_pred.get("predicted_goals") or p_pred.get("goals") or 0
                p_team = str(p_pred.get("team", "")).lower()
                if p_name and float(p_goals) > 0:
                    if "away" in p_team or "brazil" in p_team:
                        pred_away_scorers.append(p_name)
                    else:
                        pred_home_scorers.append(p_name)
            except Exception:
                pass

    actual_home_scorers = list(actual_result.get("goal_scorers", {}).get("home") or [])
    actual_away_scorers = list(actual_result.get("goal_scorers", {}).get("away") or [])

    # Fallback: if actual_result goal_scorers field is empty, check player_results
    if not actual_home_scorers and not actual_away_scorers:
        player_res = actual_result.get("player_results") or []
        for p_res in player_res:
            try:
                p_name_raw = p_res.get("player_name") or p_res.get("name")
                p_name = _normalize_scorer(p_name_raw)
                p_goals = p_res.get("actual_goals") or p_res.get("goals") or 0
                if p_name and float(p_goals) > 0:
                    actual_home_scorers.append(p_name)
            except Exception:
                pass

    pred_home_normalized = _normalize_scorers_list(pred_home_scorers)
    pred_away_normalized = _normalize_scorers_list(pred_away_scorers)
    actual_home_normalized = _normalize_scorers_list(actual_home_scorers)
    actual_away_normalized = _normalize_scorers_list(actual_away_scorers)

    pred_set = {
        name.lower().strip()
        for name in (pred_home_normalized + pred_away_normalized)
        if name
    }
    actual_set = {
        name.lower().strip()
        for name in (actual_home_normalized + actual_away_normalized)
        if name
    }

    goal_scorers_pts = 0.0
    if len(actual_set) == 0 and len(pred_set) == 0:
        goal_scorers_pts = (
            config.get("player_goals_all_correct", 2.5) if config else 2.5
        )
    elif len(actual_set) == 0 or len(pred_set) == 0:
        goal_scorers_pts = (
            config.get("player_goals_none", 0.0) if config else 0.0
        )
    else:
        correct_set = pred_set.intersection(actual_set)
        correct_count = len(correct_set)

        if pred_set == actual_set:
            goal_scorers_pts = (
                config.get("player_goals_all_correct", 2.5) if config else 2.5
            )
        elif correct_count / len(actual_set) >= 0.5:
            goal_scorers_pts = (
                config.get("player_goals_half_correct", 1.5) if config else 1.5
            )
        elif correct_count >= 1:
            goal_scorers_pts = (
                config.get("player_goals_at_least_one", 1.0) if config else 1.0
            )
        else:
            goal_scorers_pts = (
                config.get("player_goals_none", 0.0) if config else 0.0
            )

    # 2. Clean Sheet Points
    clean_sheet_pts = calculate_clean_sheet_score(
        prediction,
        actual_result,
        config,
    )

    return {
        "goal_scorer_points": float(goal_scorers_pts),
        "clean_sheet_points": float(clean_sheet_pts),
    }


def calculate_player_score(
    prediction: dict,
    actual_result: dict,
    config: dict | None = None,
) -> float:
    breakdown = calculate_player_score_breakdown(
        prediction,
        actual_result,
        config,
    )
    return float(
        breakdown["goal_scorer_points"]
        + breakdown["clean_sheet_points"]
    )