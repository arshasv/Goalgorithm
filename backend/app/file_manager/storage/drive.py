import io
import os
import tempfile
import logging

from app.file_manager.storage.base import StorageBackend
from app.file_manager.services.drive_service import GoogleDriveService

logger = logging.getLogger(__name__)


class GoogleDriveStorageBackend(StorageBackend):

    def __init__(self, folder_id: str):
        self.folder_id = folder_id
        # We delegate to the new OAuth 2.0 based service
        self.drive_service = GoogleDriveService()

    def save(self, data: bytes, destination: str) -> str:
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp.write(data)
            tmp_path = tmp.name

        try:
            # We assume GoogleDriveService handles metadata and resumable uploads
            uploaded = self.drive_service.upload_file(
                filepath=tmp_path,
                filename=destination,
                mimetype="application/octet-stream"
            )
            return uploaded["id"]
        finally:
            os.remove(tmp_path)

    def get(self, key: str) -> bytes:
        # download_file returns (buffer, metadata)
        buffer, _ = self.drive_service.download_file(file_id=key)
        return buffer.getvalue()

    def delete(self, key: str) -> bool:
        return self.drive_service.delete_file(file_id=key)

    def exists(self, key: str) -> bool:
        try:
            self.drive_service.get_metadata(file_id=key)
            return True
        except Exception:
            return False

    def get_metadata(self, key: str) -> dict:
        file_meta = self.drive_service.get_metadata(file_id=key)
        return {
            "id": file_meta.get("id"),
            "name": file_meta.get("name"),
            "mime_type": file_meta.get("mimeType"),
            "size": int(file_meta.get("size", 0)),
            "created_at": file_meta.get("createdTime"),
            "modified_at": file_meta.get("modifiedTime"),
        }
