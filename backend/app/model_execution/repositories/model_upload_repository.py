from sqlalchemy import select
from app.repositories.base_repository import BaseRepository
from app.model_execution.models.model_upload import ModelUploadModel
from app.models.enums import StorageProvider


class ModelUploadRepository(BaseRepository[ModelUploadModel]):
    def __init__(self, db):
        super().__init__(db, ModelUploadModel)

    def get_by_drive_file_id(self, drive_file_id: str) -> ModelUploadModel | None:
        stmt = select(ModelUploadModel).where(
            ModelUploadModel.drive_file_id == drive_file_id
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_storage_provider(
        self, provider: StorageProvider
    ) -> list[ModelUploadModel]:
        stmt = (
            select(ModelUploadModel)
            .where(ModelUploadModel.storage_provider == provider.value)
            .order_by(ModelUploadModel.created_at.desc())
        )
        return list(self.db.execute(stmt).scalars().all())

    def get_drive_uploads(self) -> list[ModelUploadModel]:
        return self.get_by_storage_provider(StorageProvider.GOOGLE_DRIVE)

    def get_local_uploads(self) -> list[ModelUploadModel]:
        return self.get_by_storage_provider(StorageProvider.LOCAL)
