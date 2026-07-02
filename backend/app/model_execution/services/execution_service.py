import logging
import uuid
from pathlib import Path

from fastapi import UploadFile, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.config import settings
from app.model_execution.models.model_upload import ModelUploadModel
from app.model_execution.models.model_execution import ModelExecutionModel
from app.model_execution.services.model_executor import ModelExecutor
from app.models.enums import StorageProvider

logger = logging.getLogger(__name__)


class ExecutionService:
    def __init__(self, db: Session):
        self.db = db

    def upload_model(self, team_id: uuid.UUID, match_id: uuid.UUID, file: UploadFile) -> dict:
        if not file.filename.endswith('.pkl'):
            raise HTTPException(status_code=400, detail="Only .pkl files are allowed")

        file_bytes = file.file.read()

        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        logger.info(
            "Model upload received: filename=%s, size=%d bytes, team=%s, match=%s",
            file.filename, len(file_bytes), team_id, match_id,
        )

        # ---------------------------------------------------------------
        # 1. Upload to Storage & Persist Metadata
        # ---------------------------------------------------------------
        import os
        from app.models.enums import StorageProvider

        if getattr(settings, "use_google_drive", False):
            try:
                from app.file_manager.storage.drive import GoogleDriveStorageBackend
    
                if not settings.google_drive_folder_id:
                    raise ValueError(
                        "GOOGLE_DRIVE_FOLDER_ID is not configured. "
                        "Set this environment variable before uploading models."
                    )
    
                drive_storage = GoogleDriveStorageBackend(
                    folder_id=settings.google_drive_folder_id,
                )
                drive_file_id = drive_storage.save(
                    data=file_bytes,
                    destination=file.filename,
                )
                logger.info(
                    "Model uploaded to Google Drive: drive_file_id=%s, original=%s, "
                    "team=%s, match=%s, size=%d bytes",
                    drive_file_id, file.filename, team_id, match_id, len(file_bytes),
                )
                
                model_upload = ModelUploadModel(
                    team_id=team_id,
                    match_id=match_id,
                    original_filename=file.filename,
                    stored_file_path="google-drive",       # sentinel — not a real path
                    drive_file_id=drive_file_id,
                    storage_provider=StorageProvider.GOOGLE_DRIVE,
                    file_size=len(file_bytes),
                    status="IDLE",
                )
            except HTTPException:
                raise
            except Exception as exc:
                logger.error(
                    "Google Drive upload failed: filename=%s, team=%s, match=%s, error=%s",
                    file.filename, team_id, match_id, exc,
                )
                raise HTTPException(
                    status_code=502,
                    detail=(
                        f"Failed to upload model to Google Drive: {exc}. "
                        "Verify GOOGLE_DRIVE_FOLDER_ID and OAuth permissions."
                    ),
                ) from exc
        else:
            try:
                from app.file_manager.storage.local import LocalStorageBackend
                from pathlib import Path
                
                local_storage = LocalStorageBackend()
                
                # Resolve base uploads directory to absolute path (backend/uploads/models)
                upload_base_dir = Path(__file__).resolve().parent.parent.parent.parent / "uploads" / "models"
                
                # Create a local path like uploads/models/<match_id>/<team_id>/<filename>
                destination_path = str(upload_base_dir / str(match_id) / str(team_id) / file.filename)
                
                stored_path = local_storage.save(
                    data=file_bytes,
                    destination=destination_path,
                )
                
                logger.info(
                    "Model uploaded locally: path=%s, original=%s, team=%s, match=%s, size=%d bytes",
                    stored_path, file.filename, team_id, match_id, len(file_bytes)
                )
                
                model_upload = ModelUploadModel(
                    team_id=team_id,
                    match_id=match_id,
                    original_filename=file.filename,
                    stored_file_path=stored_path,
                    drive_file_id=None,
                    storage_provider=StorageProvider.LOCAL,
                    file_size=len(file_bytes),
                    status="IDLE",
                )
            except Exception as exc:
                logger.error(
                    "Local upload failed: filename=%s, team=%s, match=%s, error=%s",
                    file.filename, team_id, match_id, exc,
                )
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to upload model locally: {exc}"
                ) from exc

        self.db.add(model_upload)
        self.db.commit()
        self.db.refresh(model_upload)

        logger.info(
            "Model upload persisted: model_id=%s, storage_provider=%s",
            model_upload.id, model_upload.storage_provider,
        )

        return {
            "model_id": model_upload.id,
            "status": model_upload.status,
            "drive_file_id": model_upload.drive_file_id,
        }

    def get_execution_status(self, execution_id: uuid.UUID) -> dict:
        execution = self.db.query(ModelExecutionModel).filter(
            ModelExecutionModel.id == execution_id
        ).first()

        if not execution:
            # Fallback: treat execution_id as a model_upload_id
            execution = self.db.query(ModelExecutionModel).filter(
                ModelExecutionModel.model_upload_id == execution_id
            ).first()

        if not execution:
            upload = self.db.query(ModelUploadModel).filter(
                ModelUploadModel.id == execution_id
            ).first()
            if not upload:
                raise HTTPException(
                    status_code=404,
                    detail=f"No execution or upload found for id={execution_id}",
                )
            return {
                "status": upload.status,
                "error_message": None,
                "prediction_id": None,
            }

        return {
            "status": execution.status,
            "error_message": execution.error_message,
            "prediction_id": execution.prediction_id,
        }

    def execute_model(self, model_id: uuid.UUID, background_tasks: BackgroundTasks) -> dict:
        upload = self.db.query(ModelUploadModel).filter(
            ModelUploadModel.id == model_id
        ).first()
        if not upload:
            raise HTTPException(
                status_code=404,
                detail=f"Model upload not found: id={model_id}",
            )

        if getattr(settings, "use_google_drive", False):
            if upload.storage_provider != StorageProvider.GOOGLE_DRIVE or not upload.drive_file_id:
                raise HTTPException(
                    status_code=422,
                    detail=(
                        f"Model upload id={model_id} has no valid Google Drive reference. "
                        "Re-upload the model before executing."
                    ),
                )
        else:
            if upload.storage_provider != StorageProvider.LOCAL or not upload.stored_file_path:
                raise HTTPException(
                    status_code=422,
                    detail=(
                        f"Model upload id={model_id} has no valid local storage reference. "
                        "Re-upload the model before executing."
                    ),
                )

        execution = ModelExecutionModel(
            model_upload_id=model_id,
            status="RUNNING",
        )
        self.db.add(execution)
        self.db.commit()
        self.db.refresh(execution)

        logger.info(
            "Scheduling background execution: execution_id=%s, model_upload_id=%s",
            execution.id, model_id,
        )

        executor = ModelExecutor(execution.id)
        background_tasks.add_task(executor.execute_in_background)

        return {
            "execution_id": execution.id,
            "status": execution.status,
        }

    # ------------------------------------------------------------------
    # Batch execution methods
    # ------------------------------------------------------------------

    def execute_batch(self, batch_id: uuid.UUID, background_tasks: BackgroundTasks) -> dict:
        from app.models.batch_execution import BatchExecutionModel
        from app.models.enums import BatchExecutionStatus

        batch = self.db.query(BatchExecutionModel).filter(
            BatchExecutionModel.id == batch_id
        ).first()
        if not batch:
            raise HTTPException(status_code=404, detail="Batch not found")
        if batch.overall_status == BatchExecutionStatus.RUNNING:
            raise HTTPException(status_code=400, detail="Batch is already running")

        batch.overall_status = BatchExecutionStatus.RUNNING
        self.db.commit()

        background_tasks.add_task(_process_batch_jobs, batch_id)

        return {"status": "PENDING"}

    def cancel_batch(self, batch_id: uuid.UUID) -> dict:
        from app.models.batch_execution import BatchExecutionModel
        from app.models.enums import BatchExecutionStatus, BatchJobStatus

        batch = self.db.query(BatchExecutionModel).filter(
            BatchExecutionModel.id == batch_id
        ).first()
        if not batch:
            raise HTTPException(status_code=404, detail="Batch not found")

        batch.overall_status = BatchExecutionStatus.CANCELLED
        for job in batch.jobs:
            if job.status in (BatchJobStatus.PENDING, BatchJobStatus.RUNNING):
                job.status = BatchJobStatus.CANCELLED
        self.db.commit()

        return {"status": "CANCELLED"}

    def retry_batch(
        self, batch_id: uuid.UUID, force_all: bool, background_tasks: BackgroundTasks
    ) -> dict:
        from app.models.batch_execution import BatchExecutionModel
        from app.models.enums import BatchExecutionStatus, BatchJobStatus

        batch = self.db.query(BatchExecutionModel).filter(
            BatchExecutionModel.id == batch_id
        ).first()
        if not batch:
            raise HTTPException(status_code=404, detail="Batch not found")

        if force_all:
            for job in batch.jobs:
                if job.status in (BatchJobStatus.FAILED, BatchJobStatus.CANCELLED, BatchJobStatus.COMPLETED):
                    job.status = BatchJobStatus.PENDING
        else:
            for job in batch.jobs:
                if job.status == BatchJobStatus.FAILED:
                    job.status = BatchJobStatus.PENDING

        completed = sum(1 for j in batch.jobs if j.status == BatchJobStatus.COMPLETED)
        failed = sum(1 for j in batch.jobs if j.status == BatchJobStatus.FAILED)
        pending = sum(1 for j in batch.jobs if j.status == BatchJobStatus.PENDING)
        running = sum(1 for j in batch.jobs if j.status == BatchJobStatus.RUNNING)

        batch.completed_jobs = completed
        batch.failed_jobs = failed
        batch.pending_jobs = pending + running
        batch.total_jobs = len(batch.jobs)
        batch.overall_status = BatchExecutionStatus.PENDING
        self.db.commit()

        background_tasks.add_task(_process_batch_jobs, batch_id)

        return {"status": "PENDING"}

    def retry_job(self, job_id: uuid.UUID, background_tasks: BackgroundTasks) -> dict:
        from app.models.batch_execution import BatchExecutionJobModel
        from app.models.enums import BatchJobStatus

        job = self.db.query(BatchExecutionJobModel).filter(
            BatchExecutionJobModel.id == job_id
        ).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        if job.status != BatchJobStatus.FAILED:
            raise HTTPException(status_code=400, detail="Only failed jobs can be retried")

        job.status = BatchJobStatus.PENDING
        self.db.commit()

        background_tasks.add_task(_process_batch_jobs, job.batch_id)

        return {"status": "PENDING"}


