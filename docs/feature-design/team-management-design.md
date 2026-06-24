# Team Management UX Design

## Overview
Team Management allows Organizers to onboard, configure, and monitor participating teams in the GOALGORITHM platform.

## Screens
1. **Team List**: A tabular view of all teams, displaying team name, code, assigned Team Leader, and quick action buttons.
2. **Team Creation**: A modal or dedicated form for adding a new team. Requires team name, code, and optional leader assignment.
3. **Team Editing**: An interface to modify existing team details, including updating the team leader.
4. **Team Details**: A comprehensive view of a specific team's progress, members, and historical scores.

## Required States
- **Empty Teams**: If no teams exist, an empty state illustration is shown with a clear call-to-action button: "Add First Team".
- **Loading Teams**: Skeleton loaders are displayed in the table rows while data is being fetched.
- **Delete Confirmation**: A destructive action modal requires explicit confirmation before a team can be deleted, warning about cascaded data loss.
- **Success/Error Messages**: Toast notifications provide immediate feedback (e.g., "Team successfully updated!" or "Error: Team code must be unique.").
