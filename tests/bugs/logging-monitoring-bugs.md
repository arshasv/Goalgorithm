# Logging and Monitoring Quality - Bugs Log

## Bug BUG-LM-001
- **Severity**: MEDIUM
- **Category**: Logging / Observability
- **Affected File**: [main.py](file:////home/user/Desktop/FIFA_scoring/fifa-scoring-system/backend/app/main.py)
- **Affected Code**:
```python
import logging
logger = logging.getLogger(__name__)
```
- **Issue Description**: Plaintext log outputs without standard JSON envelopes complicate parsing in cloud-native log engines.
- **Production Risk**: Delayed detection of production application errors and manual stack tracing.
- **Fix Description**: Configure python-json-logger to format outputs in JSON standard structures.
- **Corrected Code**:
```python
from pythonjsonlogger import jsonlogger
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter('%(asctime)s %(levelname)s %(message)s')
logHandler.setFormatter(formatter)
```

---
