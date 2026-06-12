# Model Submission Feature

## Objective
Provide an intuitive interface for Team Leaders to securely upload prediction models and for Organizers to manage submission windows and download those files.

## Pages
- **Model Submission** (`model-submission.js`): Exclusively accessible to Team Leaders. Displays current uploaded model, file size, timestamp, and window status. Allows file uploads only when the window is explicitly open.
- **Model Management** (`model-management.js`): Exclusively accessible to Organizers. Provides controls to adjust the upload window (enable/disable, start/end times) and lists all teams with direct links to securely download their submissions.

## Data Integration
- Connects to backend API endpoints via `ModelSubmissionService` and `UploadWindowService` in `api.js`.
- File uploads are managed via `FormData` containing the multipart payload.
- Secure downloads for organizers utilize an authenticated `fetch` block returning an `application/octet-stream` converted into a temporary object URL.

## States
- **Open Window**: Upload form is visible. Submissions can be replaced.
- **Closed Window**: Upload form is hidden. Clear messaging informs the user if the window is closed, disabled, or locked for the future.
- **No Submission**: Displays an "Empty State" component.
- **Submitted**: Renders a success alert component along with file metadata details.

## Theme & UX Elements
- Adheres strictly to GOALGORITHM theme tokens (`card`, `page-header`, `empty-state`, etc.).
- Utilizes the global `Toast` notification system for upload success/failure feedback.
- Asynchronous actions leverage standard button states or loading masks where appropriate.
