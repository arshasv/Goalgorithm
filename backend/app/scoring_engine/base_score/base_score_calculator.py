from app.scoring_engine.base_score.winner_score import calculate_winner_score
from app.scoring_engine.base_score.scoreline_score import calculate_scoreline_score
from app.scoring_engine.base_score.probability_score import calculate_probability_score
from app.scoring_engine.base_score.player_score import calculate_player_score

MAX_BASE_SCORE = 25


def calculate_base_score(
    prediction: dict,
    actual_result: dict,
    actual_probabilities: dict | None = None,
) -> dict:
    if actual_probabilities is None:
        actual_probabilities = {
            "home_win_probability": 0.0,
            "draw_probability": 0.0,
            "away_win_probability": 0.0,
            "home_clean_sheet_probability": 0.0,
            "away_clean_sheet_probability": 0.0,
        }

    winner_score = calculate_winner_score(prediction, actual_result)
    scoreline_score = calculate_scoreline_score(prediction, actual_result)
    probability_score = calculate_probability_score(prediction, actual_probabilities)
    player_score = calculate_player_score(prediction, actual_result)

    raw_total = winner_score + scoreline_score + probability_score + player_score
    base_score = min(raw_total, MAX_BASE_SCORE)

    return {
        "team_id": prediction["team_id"],
        "match_id": prediction["match_id"],
        "breakdown": {
            "winner_score": winner_score,
            "scoreline_score": scoreline_score,
            "probability_score": probability_score,
            "player_score": player_score,
        },
        "base_score": base_score,
    }
