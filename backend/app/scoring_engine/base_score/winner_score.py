WINNER_POINTS_CORRECT = 5
WINNER_POINTS_INCORRECT = 0


def calculate_winner_score(
    prediction: dict,
    actual_result: dict,
    config: dict | None = None,
) -> int:
    predicted_winner = prediction["match_prediction"]["predicted_winner"]
    actual_winner = actual_result["actual_winner"]

    points_correct = config.get("winner_points_correct", WINNER_POINTS_CORRECT) if config else WINNER_POINTS_CORRECT
    points_incorrect = config.get("winner_points_incorrect", WINNER_POINTS_INCORRECT) if config else WINNER_POINTS_INCORRECT

    if predicted_winner == actual_winner:
        return points_correct
    return points_incorrect
