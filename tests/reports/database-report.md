Score: 82/100
Status: WARNING
Critical Issues:
- Missing explicit indexes on foreign key relationship columns (e.g. `team_members.team_id` or `predictions.team_id`).
- Basic transactions are committed directly inside API routes without standard retries or clean isolation blocks.

Recommendations:
- Add indexes to database columns that are frequently used in filtering and joins to prevent database query performance degradation.
- Wrap database transaction scopes within robust context managers.
