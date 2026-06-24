# Reports UX Design

## Overview
The Reports module is an Organizer-only feature designed to make the complex scoring transformations entirely transparent and understandable for non-technical users.

## Score Journey UI
The interface visualizes exactly how a team's raw marks translate into their final leaderboard ranking through a clear, top-to-bottom flow.

### Journey Flow
`Original Score` 
  ↓ 
`Converted Score (Normalization)`
  ↓ 
`After Multiplier (Grade Multipliers)`
  ↓ 
`Final Contribution (Leaderboard Score)`

### Terminology Rules
To ensure clarity for non-technical organizers, backend jargon is replaced in the UI:
- Avoid "Raw Score" → Use **Original Score**
- Avoid "Weighted" → Use **After Multiplier**
- Avoid "Normalized" → Use **Converted Score** or **Leaderboard Contribution**

### Color Coding
- **Blue**: Used to represent the Original Marks.
- **Muted Gold**: Used to represent the Final Contribution.
- **Gray**: Used for small informational text explaining the formulas (e.g., *"AI prediction scores are scaled to 20 marks"*).
