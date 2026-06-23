# Performance Evaluation - Bugs Log

## Bug BUG-PERF-001
- **Severity**: HIGH
- **Category**: Async / Performance
- **Affected File**: [team_routes.py](file:////home/user/Desktop/FIFA_scoring/fifa-scoring-system/backend/app/api/team_routes.py)
- **Affected Code**:
```python
@router.post("/upload-teams")
def upload_teams_csv(file: UploadFile = File(...), ...):
    # Blocking file reads and database writes within loop
```
- **Issue Description**: Using standard synchronous libraries and blocking I/O calls directly within FastAPI async event loop context.
- **Production Risk**: Blocks the entire asyncio event loop, causing massive latency spikes for concurrent API users.
- **Fix Description**: Use synchronous route handler signatures (`def` instead of `async def`) or use async database/file packages.
- **Corrected Code**:
```python
# FastAPI runs synchronous 'def' endpoints in an external worker threadpool automatically
@router.post("/upload-teams")
def upload_teams_csv(file: UploadFile = File(...), ...):
```

---
