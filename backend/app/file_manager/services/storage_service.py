import logging
import os
import tempfile
import time
from pathlib import Path

from app.file_manager.storage import LocalStorageBackend

logger = logging.getLogger(__name__)


class StorageDownloadError(Exception):
    """Raised when all retry attempts to download a model have been exhausted."""


class StorageService:

    def __init__(self):
        self._local = LocalStorageBackend()
        self._drive = None

    def _init_drive(self):
        if self._drive is not None:
            return
        from app.file_manager.storage.drive import GoogleDriveStorageBackend
        from app.config import settings

        self._drive = GoogleDriveStorageBackend(
            folder_id=settings.google_drive_folder_id
        )
        logger.debug("Google Drive backend initialised")

    # ------------------------------------------------------------------
    # Core download – writes model bytes to a named temp file and returns
    # the path.  Callers MUST call cleanup(path) when finished.
    # ------------------------------------------------------------------
    def download(
        self,
        model_upload,
        *,
        max_retries: int = 3,
        retry_delay_seconds: float = 2.0,
    ) -> str:
        """Download *model_upload* to a temporary file and return its path.

        Args:
            model_upload: ORM record with storage_provider, drive_file_id,
                          stored_file_path, and original_filename.
            max_retries: Total number of attempts (including the first).
            retry_delay_seconds: Seconds to wait between consecutive attempts.

        Returns:
            Absolute path of the temp file containing the model bytes.

        Raises:
            StorageDownloadError: When all attempts fail.
        """
        from app.models.enums import StorageProvider

        provider = model_upload.storage_provider
        identifier = (
            model_upload.drive_file_id
            if provider == StorageProvider.GOOGLE_DRIVE
            else model_upload.stored_file_path
        )

        logger.info(
            "Starting model download: provider=%s, identifier=%s, model_upload_id=%s",
            provider,
            identifier,
            model_upload.id,
        )

        last_exc: Exception | None = None

        for attempt in range(1, max_retries + 1):
            try:
                data = self._fetch_bytes(model_upload, provider)
                temp_path = self._write_temp(data, model_upload.original_filename)
                logger.info(
                    "Model download succeeded on attempt %d/%d: temp_path=%s, model_upload_id=%s",
                    attempt,
                    max_retries,
                    temp_path,
                    model_upload.id,
                )
                return temp_path

            except Exception as exc:  # noqa: BLE001
                last_exc = exc
                logger.warning(
                    "Model download attempt %d/%d failed: model_upload_id=%s, error=%s",
                    attempt,
                    max_retries,
                    model_upload.id,
                    exc,
                )
                if attempt < max_retries:
                    time.sleep(retry_delay_seconds)

        logger.error(
            "All %d download attempts exhausted for model_upload_id=%s",
            max_retries,
            model_upload.id,
        )
        raise StorageDownloadError(
            f"Failed to download model (model_upload_id={model_upload.id}) "
            f"after {max_retries} attempts: {last_exc}"
        ) from last_exc

    # Convenience alias for callers that want an explicit name
    download_with_retry = download

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _fetch_bytes(self, model_upload, provider) -> bytes:
        from app.models.enums import StorageProvider

        if provider == StorageProvider.GOOGLE_DRIVE:
            if not model_upload.drive_file_id:
                raise ValueError(
                    "Model stored on Drive but drive_file_id is missing"
                )
            self._init_drive()
            return self._drive.get(model_upload.drive_file_id)

        # LOCAL fallback
        if not model_upload.stored_file_path:
            raise ValueError(
                "Model stored locally but stored_file_path is missing"
            )
        return self._local.get(model_upload.stored_file_path)

    @staticmethod
    def _write_temp(data: bytes, original_filename: str) -> str:
        suffix = Path(original_filename).suffix or ".pkl"
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        try:
            tmp.write(data)
        finally:
            tmp.close()
        return tmp.name

    # ------------------------------------------------------------------
    # Cleanup
    # ------------------------------------------------------------------
    @staticmethod
    def cleanup(temp_path: str | None) -> None:
        """Remove a temporary file produced by download().

        Safe to call with None or a path that no longer exists.
        """
        if not temp_path:
            return
        try:
            os.remove(temp_path)
            logger.debug("Temp file removed: %s", temp_path)
        except FileNotFoundError:
            pass
        except OSError as exc:
            logger.warning("Could not remove temp file %s: %s", temp_path, exc)

