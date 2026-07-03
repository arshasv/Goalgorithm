from abc import ABC, abstractmethod


class StorageBackend(ABC):

    @abstractmethod
    def save(self, data: bytes, destination: str) -> str:
        """
        Persist data and return a storage key that can retrieve it later.

        Args:
            data: Raw file content as bytes.
            destination: Hint for the target name or path.
                        For local storage this is the file path;
                        for Drive storage this is the filename.

        Returns:
            A storage key (file path, Drive file ID, etc.)
            that can be passed to get(), delete(), exists(),
            and get_metadata().
        """
        ...

    @abstractmethod
    def get(self, key: str) -> bytes:
        """Retrieve the full file content for the given storage key."""
        ...

    @abstractmethod
    def delete(self, key: str) -> bool:
        """Remove the stored file.  Returns True on success."""
        ...

    @abstractmethod
    def exists(self, key: str) -> bool:
        """Return whether a file exists for the given storage key."""
        ...

    @abstractmethod
    def get_metadata(self, key: str) -> dict:
        """
        Return metadata for the given storage key.

        Subclasses MUST include at least:
            "size"       — int, file size in bytes
            "name"       — str, filename
            "created_at" — str, ISO-8601 timestamp
            "modified_at" — str, ISO-8601 timestamp
        """
        ...
