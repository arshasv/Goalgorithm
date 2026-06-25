PLAYER_POINTS_EXACT = 5.0
PLAYER_POINTS_CLOSE = 2.0
PLAYER_POINTS_WRONG = 0.0


def calculate_player_score(
    prediction: dict,
    actual_result: dict,
    config: dict | None = None,
) -> float:
    points_exact = config.get("player_points_exact", PLAYER_POINTS_EXACT) if config else PLAYER_POINTS_EXACT
    points_close = config.get("player_points_close", PLAYER_POINTS_CLOSE) if config else PLAYER_POINTS_CLOSE
    points_wrong = config.get("player_points_wrong", PLAYER_POINTS_WRONG) if config else PLAYER_POINTS_WRONG

    # Match by lowercased name because AI predictions might not have player IDs
    actual_by_name: dict[str, int] = {
        p["player_name"].lower().strip(): p["actual_goals"]
        for p in actual_result["player_results"]
    }

    best_score = float(points_wrong)

    player_preds = prediction.get("player_predictions", [])
    if not player_preds:
        return best_score

    for player_pred in player_preds:
        name = player_pred.get("player_name", "").lower().strip()
        actual_goals = actual_by_name.get(name, 0)

        diff = abs(player_pred.get("predicted_goals", 0) - actual_goals)
        if diff == 0:
            score = float(points_exact)
        elif diff == 1:
            score = float(points_close)
        else:
            score = float(points_wrong)

        if score > best_score:
            best_score = score

    return best_score
