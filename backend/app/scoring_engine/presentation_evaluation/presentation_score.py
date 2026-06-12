PHASE3_FIXED_DENOMINATOR = 150
PHASE3_MAX_MARKS = 20

MULTIPLIER_A = 3
MULTIPLIER_B = 2
MULTIPLIER_C = 1

GRADE_A = "A"
GRADE_B = "B"
GRADE_C = "C"


class PresentationScoreError(ValueError):
    pass


def calculate_presentation_scores(
    evaluations: list[dict],
    config: dict | None = None,
) -> list[dict]:
    if not evaluations:
        return []

    denominator = config.get("presentation_denominator", PHASE3_FIXED_DENOMINATOR) if config else PHASE3_FIXED_DENOMINATOR
    max_marks = config.get("presentation_max_marks", PHASE3_MAX_MARKS) if config else PHASE3_MAX_MARKS
    mult_a = config.get("multiplier_a", MULTIPLIER_A) if config else MULTIPLIER_A
    mult_b = config.get("multiplier_b", MULTIPLIER_B) if config else MULTIPLIER_B
    mult_c = config.get("multiplier_c", MULTIPLIER_C) if config else MULTIPLIER_C

    scored: list[dict] = []
    for ev in evaluations:
        raw = ev["ai_explanation_score"] + ev["qa_score"] + ev["delivery_score"]
        scored.append({
            "team_id": ev["team_id"],
            "raw_score": raw,
        })

    scored.sort(key=lambda x: x["raw_score"], reverse=True)

    ranked: list[dict] = []
    current_rank = 1
    for i, entry in enumerate(scored):
        if i > 0 and entry["raw_score"] < scored[i - 1]["raw_score"]:
            current_rank = i + 1
        ranked.append({
            "team_id": entry["team_id"],
            "raw_score": entry["raw_score"],
            "rank": current_rank,
        })

    top_score = ranked[0]["raw_score"]
    bottom_score = ranked[-1]["raw_score"]
    top_count = sum(1 for r in ranked if r["raw_score"] == top_score)
    all_tied = top_score == bottom_score

    results: list[dict] = []
    for entry in ranked:
        score = entry["raw_score"]

        if score == top_score and top_count == 1:
            grade, multiplier = GRADE_A, mult_a
        elif score == bottom_score and not all_tied:
            grade, multiplier = GRADE_C, mult_c
        else:
            grade, multiplier = GRADE_B, mult_b

        multiplied = score * multiplier
        presentation_score = round(
            (multiplied / denominator) * max_marks, 2
        )

        results.append({
            "team_id": entry["team_id"],
            "raw_score": score,
            "rank": entry["rank"],
            "grade": grade,
            "multiplier": multiplier,
            "presentation_score": presentation_score,
        })

    return results
