#!/usr/bin/env bash
# Checks that the latest dump can be restored, in a throwaway Postgres container.
# Run it from time to time (or weekly from cron): ./infra/backup/restore-test.sh
set -euo pipefail
cd "$(dirname "$0")/../.."

LATEST="$(ls -1t backups/spinema-*.sql.gz | head -n 1)"
NAME="spinema-restore-test-$$"
trap 'docker rm -f "$NAME" >/dev/null 2>&1 || true' EXIT

docker run -d --name "$NAME" -e POSTGRES_PASSWORD=restore -e POSTGRES_DB=spinema postgres:17-alpine >/dev/null
until docker exec "$NAME" pg_isready -U postgres -d spinema >/dev/null 2>&1; do sleep 1; done
gunzip -c "$LATEST" | docker exec -i "$NAME" psql -q -v ON_ERROR_STOP=1 -U postgres -d spinema >/dev/null
TABLES="$(docker exec "$NAME" psql -tA -U postgres -d spinema -c "select count(*) from information_schema.tables where table_schema in ('public','drizzle')")"
echo "$(date -Is) restauration OK : $LATEST ($TABLES tables)"
