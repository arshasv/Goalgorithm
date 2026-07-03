import logging
import os
import tempfile

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
)
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/drive",
    tags=["Google Drive"],
)


def _get_drive():
    """Lazy-initialise GoogleDriveService per request.

    Avoids a startup crash when Google credentials are absent
    (unit-test environments, cold Docker starts before credentials are mounted).
    """
    try:
        from app.file_manager.services.drive_service import GoogleDriveService
        return GoogleDriveService()
    except Exception as exc:
        logger.error("Failed to initialise GoogleDriveService: %s", exc)
        raise HTTPException(
            status_code=503,
            detail=(
                "Google Drive service is unavailable. "
                "Check credentials and GOOGLE_DRIVE_FOLDER_ID."
            ),
        ) from exc


@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    drive = _get_drive()
    suffix = os.path.splitext(file.filename)[1]

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
        temp.write(await file.read())
        temp_path = temp.name

    try:
        result = drive.upload_file(
            temp_path,
            file.filename,
            file.content_type,
        )
    finally:
        try:
            os.remove(temp_path)
        except OSError:
            pass

    return {"success": True, "data": result}


@router.get("/download/{filename}")
def download(filename: str):
    drive = _get_drive()
    try:
        buffer, metadata = drive.download_file(filename)
        return StreamingResponse(
            buffer,
            media_type=metadata["mimeType"],
            headers={
                "Content-Disposition": f'attachment; filename="{metadata["name"]}"'
            },
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="File not found")


@router.get("/files")
def list_files():
    return _get_drive().list_files()


@router.delete("/{file_id}")
def delete_file(file_id: str):
    _get_drive().delete_file(file_id)
    return {"message": "Deleted successfully"}

