TECHNICAL_MAX_PER_CATEGORY = 5
TECHNICAL_MAX_TOTAL = 20


class TechnicalScoreError(ValueError):
    pass


def _validate_score(value: int, label: str) -> None:
    if value < 0:
        raise TechnicalScoreError(f"{label} cannot be negative: {value}")
    if value > TECHNICAL_MAX_PER_CATEGORY:
        raise TechnicalScoreError(
            f"{label} exceeds max {TECHNICAL_MAX_PER_CATEGORY}: {value}"
        )


def calculate_technical_score(evaluation: dict) -> dict:
    code_quality = evaluation["code_quality"]
    backend_quality = evaluation["backend_quality"]
    teamwork = evaluation["teamwork"]
    ai_explanation = evaluation["ai_explanation"]

    _validate_score(code_quality, "code_quality")
    _validate_score(backend_quality, "backend_quality")
    _validate_score(teamwork, "teamwork")
    _validate_score(ai_explanation, "ai_explanation")

    total = code_quality + backend_quality + teamwork + ai_explanation

    return {
        "team_id": evaluation["team_id"],
        "breakdown": {
            "code_quality": code_quality,
            "backend_quality": backend_quality,
            "teamwork": teamwork,
            "ai_explanation": ai_explanation,
        },
        "technical_score": total,
    }