def _process_batch_jobs(batch_id: uuid.UUID) -> None:
    """Background task that processes all pending jobs in a batch."""
    import logging
    import pickle
    from datetime import datetime, timezone

    from app.database import session
    from app.models.batch_execution import BatchExecutionModel, BatchExecutionJobModel
    from app.models.enums import BatchExecutionStatus, BatchJobStatus
    from app.file_manager.services.storage_service import StorageService, StorageDownloadError
    from app.model_execution.services.model_serializer import ModelSerializer
    from app.services.prediction_service import PredictionService

    logger = logging.getLogger(__name__)
    db: Session = session.SessionLocal()

    try:
        batch = db.query(BatchExecutionModel).filter(
            BatchExecutionModel.id == batch_id
        ).first()
        if not batch:
            logger.error("Batch not found for background processing: id=%s", batch_id)
            return

        jobs = (
            db.query(BatchExecutionJobModel)
            .filter(
                BatchExecutionJobModel.batch_id == batch_id,
                BatchExecutionJobModel.status == BatchJobStatus.PENDING,
            )
            .all()
        )

        if not jobs:
            logger.info("No pending jobs in batch %s", batch_id)
            batch.overall_status = BatchExecutionStatus.COMPLETED
            db.commit()
            return

        storage = StorageService()
        serializer = ModelSerializer()

        for job in jobs:
            job.status = BatchJobStatus.RUNNING
            job.started_at = datetime.now(timezone.utc)
            db.commit()

            try:
                if not job.model_upload:
                    raise ValueError(f"Job {job.id} has no model upload")

                temp_path: str | None = None
                try:
                    temp_path = storage.download_with_retry(
                        job.model_upload, max_retries=3, retry_delay_seconds=2.0
                    )
                    with open(temp_path, "rb") as f:
                        model = pickle.load(f)
                except StorageDownloadError as exc:
                    raise ValueError(f"Model download failed: {exc}") from exc
                finally:
                    storage.cleanup(temp_path)

                if not hasattr(model, "predict"):
                    raise ValueError("Model object has no 'predict' method")

                from app.models.match import MatchModel
                match = db.query(MatchModel).filter(
                    MatchModel.id == job.match_id
                ).first()
                if not match:
                    raise ValueError(f"Match {job.match_id} not found")

                model_input = {
                    "home_team": match.home_team_name,
                    "away_team": match.away_team_name,
                }
                model_output = model.predict(model_input)

                payload = serializer.serialize_output(
                    model_output=model_output,
                    team_id=job.team_id,
                    match_id=job.match_id,
                )
                pred_service = PredictionService(db)
                pred_service.save_prediction(payload)

                job.status = BatchJobStatus.COMPLETED
                logger.info(
                    "Batch job completed: job_id=%s, team=%s, match=%s",
                    job.id, job.team_id, job.match_id,
                )

            except Exception as exc:
                logger.exception("Batch job failed: job_id=%s", job.id)
                job.status = BatchJobStatus.FAILED
                job.error_message = str(exc)

            job.completed_at = datetime.now(timezone.utc)
            db.commit()

        completed = sum(1 for j in batch.jobs if j.status == BatchJobStatus.COMPLETED)
        failed = sum(1 for j in batch.jobs if j.status == BatchJobStatus.FAILED)
        cancelled = sum(1 for j in batch.jobs if j.status == BatchJobStatus.CANCELLED)
        pending = sum(1 for j in batch.jobs if j.status == BatchJobStatus.PENDING)

        batch.completed_jobs = completed
        batch.failed_jobs = failed
        batch.pending_jobs = pending

        remaining = pending + sum(1 for j in batch.jobs if j.status == BatchJobStatus.RUNNING)
        if remaining == 0:
            batch.overall_status = (
                BatchExecutionStatus.COMPLETED if completed > 0
                else BatchExecutionStatus.FAILED
            )
        db.commit()

    except Exception as exc:
        logger.exception("Batch background processing failed: batch_id=%s", batch_id)
        try:
            batch = db.query(BatchExecutionModel).filter(
                BatchExecutionModel.id == batch_id
            ).first()
            if batch:
                batch.overall_status = BatchExecutionStatus.FAILED
                db.commit()
        except Exception:
            db.rollback()
    finally:
        db.close()

