MULTIPLIER_A = 3
MULTIPLIER_B = 2
MULTIPLIER_C = 1

GRADE_A = "A"
GRADE_B = "B"
GRADE_C = "C"


def assign_grades(ranked_teams: list[dict]) -> list[dict]:
    if not ranked_teams:
        return []

    top_score = ranked_teams[0]["base_score"]
    bottom_score = ranked_teams[-1]["base_score"]

    top_count = sum(
        1 for t in ranked_teams if t["base_score"] == top_score
    )
    all_tied = top_score == bottom_score

    results: list[dict] = []
    for team in ranked_teams:
        score = team["base_score"]

        if score == top_score and top_count == 1:
            grade, multiplier = GRADE_A, MULTIPLIER_A
        elif score == bottom_score and not all_tied:
            grade, multiplier = GRADE_C, MULTIPLIER_C
        else:
            grade, multiplier = GRADE_B, MULTIPLIER_B

        earned_points = score * multiplier

        results.append({
            "team_id": team["team_id"],
            "rank": team["rank"],
            "grade": grade,
            "multiplier": multiplier,
            "base_score": score,
            "earned_points": earned_points,
        })

    return results
