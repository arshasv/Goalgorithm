import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.enums import BatchExecutionStatus, BatchJobStatus


class BatchExecutionJobResponse(BaseModel):
    id: uuid.UUID
    batch_id: uuid.UUID
    team_id: uuid.UUID
    model_upload_id: Optional[uuid.UUID] = None
    match_id: uuid.UUID
    status: BatchJobStatus
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class BatchExecutionResponse(BaseModel):
    id: uuid.UUID
    created_at: datetime
    created_by: uuid.UUID
    overall_status: BatchExecutionStatus
    total_jobs: int
    completed_jobs: int
    failed_jobs: int
    pending_jobs: int
    jobs: list[BatchExecutionJobResponse] = []

    model_config = ConfigDict(from_attributes=True)


class BatchExecutionListResponse(BaseModel):
    batches: list[BatchExecutionResponse]
    total: int


class TeamShortResponse(BaseModel):
    id: uuid.UUID
    team_id: str
    name: str

    model_config = ConfigDict(from_attributes=True)


class ModelUploadShortResponse(BaseModel):
    id: uuid.UUID
    original_filename: str

    model_config = ConfigDict(from_attributes=True)


class ModelDiscoveryResponse(BaseModel):
    team: TeamShortResponse
    latest_model: ModelUploadShortResponse
    upload_time: datetime

    model_config = ConfigDict(from_attributes=True)


class JobMatchResponse(BaseModel):
    id: uuid.UUID
    home_team_name: str
    away_team_name: str

    model_config = ConfigDict(from_attributes=True)


class JobDetailResponse(BaseModel):
    id: uuid.UUID
    team: TeamShortResponse
    match: JobMatchResponse
    model: Optional[ModelUploadShortResponse] = None
    status: BatchJobStatus
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class BatchSummaryResponse(BaseModel):
    id: uuid.UUID
    created_at: datetime
    created_by: uuid.UUID
    overall_status: BatchExecutionStatus
    total_jobs: int
    completed_jobs: int
    failed_jobs: int
    pending_jobs: int

    model_config = ConfigDict(from_attributes=True)


class BatchProgressResponse(BaseModel):
    batch_summary: BatchSummaryResponse
    current_running_job: Optional[JobDetailResponse] = None
    completed_jobs: list[JobDetailResponse]
    failed_jobs: list[JobDetailResponse]
    pending_jobs: list[JobDetailResponse]
    progress_percent: float
    estimated_remaining_jobs: int
    jobs: list[JobDetailResponse]

    model_config = ConfigDict(from_attributes=True)
