from pydantic import BaseModel, Field


class PresentationEvaluation(BaseModel):
    team_id: str = Field(..., min_length=1)
    ai_explanation_score: int | None = Field(None)
    qa_score: int | None = Field(None)
    delivery_score: int | None = Field(None)
    judge_scores: list[dict[str, float]] = Field(default_factory=list)

