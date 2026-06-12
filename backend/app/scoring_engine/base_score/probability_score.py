PROBABILITY_THRESHOLD = 15.0
PROBABILITY_POINTS_PASS = 5
PROBABILITY_POINTS_FAIL = 0


def _probabilities_to_check(prediction: dict) -> list[tuple[str, float]]:
    mp = prediction["match_prediction"]
    return [
        ("home_win_probability", mp["probabilities"]["home_win_probability"]),
        ("draw_probability", mp["probabilities"]["draw_probability"]),
        ("away_win_probability", mp["probabilities"]["away_win_probability"]),
        ("home_clean_sheet_probability", mp["clean_sheet_probability"]["home_team"]),
        ("away_clean_sheet_probability", mp["clean_sheet_probability"]["away_team"]),
    ]


def calculate_probability_score(
    prediction: dict,
    actual_probabilities: dict,
) -> int:
    for key, predicted_value in _probabilities_to_check(prediction):
        actual_value = actual_probabilities[key]
        if abs(predicted_value - actual_value) > PROBABILITY_THRESHOLD:
            return PROBABILITY_POINTS_FAIL

    return PROBABILITY_POINTS_PASS
