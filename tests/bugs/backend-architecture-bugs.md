# Backend Architecture Quality - Bugs Log

## Bug BUG-BA-001
- **Status**: FIXED
- **Severity**: HIGH
- **Category**: Architecture Violation
- **Affected File**: All API routes in `backend/app/api/` (excluding auth deps in `deps.py`)
- **Affected Code**: Direct DB queries/commits in route handlers (e.g. `db.query(TeamModel)`, `db.commit()`, etc.)
- **Issue Description**: Direct querying of SQLAlchemy database models in API route handlers instead of delegating to a separate repository/service tier.
- **Production Risk**: High coupling, poor testability, and potential schema change synchronization bottlenecks.
- **Fix Description**: Move DB queries to dedicated repositories and services, and call methods through dependency injection.
- **Corrected Code**:
```python
@router.get("")
def list_matches(
    service: MatchService = Depends(),
    _user: UserModel = Depends(get_current_user),
):
    return service.list_matches()
```

### Fix Explanation
- **Files changed**:
  - **Repositories (New/Modified)**:
    - `backend/app/repositories/team_repository.py`
    - `backend/app/repositories/upload_window_repository.py`
    - `backend/app/repositories/leaderboard_repository.py`
    - `backend/app/repositories/prediction_repository.py`
    - `backend/app/repositories/match_repository.py`
    - `backend/app/repositories/score_repository.py`
    - `backend/app/repositories/scoring_config_repository.py`
    - `backend/app/repositories/user_repository.py`
  - **Services (New/Modified)**:
    - `backend/app/services/team_service.py`
    - `backend/app/services/upload_window_service.py`
    - `backend/app/services/leaderboard_service.py`
    - `backend/app/services/prediction_service.py`
    - `backend/app/services/model_submission_service.py`
    - `backend/app/services/match_service.py`
    - `backend/app/services/result_service.py`
    - `backend/app/services/scores_service.py`
    - `backend/app/services/scoring_service.py`
    - `backend/app/services/scoring_config_service.py`
    - `backend/app/services/user_service.py`
  - **Routes (Refactored)**:
    - `backend/app/api/team_routes.py`
    - `backend/app/api/upload_window_routes.py`
    - `backend/app/api/leaderboard_routes.py`
    - `backend/app/api/leaderboard_settings_routes.py`
    - `backend/app/api/prediction_routes.py`
    - `backend/app/api/model_submission_routes.py`
    - `backend/app/api/match_routes.py`
    - `backend/app/api/external_matches_routes.py`
    - `backend/app/api/result_routes.py`
    - `backend/app/api/scores_routes.py`
    - `backend/app/api/scoring_routes.py`
    - `backend/app/api/scoring_config_routes.py`
    - `backend/app/api/auth_routes.py`
    - `backend/app/api/admin_auth_routes.py`
- **Refactor performed**: Decoupled HTTP entrypoints (controller layer) from database persistence (SQLAlchemy ORM layer). Data validation and flow control are now routed through service workflow engines and persisted via the repository boundaries.
- **Tests executed**: Executed backend test suite (`PYTHONPATH=. venv/bin/pytest`) validating that all 183 unit and integration tests successfully pass without regression.


---

