"""batch_model_executor.py

Executes a list of model upload IDs in sequence.

Each job:
- Downloads the model via StorageService (with retries, no direct filesystem dependency)
- Deserialises and runs the model
- Saves the prediction via PredictionService (upsert)
- Cleans up the temporary file even if execution fails
- Logs structured output throughout
- Never lets one job failure abort the remaining jobs
"""

from __future__ import annotations

import logging
import pickle
import uuid
from datetime import datetime, timezone
from typing import Sequence

from sqlalchemy.orm import Session

from app.file_manager.services.storage_service import StorageService, StorageDownloadError
from app.model_execution.services.model_serializer import ModelSerializer
from app.services.prediction_service import PredictionService

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────────────────
# Result container
# ──────────────────────────────────────────────────────────────────────────────

class BatchJobResult:
    """Outcome of a single job within a batch run."""

    def __init__(self, model_upload_id: uuid.UUID):
        self.model_upload_id = model_upload_id
        self.status: str = "PENDING"        # PENDING | SUCCESS | FAILED | SKIPPED
        self.prediction_id: uuid.UUID | None = None
        self.error: str | None = None
        self.started_at: datetime | None = None
        self.completed_at: datetime | None = None
        self.download_attempts: int = 0

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<BatchJobResult model_upload_id={self.model_upload_id} "
            f"status={self.status} error={self.error!r}>"
        )


# ──────────────────────────────────────────────────────────────────────────────
# Executor
# ──────────────────────────────────────────────────────────────────────────────

