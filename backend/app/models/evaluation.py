import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum as SAEnum, Float, Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.schema import Index

from app.database.base import Base
from app.models.enums import Grade


class TechnicalEvaluationModel(Base):
    __tablename__ = "technical_evaluations"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    team_id: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False
    )
    code_quality: Mapped[int | None] = mapped_column(Integer, nullable=True)
    backend_quality: Mapped[int | None] = mapped_column(Integer, nullable=True)
    teamwork: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ai_explanation: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        Index("ix_technical_evaluations_team_id", "team_id", unique=True),
    )


class PresentationEvaluationModel(Base):
    __tablename__ = "presentation_evaluations"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    team_id: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False
    )
    ai_explanation_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    qa_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    delivery_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    raw_total: Mapped[int | None] = mapped_column(Integer, nullable=True)
    presentation_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    rank: Mapped[int | None] = mapped_column(Integer, nullable=True)
    grade: Mapped[Grade | None] = mapped_column(
        SAEnum(Grade, name="grade_enum", create_constraint=True), nullable=True
    )
    multiplier: Mapped[int | None] = mapped_column(Integer, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        Index("ix_presentation_evaluations_team_id", "team_id", unique=True),
    )
