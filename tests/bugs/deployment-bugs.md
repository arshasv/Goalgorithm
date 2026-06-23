# Deployment Readiness - Bugs Log

## Bug BUG-DEP-001
- **Severity**: HIGH
- **Category**: Deployment / Security
- **Affected File**: [Dockerfile](file:////home/user/Desktop/FIFA_scoring/fifa-scoring-system/Dockerfile)
- **Affected Code**:
```python
FROM python:3.12-slim
WORKDIR /app
...
```
- **Issue Description**: Missing USER instruction; application process runs as root inside container environment.
- **Production Risk**: Elevated risk of host access compromise and container escape in production environments.
- **Fix Description**: Create a dedicated system user and configure execution permissions prior to command launch.
- **Corrected Code**:
```python
RUN useradd -u 1001 appuser && chown -R appuser:appuser /app
USER appuser
CMD ["uvicorn", "app.main:app"]
```

---
