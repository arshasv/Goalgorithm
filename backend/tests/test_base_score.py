import json
from pathlib import Path

from app.scoring_engine.base_score.winner_score import calculate_winner_score
from app.scoring_engine.base_score.scoreline_score import calculate_scoreline_score
from app.scoring_engine.base_score.probability_score import calculate_probability_score
from app.scoring_engine.base_score.player_score import calculate_player_score
from app.scoring_engine.base_score.base_score_calculator import calculate_base_score

FIXTURES = Path(__file__).parent / "fixtures"
ACTUAL = json.loads((FIXTURES / "actual_result.json").read_text())

# Actual Argentina 2-0 Brazil
ACTUAL_PROBS = {
    "home_win_probability": 60.0,
    "draw_probability": 25.0,
    "away_win_probability": 15.0,
    "home_clean_sheet_probability": 55.0,
    "away_clean_sheet_probability": 10.0,
}


def _team_prediction(team_id: str) -> dict:
    data = json.loads((FIXTURES / "five_team_predictions.json").read_text())
    for entry in data:
        if entry["team_id"] == team_id:
            return entry
    raise ValueError(f"Team {team_id} not found")


class TestWinnerScore:
    def test_correct_winner_home(self):
        pred = _team_prediction("Team A")
        assert calculate_winner_score(pred, ACTUAL) == 5

    def test_incorrect_winner(self):
        pred = _team_prediction("Team E")
        assert calculate_winner_score(pred, ACTUAL) == 0

    def test_incorrect_winner_draw(self):
        pred = _team_prediction("Team D")
        assert calculate_winner_score(pred, ACTUAL) == 0


class TestScorelineScore:
    def test_exact_scoreline(self):
        pred = _team_prediction("Team A")
        assert calculate_scoreline_score(pred, ACTUAL) == 10

    def test_correct_goal_margin(self):
        pred = {
            "match_prediction": {
                "predicted_scoreline": {"home_team_goals": 3, "away_team_goals": 1},
            },
        }
        assert calculate_scoreline_score(pred, ACTUAL) == 5

    def test_zero_goal_margin_draw_prediction(self):
        actual_draw = {
            "actual_winner": "draw",
            "final_score": {"home_team_goals": 1, "away_team_goals": 1},
        }
        pred = {
            "match_prediction": {
                "predicted_scoreline": {"home_team_goals": 2, "away_team_goals": 2},
            },
        }
        assert calculate_scoreline_score(pred, actual_draw) == 5

    def test_incorrect_scoreline(self):
        pred = _team_prediction("Team C")
        assert calculate_scoreline_score(pred, ACTUAL) == 0

    def test_wrong_direction(self):
        pred = _team_prediction("Team E")
        assert calculate_scoreline_score(pred, ACTUAL) == 0


class TestProbabilityScore:
    def test_all_within_threshold(self):
        pred = _team_prediction("Team A")
        probs = {
            "home_win_probability": 65.0,
            "draw_probability": 22.0,
            "away_win_probability": 13.0,
            "home_clean_sheet_probability": 55.0,
            "away_clean_sheet_probability": 10.0,
        }
        assert calculate_probability_score(pred, probs) == 5

    def test_one_outside_threshold(self):
        pred = _team_prediction("Team A")
        probs = {
            "home_win_probability": 65.0,
            "draw_probability": 22.0,
            "away_win_probability": 13.0,
            "home_clean_sheet_probability": 20.0,
            "away_clean_sheet_probability": 10.0,
        }
        assert calculate_probability_score(pred, probs) == 0

    def test_boundary_within(self):
        pred = _team_prediction("Team A")
        probs = {
            "home_win_probability": 80.0,
            "draw_probability": 22.0,
            "away_win_probability": 13.0,
            "home_clean_sheet_probability": 55.0,
            "away_clean_sheet_probability": 10.0,
        }
        assert calculate_probability_score(pred, probs) == 5

    def test_boundary_outside(self):
        pred = _team_prediction("Team A")
        probs = {
            "home_win_probability": 80.01,
            "draw_probability": 22.0,
            "away_win_probability": 13.0,
            "home_clean_sheet_probability": 55.0,
            "away_clean_sheet_probability": 10.0,
        }
        assert calculate_probability_score(pred, probs) == 0


