Score: 75/100
Status: WARNING
Critical Issues:
- Direct database queries (`db.query`) executed directly inside route handler functions (e.g. `team_routes.py` and `scoring_routes.py`) violating the clean architecture boundary.
- Single Responsibility Principle (SRP) violations due to routers handling validation, parsing, database access, and spreadsheet parsing concurrently.

Recommendations:
- Extract database access logic into a separate repository or data-access service layer.
- Refactor routes to only serve as HTTP entrypoints (parsing schema inputs and routing to appropriate service handlers).
