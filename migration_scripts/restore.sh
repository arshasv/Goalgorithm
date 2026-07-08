export PGPASSWORD=3Np9qe3JD86u

pg_restore \
-h db.opentrends.net \
-p 5432 \
-U goalgorithm \
-d goalgorithm_db \
-v \
--clean \
--if-exists \
--no-owner \
--no-privileges \
fifa_scoring_db.dump