class TestPlayerScore:
    def test_all_exact_matches(self):
        pred = _team_prediction("Team A")
        assert calculate_player_score(pred, ACTUAL) == 5

    def test_mixed_close_and_exact(self):
        pred = _team_prediction("Team B")
        score = calculate_player_score(pred, ACTUAL)
        expected_scores = [
            (1, 1),
            (1, 1),
            (0, 0),
            (1, 0),
            (0, 0),
        ]
        individual = []
        for pred_goals, actual_goals in expected_scores:
            diff = abs(pred_goals - actual_goals)
            individual.append(5 if diff == 0 else (2 if diff == 1 else 0))
        avg = sum(individual) / len(individual)
        expected = 5 if avg >= 4 else (2 if avg >= 2 else 0)
        assert score == expected

    def test_player_not_in_actual_ignored(self):
        pred = _team_prediction("Team A")
        actual_with_extra = {
            **ACTUAL,
            "player_results": ACTUAL["player_results"][:2],
        }
        score = calculate_player_score(pred, actual_with_extra)
        assert score == 5


class TestBaseScoreCalculator:
    def test_perfect_prediction_25(self):
        pred = _team_prediction("Team A")
        probs = {
            "home_win_probability": 65.0,
            "draw_probability": 22.0,
            "away_win_probability": 13.0,
            "home_clean_sheet_probability": 55.0,
            "away_clean_sheet_probability": 10.0,
        }
        result = calculate_base_score(pred, ACTUAL, probs)
        assert result["base_score"] == 25
        assert result["breakdown"]["winner_score"] == 5
        assert result["breakdown"]["scoreline_score"] == 10
        assert result["breakdown"]["probability_score"] == 5
        assert result["breakdown"]["player_score"] == 5

    def test_wrong_prediction_0(self):
        pred = {
            "team_id": "Team Wrong",
            "match_id": "match-001",
            "match_prediction": {
                "predicted_winner": "away",
                "predicted_scoreline": {"home_team_goals": 0, "away_team_goals": 1},
                "probabilities": {
                    "home_win_probability": 10.0,
                    "draw_probability": 10.0,
                    "away_win_probability": 80.0,
                },
                "clean_sheet_probability": {"home_team": 5.0, "away_team": 60.0},
            },
            "player_predictions": [
                {"player_id": "p-arg-1", "player_name": "Messi", "predicted_goals": 3},
            ],
        }
        probs = {
            "home_win_probability": 60.0,
            "draw_probability": 25.0,
            "away_win_probability": 15.0,
            "home_clean_sheet_probability": 55.0,
            "away_clean_sheet_probability": 10.0,
        }
        result = calculate_base_score(pred, ACTUAL, probs)
        assert result["base_score"] == 0

    def test_winner_only_correct(self):
        pred = _team_prediction("Team C")
        probs = {
            "home_win_probability": 48.0,
            "draw_probability": 32.0,
            "away_win_probability": 20.0,
            "home_clean_sheet_probability": 50.0,
            "away_clean_sheet_probability": 12.0,
        }
        result = calculate_base_score(pred, ACTUAL, probs)
        assert result["breakdown"]["winner_score"] == 5
        assert result["breakdown"]["scoreline_score"] == 0
        assert result["breakdown"]["player_score"] == 5

    def test_result_structure(self):
        pred = _team_prediction("Team A")
        probs = {
            "home_win_probability": 65.0,
            "draw_probability": 22.0,
            "away_win_probability": 13.0,
            "home_clean_sheet_probability": 55.0,
            "away_clean_sheet_probability": 10.0,
        }
        result = calculate_base_score(pred, ACTUAL, probs)
        assert result["team_id"] == "Team A"
        assert result["match_id"] == "match-001"
        assert set(result["breakdown"].keys()) == {
            "winner_score",
            "scoreline_score",
            "probability_score",
            "player_score",
        }
