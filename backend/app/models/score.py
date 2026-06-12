import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum as SAEnum, Float, Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.schema import Index

from app.database.base import Base
from app.models.enums import Grade


class ScoreModel(Base):
    __tablename__ = "scores"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    team_id: Mapped[str] = mapped_column(String(255), nullable=False)
    match_id: Mapped[str] = mapped_column(String(255), nullable=False)
    winner_points: Mapped[int | None] = mapped_column(Integer, default=0, nullable=True)
    scoreline_points: Mapped[int | None] = mapped_column(Integer, default=0, nullable=True)
    probability_points: Mapped[int | None] = mapped_column(
        Integer, default=0, nullable=True
    )
    player_points: Mapped[int | None] = mapped_column(Integer, default=0, nullable=True)
    base_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    match_rank: Mapped[int | None] = mapped_column(Integer, nullable=True)
    grade: Mapped[Grade | None] = mapped_column(
        SAEnum(Grade, name="grade_enum", create_constraint=True), nullable=True
    )
    multiplier: Mapped[int | None] = mapped_column(Integer, nullable=True)
    earned_points: Mapped[float | None] = mapped_column(Float, nullable=True)
    config_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    computed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        Index("ix_scores_team_match", "team_id", "match_id", unique=True),
        Index("ix_scores_match_id", "match_id"),
    )


class CumulativePhaseScoreModel(Base):
    __tablename__ = "cumulative_phase_scores"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    team_id: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False
    )
    total_earned_points: Mapped[float | None] = mapped_column(Float, nullable=True)
    matches_played: Mapped[int | None] = mapped_column(Integer, nullable=True)
    phase1_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    technical_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    presentation_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    __table_args__ = (
        Index("ix_cumulative_phase_scores_team_id", "team_id", unique=True),
    )
