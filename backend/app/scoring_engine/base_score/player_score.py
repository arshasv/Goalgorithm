PLAYER_POINTS_EXACT = 5
PLAYER_POINTS_CLOSE = 2
PLAYER_POINTS_WRONG = 0

AVG_THRESHOLD_EXACT = 4.0
AVG_THRESHOLD_CLOSE = 2.0


def calculate_player_score(
    prediction: dict,
    actual_result: dict,
    config: dict | None = None,
) -> int:
    points_exact = config.get("player_points_exact", PLAYER_POINTS_EXACT) if config else PLAYER_POINTS_EXACT
    points_close = config.get("player_points_close", PLAYER_POINTS_CLOSE) if config else PLAYER_POINTS_CLOSE
    points_wrong = config.get("player_points_wrong", PLAYER_POINTS_WRONG) if config else PLAYER_POINTS_WRONG
    avg_threshold_exact = config.get("player_avg_threshold_exact", AVG_THRESHOLD_EXACT) if config else AVG_THRESHOLD_EXACT
    avg_threshold_close = config.get("player_avg_threshold_close", AVG_THRESHOLD_CLOSE) if config else AVG_THRESHOLD_CLOSE

    actual_by_id: dict[str, int] = {
        p["player_id"]: p["actual_goals"] for p in actual_result["player_results"]
    }

    scores: list[int] = []
    for player_pred in prediction["player_predictions"]:
        pid = player_pred["player_id"]
        if pid not in actual_by_id:
            continue
        diff = abs(player_pred["predicted_goals"] - actual_by_id[pid])
        if diff == 0:
            scores.append(points_exact)
        elif diff == 1:
            scores.append(points_close)
        else:
            scores.append(points_wrong)

    if not scores:
        return points_wrong

    average = sum(scores) / len(scores)

    if average >= avg_threshold_exact:
        return points_exact
    if average >= avg_threshold_close:
        return points_close
    return points_wrong
