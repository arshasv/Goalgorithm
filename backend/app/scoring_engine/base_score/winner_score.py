WINNER_POINTS_CORRECT = 5
WINNER_POINTS_INCORRECT = 0


def calculate_winner_score(
    prediction: dict,
    actual_result: dict,
) -> int:
    predicted_winner = prediction["match_prediction"]["predicted_winner"]
    actual_winner = actual_result["actual_winner"]

    if predicted_winner == actual_winner:
        return WINNER_POINTS_CORRECT
    return WINNER_POINTS_INCORRECT
