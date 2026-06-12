PLAYER_POINTS_EXACT = 5
PLAYER_POINTS_CLOSE = 2
PLAYER_POINTS_WRONG = 0

AVG_THRESHOLD_EXACT = 4.0
AVG_THRESHOLD_CLOSE = 2.0


def _individual_player_score(
    predicted_goals: int, actual_goals: int
) -> int:
    diff = abs(predicted_goals - actual_goals)
    if diff == 0:
        return PLAYER_POINTS_EXACT
    if diff == 1:
        return PLAYER_POINTS_CLOSE
    return PLAYER_POINTS_WRONG


def calculate_player_score(
    prediction: dict,
    actual_result: dict,
) -> int:
    actual_by_id: dict[str, int] = {
        p["player_id"]: p["actual_goals"] for p in actual_result["player_results"]
    }

    scores: list[int] = []
    for player_pred in prediction["player_predictions"]:
        pid = player_pred["player_id"]
        if pid not in actual_by_id:
            continue
        score = _individual_player_score(
            player_pred["predicted_goals"], actual_by_id[pid]
        )
        scores.append(score)

    if not scores:
        return PLAYER_POINTS_WRONG

    average = sum(scores) / len(scores)

    if average >= AVG_THRESHOLD_EXACT:
        return PLAYER_POINTS_EXACT
    if average >= AVG_THRESHOLD_CLOSE:
        return PLAYER_POINTS_CLOSE
    return PLAYER_POINTS_WRONG
