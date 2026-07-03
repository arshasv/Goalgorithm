import uuid
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.api.deps import get_current_organizer, get_db
from app.models.user import UserModel
from app.repositories.batch_execution_repository import BatchExecutionRepository
from app.schemas.batch_execution_schema import (
    BatchExecutionResponse,
    BatchExecutionListResponse,
    BatchExecutionJobResponse,
    ModelDiscoveryResponse,
    BatchProgressResponse,
)

router = APIRouter(prefix="/batch-executions", tags=["batch_executions"])


@router.get("", response_model=BatchExecutionListResponse)
def list_batches(
    db: Session = Depends(get_db),
    _: UserModel = Depends(get_current_organizer),
):
    repo = BatchExecutionRepository(db)
    batches = repo.list_batches()
    return BatchExecutionListResponse(
        batches=[BatchExecutionResponse.model_validate(b) for b in batches],
        total=len(batches),
    )


@router.get("/{batch_id}", response_model=BatchExecutionResponse)
def get_batch(
    batch_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: UserModel = Depends(get_current_organizer),
):
    repo = BatchExecutionRepository(db)
    batch = repo.get_batch(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch


@router.post("", response_model=list[ModelDiscoveryResponse])
def create_batch(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_organizer),
):
    repo = BatchExecutionRepository(db)
    discovered = repo.discover_latest_models()
    return [ModelDiscoveryResponse.model_validate(d) for d in discovered]


@router.post("/create", response_model=BatchExecutionResponse)
def create_actual_batch(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_organizer),
):
    match_ids = payload.get("match_ids", [])
    repo = BatchExecutionRepository(db)
    batch = repo.create_batch(created_by=current_user.id)
    discovered = repo.discover_latest_models()
    for item in discovered:
        team = item["team"]
        model = item["latest_model"]
        for match_id in match_ids:
            repo.add_job(
                batch_id=batch.id,
                team_id=team.id,
                match_id=uuid.UUID(match_id),
                model_upload_id=model.id
            )
    db.refresh(batch)
    return batch


@router.post("/{batch_id}/jobs", response_model=BatchExecutionJobResponse)
def add_job(
    batch_id: uuid.UUID,
    team_id: uuid.UUID,
    match_id: uuid.UUID,
    model_upload_id: uuid.UUID | None = None,
    db: Session = Depends(get_db),
    _: UserModel = Depends(get_current_organizer),
):
    repo = BatchExecutionRepository(db)
    job = repo.add_job(
        batch_id=batch_id,
        team_id=team_id,
        match_id=match_id,
        model_upload_id=model_upload_id,
    )
    return BatchExecutionJobResponse.model_validate(job)


@router.post("/{batch_id}/execute")
def execute_batch(
    batch_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: UserModel = Depends(get_current_organizer),
):
    from app.model_execution.services.execution_service import ExecutionService
    service = ExecutionService(db)
    return service.execute_batch(batch_id, background_tasks)


@router.get("/{batch_id}/progress", response_model=BatchProgressResponse)
def get_batch_progress(
    batch_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: UserModel = Depends(get_current_organizer),
):
    from app.models.batch_execution import BatchExecutionModel
    from app.models.enums import BatchJobStatus
    batch = db.query(BatchExecutionModel).filter(BatchExecutionModel.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    mapped_jobs = []
    for job in batch.jobs:
        mapped_jobs.append({
            "id": job.id,
            "team": {
                "id": job.team.id,
                "team_id": job.team.team_id,
                "name": job.team.name
            },
            "match": {
                "id": job.match.id,
                "home_team_name": job.match.home_team_name,
                "away_team_name": job.match.away_team_name
            },
            "model": {
                "id": job.model_upload.id,
                "original_filename": job.model_upload.original_filename
            } if job.model_upload else None,
            "status": job.status,
            "started_at": job.started_at,
            "completed_at": job.completed_at,
            "error_message": job.error_message
        })

    current_running_job = None
    completed_jobs = []
    failed_jobs = []
    pending_jobs = []

    for mj in mapped_jobs:
        if mj["status"] == BatchJobStatus.RUNNING:
            if current_running_job is None:
                current_running_job = mj
        elif mj["status"] == BatchJobStatus.COMPLETED:
            completed_jobs.append(mj)
        elif mj["status"] == BatchJobStatus.FAILED:
            failed_jobs.append(mj)
        elif mj["status"] == BatchJobStatus.PENDING:
            pending_jobs.append(mj)

    total_jobs = len(mapped_jobs)
    processed_jobs = len(completed_jobs) + len(failed_jobs)
    progress_percent = (processed_jobs / total_jobs * 100.0) if total_jobs > 0 else 100.0
    estimated_remaining_jobs = len(pending_jobs) + (1 if current_running_job else 0)

    return {
        "batch_summary": {
            "id": batch.id,
            "created_at": batch.created_at,
            "created_by": batch.created_by,
            "overall_status": batch.overall_status,
            "total_jobs": batch.total_jobs,
            "completed_jobs": batch.completed_jobs,
            "failed_jobs": batch.failed_jobs,
            "pending_jobs": batch.pending_jobs
        },
        "current_running_job": current_running_job,
        "completed_jobs": completed_jobs,
        "failed_jobs": failed_jobs,
        "pending_jobs": pending_jobs,
        "progress_percent": progress_percent,
        "estimated_remaining_jobs": estimated_remaining_jobs,
        "jobs": mapped_jobs
    }


@router.post("/{batch_id}/cancel")
def cancel_batch(
    batch_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: UserModel = Depends(get_current_organizer),
):
    from app.model_execution.services.execution_service import ExecutionService
    service = ExecutionService(db)
    return service.cancel_batch(batch_id)


@router.post("/{batch_id}/retry")
def retry_batch(
    batch_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    payload: dict = None,
    db: Session = Depends(get_db),
    _: UserModel = Depends(get_current_organizer),
):
    force_all = False
    if payload:
        force_all = payload.get("force_all", False)
    
    from app.model_execution.services.execution_service import ExecutionService
    service = ExecutionService(db)
    return service.retry_batch(batch_id, force_all, background_tasks)


@router.post("/jobs/{job_id}/retry")
def retry_job(
    job_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: UserModel = Depends(get_current_organizer),
):
    from app.model_execution.services.execution_service import ExecutionService
    service = ExecutionService(db)
    return service.retry_job(job_id, background_tasks)
