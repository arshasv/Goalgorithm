def calculate_player_score(
    prediction: dict,
    actual_result: dict,
    config: dict | None = None,
) -> float:
    # Match by lowercased name because AI predictions might not have player IDs
    actual_by_name: dict[str, int] = {
        p["player_name"].lower().strip(): p["actual_goals"]
        for p in actual_result.get("player_results", [])
    }

    player_preds = prediction.get("player_predictions", [])
    if not player_preds:
        return 0.0

    predicted_scorers = []
    for player_pred in player_preds:
        if player_pred.get("predicted_goals", 0) > 0:
            predicted_scorers.append(player_pred.get("player_name", "").lower().strip())

    if not predicted_scorers:
        return 0.0

    correct_count = 0
    for name in predicted_scorers:
        if actual_by_name.get(name, 0) > 0:
            correct_count += 1

    if correct_count == len(predicted_scorers):
        return float(config.get("player_points_exact", 2.5)) if config else 2.5
    if correct_count >= len(predicted_scorers) / 2.0:
        return float(config.get("player_points_close", 1.5)) if config else 1.5
    if correct_count >= 1:
        return float(config.get("player_points_far", 1.0)) if config else 1.0

    return float(config.get("player_points_wrong", 0.0)) if config else 0.0
