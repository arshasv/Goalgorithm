# Database Quality Testing

## Purpose
This QA skill evaluates the schema design, query structure, indexing efficiency, transaction isolation, and migration quality of the persistence layer. It detects structural flaws, SQL inefficiencies (like N+1 queries), missing constraints, un-indexed tables, transaction hazards, and migration safety concerns to ensure the database operates robustly.

## Files Analyzed
- `backend/app/models/**/*.py` (SQLAlchemy DB schemas)
- `backend/app/services/**/*.py` (DB query execution and transaction patterns)
- `backend/app/database/**/*.py` (Engine configurations, connection pooling)
- `backend/alembic/versions/*.py` (Alembic migration files)

## Checks Performed
1. **Schema Design & Relationships**: Verify database normalization, table layout, appropriate foreign keys, primary keys on all tables, and cascade rule declarations.
2. **Indexing Integrity**: Check if foreign keys, unique keys, and query filters (e.g. `WHERE team_code = ...` or sorting keys) have corresponding indexes to prevent full table scans under load.
3. **Transaction Management Safety**: Audit the lifecycle of DB sessions. Ensure read-write operations run inside robust session contexts, commits are explicit, and transactions are cleanly rolled back in `except` blocks.
4. **N+1 Query Detection**: Inspect ORM relationship loadings. Ensure relationships accessed in loops (e.g., loading predictions with team profiles or matches with scores) are eager loaded using `joinedload` or `selectinload` instead of triggering lazy-loads on each iteration.
5. **Migration Version Control**: Check Alembic migrations folder. Verify all migration versions are sequential, downs/rollback functions are fully implemented, and columns have explicit types and nullability constraints.
6. **Constraint Sufficiency**: Ensure fields containing essential business data have database-level constraints (e.g., unique, check, not null) instead of relying solely on frontend/app-level validators.

## Scoring Criteria
- **90 - 100: Production Grade**: Optimized schema design, explicit indexing on all lookups, transaction block safety, eager loads on relationships, and clean, reversible Alembic migrations.
- **80 - 89: Minor Improvements Needed**: Safe operations, but has minor indexing omissions on rarely queried fields, lazy load warnings on non-nested loops, or slight rollback layout imperfections.
- **70 - 79: Acceptable but Needs Fixes**: Detectable N+1 query patterns, missing foreign key indexes, lazy database connection release, or migrations without rollback code.
- **Below 70: Not Production Ready**: Direct unhandled transaction leaks, missing PKs/FKs, critical queries triggering full table scans, or broken migration chains.

## Point Distribution
- **Schema Design & Constraints - 25 Points**: Normalization, PKs/FKs, DB check constraints, unique fields.
- **Query Efficiency & N+1 Prevention - 30 Points**: Efficient ORM lookups, eager loads, select statements count control.
- **Indexing Quality - 20 Points**: Indexes on filtering keys, joins, and foreign keys.
- **Transactions & Migration Health - 25 Points**: Explicit transaction boundaries, rollback safety, clean Alembic history.

## Failure Conditions
- **Critical Failure (Instant Sub-70 Score)**: A loops-nest query pattern triggering lazy loads for each iteration, causing severe database overhead (N+1 query).
- **Critical Failure (Instant Sub-70 Score)**: Uncaught database connections failing to release back to the pool, leading to connection exhaustion.
- **Critical Failure**: Migration files containing only `upgrade` functions while leaving `downgrade` completely empty or with `pass`.

## Suggested Tools
- `sqlalchemy-explain` / Postgres `EXPLAIN ANALYZE` (Query execution path analyzer)
- `alembic history` (Migration path validator)
- `nplusone` (Python library for detecting N+1 query patterns in SQLAlchemy)

## Final Output Format
The skill must generate:

Score: [Score]/100
Status: [PASS / WARNING / FAIL]

Critical Issues:
- [List of critical database schema/query flaws, if any]

Recommendations:
- [Actionable steps to optimize indexes, refactor queries, or fix transaction issues]
