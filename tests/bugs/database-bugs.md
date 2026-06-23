# Database Quality - Bugs Log

## Bug BUG-DB-001
- **Severity**: MEDIUM
- **Category**: Database Indexing
- **Affected File**: [team.py](file:////home/user/Desktop/FIFA_scoring/fifa-scoring-system/backend/app/models/team.py)
- **Affected Code**:
```python
team_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("teams.id"))
```
- **Issue Description**: Lack of explicit database indexes on relation foreign keys.
- **Production Risk**: Degrading list queries and query execution bottlenecks under larger volumes of member entries.
- **Fix Description**: Set index=True explicitly on team_id and other related foreign keys in schema model definitions.
- **Corrected Code**:
```python
team_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("teams.id"), index=True)
```

---
