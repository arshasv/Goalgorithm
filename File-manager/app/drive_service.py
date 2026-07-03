import io
import os

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

from googleapiclient.discovery import build
from googleapiclient.http import (
    MediaFileUpload,
    MediaIoBaseDownload,
)

from app.config import GOOGLE_DRIVE_FOLDER_ID

SCOPES = ["https://www.googleapis.com/auth/drive"]


class GoogleDriveService:

    def __init__(self):

        self.creds = None

        if os.path.exists("token.json"):
            self.creds = Credentials.from_authorized_user_file(
                "token.json",
                SCOPES
            )

        if not self.creds or not self.creds.valid:

            if self.creds and self.creds.expired and self.creds.refresh_token:
                self.creds.refresh(Request())

            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    "client_secret.json",
                    SCOPES
                )

                self.creds = flow.run_local_server(
                    port=8080,
                    open_browser=True
                )

            with open("token.json", "w") as token:
                token.write(self.creds.to_json())

        self.service = build(
            "drive",
            "v3",
            credentials=self.creds
        )

    ######################################################################
    # Upload File
    ######################################################################

    def upload_file(
        self,
        filepath: str,
        filename: str,
        mimetype: str,
    ):

        metadata = {
            "name": filename,
            "parents": [GOOGLE_DRIVE_FOLDER_ID]
        }

        media = MediaFileUpload(
            filepath,
            mimetype=mimetype,
            resumable=True
        )

        uploaded = (
            self.service.files()
            .create(
                body=metadata,
                media_body=media,
                fields="id,name,mimeType,size,webViewLink,webContentLink"
            )
            .execute()
        )

        return uploaded

    ######################################################################
    # Download File
    ######################################################################

    def download_file(self, file_id):

        request = self.service.files().get_media(
            fileId=file_id
        )

        buffer = io.BytesIO()

        downloader = MediaIoBaseDownload(
            buffer,
            request
        )

        done = False

        while not done:
            _, done = downloader.next_chunk()

        buffer.seek(0)

        metadata = (
            self.service.files()
            .get(
                fileId=file_id,
                fields="name,mimeType"
            )
            .execute()
        )

        return buffer, metadata

    ######################################################################
    # List Files
    ######################################################################

    def list_files(self):

        response = (
            self.service.files()
            .list(
                q=f"'{GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed=false",
                fields="files(id,name,mimeType,size,createdTime)"
            )
            .execute()
        )

        return response.get("files", [])

    ######################################################################
    # Get Metadata
    ######################################################################

    def get_metadata(self, file_id):

        return (
            self.service.files()
            .get(
                fileId=file_id,
                fields="*"
            )
            .execute()
        )

    ######################################################################
    # Delete File
    ######################################################################

    def delete_file(self, file_id):

        self.service.files().delete(
            fileId=file_id
        ).execute()

        return True

    ######################################################################
    # Create Folder
    ######################################################################

    def create_folder(self, folder_name):

        metadata = {
            "name": folder_name,
            "mimeType": "application/vnd.google-apps.folder"
        }

        folder = (
            self.service.files()
            .create(
                body=metadata,
                fields="id,name"
            )
            .execute()
        )

        return folder

    ######################################################################
    # Search Files
    ######################################################################

    def search_files(self, keyword):

        response = (
            self.service.files()
            .list(
                q=f"name contains '{keyword}' and trashed=false",
                fields="files(id,name,mimeType,size)"
            )
            .execute()
        )

        return response.get("files", [])