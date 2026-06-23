# Security Testing - Bugs Log

## Bug BUG-SEC-001
- **Severity**: HIGH
- **Category**: Information Leak / Secrets
- **Affected File**: [config.py](file:////home/user/Desktop/FIFA_scoring/fifa-scoring-system/backend/app/config.py)
- **Affected Code**:
```python
self.secret_key: str = os.environ.get("SECRET_KEY", "development_secret_key")
```
- **Issue Description**: Default development fallbacks committed in config.py allow deployments to run insecurely if settings are misconfigured.
- **Production Risk**: Compromised JWT token validation and administrative session hijacking.
- **Fix Description**: Raise a `ValueError` if the environment is `production` and critical secrets are missing.
- **Corrected Code**:
```python
self.secret_key = os.environ.get("SECRET_KEY")
if self.environment == "production" and not self.secret_key:
    raise ValueError("SECRET_KEY must be configured in production!")
```

---
