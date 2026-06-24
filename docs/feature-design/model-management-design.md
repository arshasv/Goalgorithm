# Model Management UX Design

## Overview
Model Management handles the lifecycle of the AI models uploaded by Team Leaders. This defines the workflow for future automated model evaluation.

## Future Model Workflow
1. **Upload**: Team uploads a new model artifact or prediction payload.
2. **Versioning**: Models are automatically versioned and displayed as a historical list (e.g., Model v1, Model v2, Model v3).
3. **Evaluation**: The model is run against a test dataset to generate predictions and calculate accuracy.

## Display Elements
- **Upload Date**: Timestamp of when the model was submitted.
- **Active Version**: Visual badge indicating which model is currently considered the primary/active version for the team.
- **Status**:
  - `Training`: Model is currently being processed.
  - `Ready`: Model is evaluated and active.
  - `Failed`: An error occurred during evaluation.

## Metric Constraints
- **No Fake Metrics**: Performance metrics (accuracy, loss) must **never** be mocked or shown as placeholders.
- Metrics are strictly hidden until the evaluation state reaches `Ready`.
