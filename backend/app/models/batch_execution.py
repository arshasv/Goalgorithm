import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum as SAEnum, Integer, Text, Uuid, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.enums import BatchExecutionStatus, BatchJobStatus


class BatchExecutionModel(Base):
    __tablename__ = "batch_executions"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    overall_status: Mapped[BatchExecutionStatus] = mapped_column(
        SAEnum(BatchExecutionStatus, name="batch_execution_status", create_constraint=True),
        nullable=False,
        default=BatchExecutionStatus.PENDING,
    )
    total_jobs: Mapped[int] = mapped_column(Integer, default=0)
    completed_jobs: Mapped[int] = mapped_column(Integer, default=0)
    failed_jobs: Mapped[int] = mapped_column(Integer, default=0)
    pending_jobs: Mapped[int] = mapped_column(Integer, default=0)

    jobs = relationship("BatchExecutionJobModel", back_populates="batch", cascade="all, delete-orphan")


class BatchExecutionJobModel(Base):
    __tablename__ = "batch_execution_jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    batch_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("batch_executions.id"), nullable=False
    )
    team_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("teams.id"), nullable=False
    )
    model_upload_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("model_uploads.id"), nullable=True
    )
    match_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("matches.id"), nullable=False
    )
    status: Mapped[BatchJobStatus] = mapped_column(
        SAEnum(BatchJobStatus, name="batch_job_status", create_constraint=True),
        nullable=False,
        default=BatchJobStatus.PENDING,
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    batch = relationship("BatchExecutionModel", back_populates="jobs")
    team = relationship("TeamModel")
    match = relationship("MatchModel")
    model_upload = relationship("ModelUploadModel")
