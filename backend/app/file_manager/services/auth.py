import logging
import os
import sys

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

logger = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/drive"]

def get_drive_service():
    """Authenticate via OAuth 2.0 and return a Google Drive service instance."""
    creds = None
    module_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    token_path = os.path.join(module_dir, "token.json")

    if os.path.exists(token_path):
        try:
            creds = Credentials.from_authorized_user_file(token_path, SCOPES)
        except Exception as e:
            logger.error(f"Failed to load token.json: {e}")

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                logger.info("Refreshing expired Google Drive token")
                creds.refresh(Request())
                with open(token_path, "w") as token:
                    token.write(creds.to_json())
            except Exception as e:
                logger.error(f"Failed to refresh token: {e}")
                raise RuntimeError(
                    f"Failed to refresh Google Drive token: {e}. "
                    "Please run this script externally on your host machine to generate a new token.json."
                )
        else:
            raise FileNotFoundError(
                "token.json not found or invalid. Please generate it externally on your host machine "
                "by running: python3 backend/app/file_manager/services/auth.py"
            )

    return build("drive", "v3", credentials=creds)

if __name__ == "__main__":
    # Allows the user to run this script standalone OUTSIDE Docker to generate token.json
    print("Generating Google Drive OAuth 2.0 token.json...")
    module_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    token_path = os.path.join(module_dir, "token.json")
    client_secret_path = os.path.join(module_dir, "client_secret.json")

    if not os.path.exists(client_secret_path):
        print(f"Error: client_secret.json not found at {client_secret_path}")
        sys.exit(1)

    # We do NOT run this inside Docker headless environments
    flow = InstalledAppFlow.from_client_secrets_file(client_secret_path, SCOPES)
    creds = flow.run_local_server(port=0)

    with open(token_path, "w") as token:
        token.write(creds.to_json())

    print(f"Authentication successful! token.json has been generated at: {token_path}")