class BatchModelExecutor:
    """Run a batch of model uploads against their corresponding matches.

    Design principles
    -----------------
    * **No direct filesystem dependency** – all model bytes come through
      ``StorageService``, which handles Google Drive / local routing.
    * **Retries** – ``StorageService.download_with_retry`` retries transient
      download failures before giving up.
    * **Per-job isolation** – a failure in one job is caught, logged, and
      recorded; subsequent jobs proceed normally.
    * **Guaranteed cleanup** – the temporary file is removed in a ``finally``
      block regardless of execution outcome.
    * **Idempotent predictions** – ``PredictionService.save_prediction`` uses
      upsert semantics so re-running a batch never creates duplicate predictions.
    """

    def __init__(
        self,
        db: Session,
        *,
        max_download_retries: int = 3,
        retry_delay_seconds: float = 2.0,
    ):
        self.db = db
        self.max_download_retries = max_download_retries
        self.retry_delay_seconds = retry_delay_seconds
        self._storage = StorageService()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def run(
        self,
        model_upload_ids: Sequence[uuid.UUID],
    ) -> list[BatchJobResult]:
        """Execute all jobs and return a result per job.

        Args:
            model_upload_ids: Ordered list of ``ModelUploadModel.id`` values.

        Returns:
            One ``BatchJobResult`` per entry in *model_upload_ids*,
            in the same order.
        """
        results: list[BatchJobResult] = []

        logger.info(
            "Batch started: total_jobs=%d, job_ids=%s",
            len(model_upload_ids),
            [str(uid) for uid in model_upload_ids],
        )

        for idx, upload_id in enumerate(model_upload_ids, start=1):
            result = BatchJobResult(upload_id)
            logger.info(
                "Job %d/%d starting: model_upload_id=%s",
                idx,
                len(model_upload_ids),
                upload_id,
            )

            try:
                self._run_single(result)
            except Exception as exc:  # noqa: BLE001 – outer safety net
                result.status = "FAILED"
                result.error = f"Unexpected error: {exc}"
                logger.exception(
                    "Job %d/%d unexpected failure: model_upload_id=%s",
                    idx,
                    len(model_upload_ids),
                    upload_id,
                )

            results.append(result)
            logger.info(
                "Job %d/%d finished: model_upload_id=%s, status=%s, error=%s",
                idx,
                len(model_upload_ids),
                upload_id,
                result.status,
                result.error,
            )

        succeeded = sum(1 for r in results if r.status == "SUCCESS")
        failed = sum(1 for r in results if r.status == "FAILED")
        skipped = sum(1 for r in results if r.status == "SKIPPED")
        logger.info(
            "Batch finished: total=%d, succeeded=%d, failed=%d, skipped=%d",
            len(results),
            succeeded,
            failed,
            skipped,
        )

        return results

    # ------------------------------------------------------------------
    # Single-job execution
    # ------------------------------------------------------------------

    def _run_single(self, result: BatchJobResult) -> None:
        result.started_at = datetime.now(timezone.utc)

        # 1. Fetch the model upload record
        from app.model_execution.models.model_upload import ModelUploadModel  # local import avoids circular dep
        model_upload = self.db.query(ModelUploadModel).filter(
            ModelUploadModel.id == result.model_upload_id
        ).first()

        if not model_upload:
            result.status = "SKIPPED"
            result.error = "ModelUpload record not found"
            result.completed_at = datetime.now(timezone.utc)
            logger.warning(
                "Job skipped – ModelUpload not found: model_upload_id=%s",
                result.model_upload_id,
            )
            return

        # 2. Download model via StorageService (retries handled inside)
        temp_path: str | None = None
        model = None

        try:
            temp_path = self._storage.download_with_retry(
                model_upload,
                max_retries=self.max_download_retries,
                retry_delay_seconds=self.retry_delay_seconds,
            )
            result.download_attempts = self.max_download_retries  # upper-bound estimate

            # 3. Deserialise
            with open(temp_path, "rb") as fh:
                model = pickle.load(fh)

            logger.info(
                "Model loaded from temp file: model_upload_id=%s",
                result.model_upload_id,
            )

        except StorageDownloadError as exc:
            result.status = "FAILED"
            result.error = f"Download failed after {self.max_download_retries} retries: {exc}"
            result.completed_at = datetime.now(timezone.utc)
            logger.error(
                "Job failed – download exhausted retries: model_upload_id=%s, error=%s",
                result.model_upload_id,
                exc,
            )
            return  # cleanup handled in finally

        except Exception as exc:
            result.status = "FAILED"
            result.error = f"Deserialisation error: {exc}"
            result.completed_at = datetime.now(timezone.utc)
            logger.error(
                "Job failed – deserialisation: model_upload_id=%s, error=%s",
                result.model_upload_id,
                exc,
            )
            return

        finally:
            # Always clean up the temp file regardless of success / failure
            self._storage.cleanup(temp_path)

        # 4. Validate model interface
        if not hasattr(model, "predict"):
            result.status = "FAILED"
            result.error = "Model object has no 'predict' method"
            result.completed_at = datetime.now(timezone.utc)
            return

        # 5. Fetch match details
        try:
            from app.models.match import MatchModel  # local import avoids circular deps

            match = self.db.query(MatchModel).filter(
                MatchModel.id == model_upload.match_id
            ).first()

            if not match:
                raise ValueError("Match record not found")

        except Exception as exc:
            result.status = "FAILED"
            result.error = f"Match lookup error: {exc}"
            result.completed_at = datetime.now(timezone.utc)
            logger.error(
                "Job failed – match lookup: model_upload_id=%s, error=%s",
                result.model_upload_id,
                exc,
            )
            return

        # 6. Run model inference
        try:
            model_input = {
                "home_team": match.home_team_name,
                "away_team": match.away_team_name,
            }
            logger.info(
                "Running inference: model_upload_id=%s, match=%s vs %s",
                result.model_upload_id,
                match.home_team_name,
                match.away_team_name,
            )
            model_output = model.predict(model_input)

        except Exception as exc:
            result.status = "FAILED"
            result.error = f"Model inference error: {exc}"
            result.completed_at = datetime.now(timezone.utc)
            logger.error(
                "Job failed – inference: model_upload_id=%s, error=%s",
                result.model_upload_id,
                exc,
            )
            return

        # 7. Serialise output → prediction payload
        serializer = ModelSerializer()
        payload = serializer.serialize_output(
            model_output=model_output,
            team_id=model_upload.team_id,
            match_id=model_upload.match_id,
        )

        # 8. Upsert prediction via PredictionService
        try:
            pred_service = PredictionService(self.db)
            pred_service.save_prediction(payload)

        except Exception as exc:
            result.status = "FAILED"
            result.error = f"Prediction save error: {exc}"
            result.completed_at = datetime.now(timezone.utc)
            logger.error(
                "Job failed – prediction save: model_upload_id=%s, error=%s",
                result.model_upload_id,
                exc,
            )
            return

        # 9. Resolve prediction_id for reporting
        try:
            from app.models.prediction import PredictionModel

            pred_record = self.db.query(PredictionModel).filter(
                PredictionModel.team_id == str(model_upload.team_id),
                PredictionModel.match_id == str(model_upload.match_id),
            ).first()

            if pred_record:
                result.prediction_id = pred_record.id

        except Exception as exc:  # non-fatal
            logger.warning(
                "Could not resolve prediction_id after save: model_upload_id=%s, error=%s",
                result.model_upload_id,
                exc,
            )

        result.status = "SUCCESS"
        result.completed_at = datetime.now(timezone.utc)
        logger.info(
            "Job succeeded: model_upload_id=%s, prediction_id=%s",
            result.model_upload_id,
            result.prediction_id,
        )
