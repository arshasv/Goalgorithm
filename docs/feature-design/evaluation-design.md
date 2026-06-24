# Evaluation UX Design

## Overview
Evaluations cover both Technical and Presentation scoring. These features are restricted to Organizers and Judges.

## Technical Evaluation
**Screens**:
- **Evaluator Entry**: A form listing all technical criteria (e.g., Architecture, Code Quality).
- **Criteria Based Marking**: Input fields constrained to the maximum marks allowed for each specific criterion.
- **Score Summary**: A read-only summary card displaying the total score.

**Display Constraints**:
- Must clearly show: `[Criterion Score] / [Max Marks]`.
- Must show the normalized value translated to the final leaderboard contribution (e.g., scaled to 20 marks).

## Presentation Evaluation
**Features**:
- Support for multiple judges.
- Support for multiple rounds (e.g., Round 1, Round 2).
- Dynamic criteria based on the scoring configuration.

**Visualization Constraints**:
- **Progress Bars**: Scores like "8 / 10" must be visually represented by a progress bar filled to 80%. Empty bars are not permitted.
- **Multiple Rounds**: Displayed sequentially (Round 1, Round 2, Round 3).
- **Score Aggregation**: Display `Total Raw Score / Total Possible Marks` (e.g., 120 / 150).
- **Final Output**: Clearly show the Normalized Final Score after all multipliers and weights are applied.
