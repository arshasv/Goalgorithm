import json
from pathlib import Path

import pytest

from app.scoring_engine.presentation_evaluation.presentation_score import (
    calculate_presentation_scores,
    PresentationScoreError,
)

FIXTURES = Path(__file__).parent / "fixtures"


def _evals(pairs: list[tuple[str, int, int, int]]) -> list[dict]:
    return [
        {
            "team_id": tid,
            "ai_explanation_score": ai,
            "qa_score": qa,
            "delivery_score": dl,
        }
        for tid, ai, qa, dl in pairs
    ]


class TestPresentationScore:
    def test_raw_score_calculation(self):
        evals = _evals([("TEAM_A", 20, 15, 15)])
        results = calculate_presentation_scores(evals)
        assert results[0]["raw_score"] == 50

    def test_rank1_gets_A_and_highest_score(self):
        evals = _evals([
            ("TEAM_A", 20, 15, 15),
            ("TEAM_B", 10, 8, 7),
        ])
        results = calculate_presentation_scores(evals)
        assert results[0]["team_id"] == "TEAM_A"
        assert results[0]["rank"] == 1
        assert results[0]["grade"] == "A"
        assert results[0]["multiplier"] == 3

    def test_rank_last_gets_C(self):
        evals = _evals([
            ("TEAM_A", 20, 15, 15),
            ("TEAM_B", 10, 8, 7),
            ("TEAM_C", 5, 4, 3),
        ])
        results = calculate_presentation_scores(evals)
        assert results[-1]["team_id"] == "TEAM_C"
        assert results[-1]["grade"] == "C"
        assert results[-1]["multiplier"] == 1

    def test_normalization_20_max(self):
        evals = _evals([("TEAM_A", 20, 15, 15)])
        results = calculate_presentation_scores(evals)
        assert results[0]["presentation_score"] == 20.0

    def test_example_from_scoring_rules(self):
        evals = _evals([
            ("TEAM_A", 20, 15, 10),
            ("TEAM_B", 18, 12, 10),
            ("TEAM_C", 17, 11, 10),
            ("TEAM_D", 15, 10, 10),
            ("TEAM_E", 10, 8, 7),
        ])
        results = calculate_presentation_scores(evals)
        assert results[0]["raw_score"] == 45
        assert results[0]["rank"] == 1
        assert results[0]["multiplier"] == 3
        assert results[0]["presentation_score"] == 18.0
        assert results[1]["raw_score"] == 40
        assert results[1]["multiplier"] == 2
        assert results[2]["raw_score"] == 38
        assert results[2]["multiplier"] == 2
        assert results[3]["raw_score"] == 35
        assert results[3]["multiplier"] == 2
        assert results[4]["raw_score"] == 25
        assert results[4]["multiplier"] == 1
        assert results[4]["presentation_score"] == 3.33

    def test_tied_scores_both_get_B(self):
        evals = _evals([
            ("TEAM_A", 20, 15, 15),
            ("TEAM_B", 20, 15, 15),
            ("TEAM_C", 10, 8, 7),
        ])
        results = calculate_presentation_scores(evals)
        assert results[0]["rank"] == 1
        assert results[1]["rank"] == 1
        assert results[0]["grade"] == "B"
        assert results[1]["grade"] == "B"
        assert results[0]["multiplier"] == 2
        assert results[1]["multiplier"] == 2

    def test_tied_at_bottom_both_get_C(self):
        evals = _evals([
            ("TEAM_A", 20, 15, 15),
            ("TEAM_B", 10, 8, 7),
            ("TEAM_C", 10, 8, 7),
        ])
        results = calculate_presentation_scores(evals)
        assert results[1]["grade"] == "C"
        assert results[2]["grade"] == "C"

    def test_all_equal_all_get_B(self):
        evals = _evals([
            ("TEAM_A", 10, 8, 7),
            ("TEAM_B", 10, 8, 7),
            ("TEAM_C", 10, 8, 7),
        ])
        results = calculate_presentation_scores(evals)
        for r in results:
            assert r["grade"] == "B"
            assert r["multiplier"] == 2

    def test_output_structure(self):
        evals = _evals([("TEAM_A", 18, 12, 10)])
        results = calculate_presentation_scores(evals)
        assert set(results[0].keys()) == {
            "team_id",
            "raw_score",
            "rank",
            "grade",
            "multiplier",
            "presentation_score",
        }

    def test_empty_input(self):
        assert calculate_presentation_scores([]) == []

    def test_loads_from_fixture(self):
        data = json.loads((FIXTURES / "presentation_scores.json").read_text())
        results = calculate_presentation_scores(data)
        assert len(results) == 5
        for r in results:
            assert 0 <= r["presentation_score"] <= 20
