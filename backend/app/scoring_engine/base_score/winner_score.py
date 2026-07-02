def calculate_winner_score(
    prediction: dict,
    actual_result: dict,
    config: dict | None = None,
) -> float:
    match_pred = prediction.get("match_prediction") or {}
    predicted_winner = match_pred.get("predicted_winner", "draw")
    actual_winner = actual_result.get("actual_winner", "draw")

    pts_correct = config.get("winner_points_correct", 2.5) if config else 2.5
    pts_incorrect = config.get("winner_points_incorrect", 0.0) if config else 0.0

    pred = str(predicted_winner).lower().strip()
    act = str(actual_winner).lower().strip()

    if pred == act:
        return float(pts_correct)
    return float(pts_incorrect)
