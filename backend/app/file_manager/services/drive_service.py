"""drive_service.py

High-level Google Drive helper used by the Drive API router.

Authentication: OAuth 2.0 (client_secret.json & token.json).
"""

import io
import logging
import os
from typing import Any

from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload
from googleapiclient.errors import HttpError
from google.auth.exceptions import GoogleAuthError

from app.config import settings
from app.file_manager.services.auth import get_drive_service

logger = logging.getLogger(__name__)


class DriveAuthError(Exception): pass
class DriveFolderError(Exception): pass
class DriveUploadError(Exception): pass
class DriveNetworkError(Exception): pass


class GoogleDriveService:
    """Drive operations authenticated via OAuth 2.0."""

    def __init__(self):
        try:
            self.service = get_drive_service()
            logger.info("GoogleDriveService initialised with OAuth 2.0")
        except FileNotFoundError as e:
            raise DriveAuthError(str(e))
        except GoogleAuthError as e:
            raise DriveAuthError(f"Authentication failure or expired token: {e}")
        except Exception as e:
            raise DriveNetworkError(f"Failed to connect to Google Drive: {e}")

    # ──────────────────────────────────────────────────────────────────
    # Upload
    # ──────────────────────────────────────────────────────────────────

    def upload_file(self, filepath: str, filename: str, mimetype: str) -> dict:
        """Upload a local file to the configured Drive folder."""
        folder_id = settings.google_drive_folder_id
        if not folder_id:
            raise DriveFolderError("Missing folder configuration: GOOGLE_DRIVE_FOLDER_ID not set.")
            
        metadata = {
            "name": filename,
            "parents": [folder_id],
        }
        media = MediaFileUpload(filepath, mimetype=mimetype, resumable=True)

        try:
            uploaded = (
                self.service.files()
                .create(
                    body=metadata,
                    media_body=media,
                    fields="id,name,mimeType,size,webViewLink,webContentLink",
                )
                .execute()
            )
            logger.info(
                "File uploaded: drive_id=%s, name=%s, size=%s",
                uploaded.get("id"), filename, uploaded.get("size"),
            )
            return uploaded
        except HttpError as e:
            if e.resp.status == 404:
                raise DriveFolderError(f"Folder not found or invalid folder ID: {folder_id}")
            elif e.resp.status == 403:
                raise DriveAuthError(f"Permission denied: {e}")
            raise DriveUploadError(f"Upload failed: {e}")
        except Exception as e:
            raise DriveNetworkError(f"Network error during upload: {e}")

    # ──────────────────────────────────────────────────────────────────
    # Download
    # ──────────────────────────────────────────────────────────────────

    def download_file(self, file_id: str):
        try:
            request = self.service.files().get_media(fileId=file_id)
            buffer = io.BytesIO()
            downloader = MediaIoBaseDownload(buffer, request)

            done = False
            while not done:
                _, done = downloader.next_chunk()

            buffer.seek(0)

            metadata = (
                self.service.files()
                .get(fileId=file_id, fields="name,mimeType")
                .execute()
            )
            logger.debug("File downloaded: drive_id=%s, name=%s", file_id, metadata.get("name"))
            return buffer, metadata
        except HttpError as e:
            if e.resp.status == 404:
                raise FileNotFoundError(f"File {file_id} not found on Google Drive.")
            raise DriveNetworkError(f"Download failed: {e}")
        except Exception as e:
            raise DriveNetworkError(f"Network error during download: {e}")

    # ──────────────────────────────────────────────────────────────────
    # List / Metadata / Delete
    # ──────────────────────────────────────────────────────────────────

    def list_files(self) -> list:
        folder_id = settings.google_drive_folder_id
        if not folder_id:
            raise DriveFolderError("Missing folder configuration.")
        try:
            response = (
                self.service.files()
                .list(
                    q=f"'{folder_id}' in parents and trashed=false",
                    fields="files(id,name,mimeType,size,createdTime)",
                )
                .execute()
            )
            return response.get("files", [])
        except HttpError as e:
            if e.resp.status == 404:
                raise DriveFolderError(f"Folder not found or invalid folder ID: {folder_id}")
            raise DriveNetworkError(f"Failed to list files: {e}")
        except Exception as e:
            raise DriveNetworkError(f"Network error: {e}")

    def get_metadata(self, file_id: str) -> dict:
        try:
            return (
                self.service.files()
                .get(fileId=file_id, fields="*")
                .execute()
            )
        except Exception as e:
            raise DriveNetworkError(f"Failed to get metadata: {e}")

    def delete_file(self, file_id: str) -> bool:
        try:
            self.service.files().delete(fileId=file_id).execute()
            logger.info("File deleted from Drive: drive_id=%s", file_id)
            return True
        except Exception as e:
            raise DriveNetworkError(f"Failed to delete file: {e}")

    def create_folder(self, folder_name: str) -> dict:
        metadata = {
            "name": folder_name,
            "mimeType": "application/vnd.google-apps.folder",
        }
        try:
            folder = (
                self.service.files()
                .create(body=metadata, fields="id,name")
                .execute()
            )
            return folder
        except Exception as e:
            raise DriveNetworkError(f"Failed to create folder: {e}")

    def search_files(self, keyword: str) -> list:
        try:
            response = (
                self.service.files()
                .list(
                    q=f"name contains '{keyword}' and trashed=false",
                    fields="files(id,name,mimeType,size)",
                )
                .execute()
            )
            return response.get("files", [])
        except Exception as e:
            raise DriveNetworkError(f"Search failed: {e}")


