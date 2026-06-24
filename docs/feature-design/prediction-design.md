# Prediction UX Design

## Overview
The Prediction flow enables Team Leaders to submit their AI model's match predictions. Organizers can view all predictions, while Team Leaders only see their own.

## Prediction Submission Flow
1. **Select Match**: Team Leader selects an upcoming match from the Matches list.
2. **Enter Prediction**: Team Leader fills out the prediction form (Winner, Scoreline, Probabilities, First Goal, Goal Scorers).
3. **Validate**: Client-side validation ensures all probabilities sum to 100% and scorelines are logical.
4. **Submit**: The payload is sent to the backend.
5. **Confirmation**: A success toast appears, and the prediction status updates.

## Prediction States
- **Draft**: (Future) Saved locally but not yet submitted.
- **Submitted / Pending Validation**: Prediction received but awaiting backend validation.
- **Validated**: Prediction successfully validated by the scoring engine.
- **Invalid**: Prediction failed validation (e.g., conflicting scoreline and winner).
- **Late**: Prediction submitted after the match freeze deadline.
- **Evaluated**: Match is completed and the prediction has been scored.

## Team Leader View Privacy Rules
- For matches, Team Leaders see **only** their own prediction status ("Submitted" or "Not Submitted").
- Team Leaders **must never** see the total count of predictions (e.g., "3/10 submitted") to prevent exposing competitor activity.
