# Database Quality

## Purpose
Assess SQLAlchemy models design, relationships, indexes, query optimizations, N+1 query patterns, and Alembic migrations safety.

## Files Analyzed
- backend/app/models/**/*.py
- backend/app/services/**/*.py
- backend/alembic/versions/*.py

## Checks Performed
- Check database index placement on foreign keys and frequently filtered columns.
- Detect N+1 queries by auditing database loading strategies in loops.
- Ensure correct Alembic migration scripts sequencing and downgrade safety.
- Verify transactional boundary isolation (proper rollback setups).

## Scoring Criteria
90-100: Production Grade
80-89: Minor improvements needed
70-79: Acceptable but needs fixes
Below 70: Not production ready

## Point Distribution
Schema & Index Design - 35 points
Query Performance (N+1) - 35 points
Migrations & Transactions - 30 points

## Failure Conditions
- Critical N+1 queries executing queries in large iteration blocks.
- Alembic migration files containing empty downgrade functions.
- Leaked database connections.

## Suggested Tools
sqlalchemy-explain, alembic, nplusone

## Final Output Format
Score: XX/100
Status: PASS / WARNING / FAIL
Critical Issues:
Recommendations:
