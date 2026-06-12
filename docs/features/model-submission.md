# Model Submission

## Overview
The Model Submission feature allows participating teams to securely upload their prediction machine learning models (code or serialized models) for organizational review and archival.

## Features
- **Supported ML Files**: Accepts standard model and code formats including `.zip`, `.tar.gz`, `.py`, and `.ipynb`. Maximum file size is strictly enforced (50MB).
- **Upload Workflow**: Team Leaders use a dedicated upload interface. Uploads are strictly mapped to the authenticated Team ID, tracking filename, size, and timestamp.
- **Time Window Locking**: Submissions are strictly constrained to an "Upload Window". If the window is disabled or the current UTC time falls outside the explicitly defined start and end times, the API immediately rejects the upload with a `403 Forbidden` error ("Model submission window closed"). Existing submissions are not altered during rejected attempts.
- **Organizer Controls**: Organizers can dynamically enable/disable the window and set specific start/end timestamps via the UI, instantly locking or unlocking the capability for all teams.

## APIs
- `GET /api/v1/upload-window` - Get current window status and times.
- `PUT /api/v1/upload-window` - Organizer endpoint to update window constraints.
- `POST /api/v1/teams/my-team/model` - Team Leader endpoint to upload/replace a model (enforces window and size/extension validation).
- `GET /api/v1/teams/my-team/model` - View the active uploaded model details.
- `GET /api/v1/admin/models` - Organizer endpoint to list all team submissions.
- `GET /api/v1/admin/models/{id}/download` - Organizer endpoint to securely download a team's model file (returns `application/octet-stream`).

## Database Schema
- Table: `upload_window_config`
  - Tracks `is_enabled`, `start_time`, `end_time`.
- Table: `model_submissions`
  - Tracks `team_id`, `file_name`, `file_type`, `file_path`, `file_size`, `is_active`, `uploaded_at`. Old submissions are soft-deleted (`is_active=False`) upon successful replacement.

## Frontend
- **Team Leader Page**: `Model Submission` (`model-submission.js`)
  - Displays current submission details, window status (Open/Closed), and an upload form when the window is active.
- **Organizer Page**: `Model Management` (`model-management.js`)
  - Displays a configuration panel to set the Upload Window.
  - Lists all teams with their corresponding submission status and secure download buttons utilizing the authenticated `fetch` API.
