def calculate_winner_score(prediction: dict, actual_result: dict, config: dict | None = None) -> float:
    predicted_winner = prediction["match_prediction"]["predicted_winner"]
    actual_winner = actual_result["actual_winner"]
    if predicted_winner == actual_winner:
        return float(config.get("winner_points_correct", 2.5)) if config else 2.5
    return float(config.get("winner_points_incorrect", 0.0)) if config else 0.0
