import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import BigInteger, String, DateTime, ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base
from app.models.enums import StorageProvider

class ModelUploadModel(Base):
    __tablename__ = "model_uploads"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    team_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("teams.id"))
    match_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("matches.id"))
    original_filename: Mapped[str] = mapped_column(String(255))
    stored_file_path: Mapped[str] = mapped_column(String(1024))
    status: Mapped[str] = mapped_column(String(50), default="IDLE")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    drive_file_id: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    drive_web_link: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    storage_provider: Mapped[StorageProvider] = mapped_column(
        String(20), default=StorageProvider.LOCAL, server_default=StorageProvider.LOCAL.value
    )
    mime_type: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    file_size: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    uploaded_to_drive_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    executions = relationship("ModelExecutionModel", back_populates="model_upload")
