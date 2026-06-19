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

    # Get active criteria from config to compute maximum possible marks (default is 50)
    criteria_list = []
    if config:
        criteria_list = config.get("presentation_criteria")
    if not criteria_list:
        criteria_list = [
            {"name": "Problem Understanding", "max_score": 10},
            {"name": "Feature Engineering", "max_score": 15},
            {"name": "Team Work", "max_score": 10},
            {"name": "Presentation Quality", "max_score": 10},
            {"name": "Q&A", "max_score": 5}
        ]

    max_marks = sum(item["max_score"] for item in criteria_list)

    results: list[dict] = []
    for ev in evaluations:
        judge_scores = ev.get("judge_scores", [])
        
        # Calculate sum of scores for each judge
        judge_totals = []
        for j_score in judge_scores:
            # j_score is a dict of criteria name -> score
            total = sum(float(val) for val in j_score.values())
            judge_totals.append(total)
        
        n_judges = len(judge_totals)
        if n_judges > 0:
            avg_score = sum(judge_totals) / n_judges
        else:
            avg_score = 0.0

        # presentation_score = average judge score out of configured total
        results.append({
            "team_id": ev["team_id"],
            "judge_count": n_judges,
            "judge_scores": judge_scores,
            "presentation_criteria_config": criteria_list,
            "max_marks": max_marks,
            "raw_total": round(avg_score, 2),
            "presentation_score": round(avg_score, 2),
        })

    # Sort results to assign rank
    results.sort(key=lambda x: x["presentation_score"], reverse=True)
    current_rank = 1
    for i, entry in enumerate(results):
        if i > 0 and entry["presentation_score"] < results[i - 1]["presentation_score"]:
            current_rank = i + 1
        entry["rank"] = current_rank

    return results

