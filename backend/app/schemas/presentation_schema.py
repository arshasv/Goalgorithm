from pydantic import BaseModel, Field


class PresentationEvaluation(BaseModel):
    team_id: str = Field(..., min_length=1)
    ai_explanation_score: int = Field(..., ge=0, le=20)
    qa_score: int = Field(..., ge=0, le=15)
    delivery_score: int = Field(..., ge=0, le=15)
