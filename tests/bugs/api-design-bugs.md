# API Design and REST Standards - Bugs Log

## Bug BUG-API-001
- **Severity**: MEDIUM
- **Category**: API Standards
- **Affected File**: [team_routes.py](file:////home/user/Desktop/FIFA_scoring/fifa-scoring-system/backend/app/api/team_routes.py)
- **Affected Code**:
```python
@router.get("")
def list_teams(db: Session = Depends(get_db)):
```
- **Issue Description**: Listing routes load the entire table dataset from database without pagination.
- **Production Risk**: Response payload sizes and database memory consumption inflate as database collections scale.
- **Fix Description**: Add page query limits and offsets parameters, returning standard response wrappers.
- **Corrected Code**:
```python
@router.get("")
def list_teams(limit: int = 20, offset: int = 0, db: Session = Depends(get_db)):
    return db.query(TeamModel).limit(limit).offset(offset).all()
```

---
