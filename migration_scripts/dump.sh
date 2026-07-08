export PGPASSWORD=fifa_password

pg_dump \
-h localhost \
-p 5433 \
-U fifa_user \
-d fifa_scoring_db \
-F c \
-b \
-v \
-f fifa_scoring_db.dump
