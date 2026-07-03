import os
import tempfile

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
)

from fastapi.responses import StreamingResponse

from app.drive_service import GoogleDriveService

router = APIRouter(
    prefix="/api/v1/drive",
    tags=["Google Drive"],
)

drive = GoogleDriveService()


@router.post("/upload")
async def upload(file: UploadFile = File(...)):

    suffix = os.path.splitext(file.filename)[1]

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:

        temp.write(await file.read())

        temp_path = temp.name

    result = drive.upload_file(
        temp_path,
        file.filename,
        file.content_type,
    )

    os.remove(temp_path)

    return {
        "success": True,
        "data": result,
    }


@router.get("/download/{filename}")
def download(filename: str):

    try:

        buffer, metadata = drive.download_file(filename)

        return StreamingResponse(
            buffer,
            media_type=metadata["mimeType"],
            headers={
                "Content-Disposition":
                    f'attachment; filename="{metadata["name"]}"'
            },
        )

    except Exception:
        raise HTTPException(
            status_code=404,
            detail="File not found",
        )


@router.get("/files")
def list_files():

    return drive.list_files()


@router.delete("/{file_id}")
def delete_file(file_id: str):

    drive.delete_file(file_id)

    return {
        "message": "Deleted successfully"
    }