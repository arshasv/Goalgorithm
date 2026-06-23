# FastAPI Best Practices - Bugs Log

## Bug BUG-FBP-001
- **Severity**: HIGH
- **Category**: Security / Config
- **Affected File**: [main.py](file:////home/user/Desktop/FIFA_scoring/fifa-scoring-system/backend/app/main.py)
- **Affected Code**:
```python
app.add_middleware(CORSMiddleware, allow_origins=["*"], ...)
```
- **Issue Description**: Configuring wildcard CORS origins (`*`) opens the API to cross-site request attacks in public environments.
- **Production Risk**: Cross-origin data access leaks and elevated vulnerability to client-side request forgery.
- **Fix Description**: Load explicit allowed origins from environment settings and validate against the incoming request headers.
- **Corrected Code**:
```python
app.add_middleware(CORSMiddleware, allow_origins=settings.allowed_origins, allow_credentials=True, ...)
```

---
## Bug BUG-FBP-002
- **Severity**: MEDIUM
- **Category**: Lifecycle Management
- **Affected File**: [main.py](file:////home/user/Desktop/FIFA_scoring/fifa-scoring-system/backend/app/main.py)
- **Affected Code**:
```python
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
```
- **Issue Description**: Creating tables dynamically during app startup lifecycle bypasses Alembic's version tracking.
- **Production Risk**: Table initialization collisions under concurrent container scales and undocumented schema drift.
- **Fix Description**: Remove the `create_all` database initialization from standard lifespan startup and execute migrations externally.
- **Corrected Code**:
```python
async def lifespan(_app: FastAPI):
    # Connection logging / warming only; tables handled by migration scripts
    yield
```

---
