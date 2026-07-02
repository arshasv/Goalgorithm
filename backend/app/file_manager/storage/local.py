import os
from datetime import datetime, timezone
from pathlib import Path

from app.file_manager.storage.base import StorageBackend


class LocalStorageBackend(StorageBackend):

    def save(self, data: bytes, destination: str) -> str:
        dest = Path(destination)
        dest.parent.mkdir(parents=True, exist_ok=True)
        with open(dest, "wb") as f:
            f.write(data)
        return str(dest.resolve())

    def get(self, key: str) -> bytes:
        with open(key, "rb") as f:
            return f.read()

    def delete(self, key: str) -> bool:
        if os.path.isfile(key):
            os.remove(key)
            return True
        return False

    def exists(self, key: str) -> bool:
        return os.path.isfile(key)

    def get_metadata(self, key: str) -> dict:
        st = os.stat(key)
        return {
            "size": st.st_size,
            "name": os.path.basename(key),
            "created_at": datetime.fromtimestamp(
                st.st_ctime, tz=timezone.utc
            ).isoformat(),
            "modified_at": datetime.fromtimestamp(
                st.st_mtime, tz=timezone.utc
            ).isoformat(),
        }
