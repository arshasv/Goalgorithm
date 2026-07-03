import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class ModelUploadResponse(BaseModel):
    model_id: uuid.UUID
    status: str
    drive_file_id: Optional[str] = None
    drive_web_link: Optional[str] = None
    storage_provider: str = "LOCAL"
    mime_type: Optional[str] = None
    file_size: Optional[int] = None
    uploaded_to_drive_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ModelExecutionResponse(BaseModel):
    execution_id: uuid.UUID
    status: str

    model_config = ConfigDict(from_attributes=True)

class ModelExecutionStatusResponse(BaseModel):
    status: str
    error_message: Optional[str] = None
    prediction_id: Optional[uuid.UUID] = None

    model_config = ConfigDict(from_attributes=True)
