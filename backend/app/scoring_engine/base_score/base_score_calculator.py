from app.scoring_engine.base_score.winner_score import calculate_winner_score
from app.scoring_engine.base_score.scoreline_score import calculate_scoreline_score
from app.scoring_engine.base_score.probability_score import calculate_probability_score
from app.scoring_engine.base_score.player_score import calculate_player_score
from app.scoring_engine.base_score.total_goals_score import calculate_total_goals_score
from app.scoring_engine.base_score.btts_score import calculate_btts_score
from app.scoring_engine.base_score.first_team_to_score_score import calculate_first_team_to_score_score
from app.scoring_engine.base_score.clean_sheet_score import calculate_clean_sheet_score

MAX_BASE_SCORE = 25


def calculate_base_score(
    prediction: dict,
    actual_result: dict,
    actual_probabilities: dict | None = None,
    config: dict | None = None,
) -> dict:
    max_base = float(config.get("max_base_score", MAX_BASE_SCORE) if config else MAX_BASE_SCORE)

    winner_score = float(calculate_winner_score(prediction, actual_result, config))
    scoreline_score = float(calculate_scoreline_score(prediction, actual_result, config))
    probability_score = float(calculate_probability_score(prediction, actual_result, config))
    player_score = float(calculate_player_score(prediction, actual_result, config))
    total_goals_score = float(calculate_total_goals_score(prediction, actual_result, config))
    btts_score = float(calculate_btts_score(prediction, actual_result, config))
    first_team_to_score_score = float(calculate_first_team_to_score_score(prediction, actual_result, config))
    clean_sheet_score = float(calculate_clean_sheet_score(prediction, actual_result, config))

    raw_total = (
        winner_score + scoreline_score + probability_score + player_score +
        total_goals_score + btts_score + first_team_to_score_score + clean_sheet_score
    )
    base_score = min(raw_total, max_base)

    return {
        "team_id": prediction["team_id"],
        "match_id": prediction["match_id"],
        "breakdown": {
            "winner_score": winner_score,
            "scoreline_score": scoreline_score,
            "probability_score": probability_score,
            "player_score": player_score,
            "total_goals_score": total_goals_score,
            "btts_score": btts_score,
            "first_team_to_score_score": first_team_to_score_score,
            "clean_sheet_score": clean_sheet_score,
        },
        "base_score": base_score,
    }
