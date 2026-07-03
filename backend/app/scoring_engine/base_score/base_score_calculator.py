from app.scoring_engine.base_score.winner_score import calculate_winner_score
from app.scoring_engine.base_score.scoreline_score import (
    calculate_scoreline_score,
    calculate_scoreline_score_breakdown,
)
from app.scoring_engine.base_score.probability_score import (
    calculate_probability_score,
    calculate_probability_score_breakdown,
)
from app.scoring_engine.base_score.player_score import (
    calculate_player_score,
    calculate_player_score_breakdown,
)
from app.scoring_engine.base_score.btts_score import calculate_btts_score
from app.scoring_engine.base_score.first_team_to_score_score import calculate_first_team_to_score_score
from app.scoring_engine.base_score.clean_sheet_score import calculate_clean_sheet_score

MAX_BASE_SCORE = 25.0


def calculate_base_score(
    prediction: dict,
    actual_result: dict,
    actual_probabilities: dict | None = None,
    config: dict | None = None,
) -> dict:
    max_base = MAX_BASE_SCORE

<<<<<<< HEAD
    winner_score = min(float(calculate_winner_score(prediction, actual_result, config)), 2.5)
    scoreline_score = min(float(calculate_scoreline_score(prediction, actual_result, config)), 7.5)
    probability_score = min(float(calculate_probability_score(prediction, actual_result, config)), 5.0)
    player_score = min(float(calculate_player_score(prediction, actual_result, config)), 2.5)
    total_goals_score = min(float(calculate_total_goals_score(prediction, actual_result, config)), 0.0)
    btts_score = min(float(calculate_btts_score(prediction, actual_result, config)), 2.5)
    first_team_to_score_score = min(float(calculate_first_team_to_score_score(prediction, actual_result, config)), 2.5)
    clean_sheet_score = min(float(calculate_clean_sheet_score(prediction, actual_result, config)), 2.5)
=======
    # 1. Winner Prediction Category
    winner_prediction_points = float(calculate_winner_score(prediction, actual_result, config))
    first_team_to_score_points = float(calculate_first_team_to_score_score(prediction, actual_result, config))
    winner_score = winner_prediction_points + first_team_to_score_points

    # 2. Scoreline Category
    scoreline_score = float(calculate_scoreline_score(prediction, actual_result, config))
    scoreline_breakdown = calculate_scoreline_score_breakdown(prediction, actual_result, config)
    exact_scoreline_points = float(scoreline_breakdown["exact_scoreline_points"])
    one_team_score_points = float(scoreline_breakdown["one_team_score_points"])
    goal_difference_points = float(scoreline_breakdown["goal_difference_points"])

    # 3. Probability Category
    probability_score = float(calculate_probability_score(prediction, actual_result, config))
    probability_breakdown = calculate_probability_score_breakdown(prediction, actual_result, config)
    winner_confidence_points = float(probability_breakdown["winner_confidence_points"])
    btts_probability_points = float(probability_breakdown["btts_probability_points"])
    first_team_to_score_probability_points = float(probability_breakdown["first_team_to_score_probability_points"])

    # 4. Player Performance Category
    player_score = float(calculate_player_score(prediction, actual_result, config))
    player_breakdown = calculate_player_score_breakdown(prediction, actual_result, config)
    goal_scorer_points = float(player_breakdown["goal_scorer_points"])
    clean_sheet_points = float(player_breakdown["clean_sheet_points"])

    # Other subscores
    btts_score = float(calculate_btts_score(prediction, actual_result, config))
    clean_sheet_score = float(calculate_clean_sheet_score(prediction, actual_result, config))
>>>>>>> develop

    # Base Score must be the sum of these 11 fields, capped at max_base
    new_base_score_sum = (
        winner_prediction_points +
        first_team_to_score_points +
        exact_scoreline_points +
        one_team_score_points +
        goal_difference_points +
        btts_score +  # This is btts_points
        winner_confidence_points +
        btts_probability_points +
        first_team_to_score_probability_points +
        goal_scorer_points +
        clean_sheet_points
    )
    base_score = min(new_base_score_sum, max_base)

    return {
        "team_id": prediction["team_id"],
        "match_id": prediction["match_id"],
        "breakdown": {
            "winner_score": winner_score,
            "scoreline_score": scoreline_score,
            "probability_score": probability_score,
            "player_score": player_score,
            "total_goals_score": 0.0,
            "btts_score": btts_score,
            "first_team_to_score_score": first_team_to_score_points,
            "clean_sheet_score": clean_sheet_score,
            "winner_prediction_points": winner_prediction_points,
            "exact_scoreline_points": exact_scoreline_points,
            "one_team_score_points": one_team_score_points,
            "goal_difference_points": goal_difference_points,
            "winner_confidence_points": winner_confidence_points,
            "btts_probability_points": btts_probability_points,
            "first_team_to_score_probability_points": first_team_to_score_probability_points,
            "goal_scorer_points": goal_scorer_points,
        },
        "base_score": base_score,
    }
