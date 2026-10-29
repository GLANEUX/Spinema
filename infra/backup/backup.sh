#!/usr/bin/env bash
# Daily PostgreSQL dump, run by cron on the server from the stack folder:
#   15 3 * * * cd /opt/spinema && ./infra/backup/backup.sh >> backups/backup.log 2>&1
# Keeps the last 14 dumps. Copy the backups/ folder off the server (rclone, rsync…) to be safe.
set -euo pipefail
cd "$(dirname "$0")/../.."
set -a; source .env; set +a

DIR="backups"
KEEP="${BACKUP_KEEP:-14}"
FILE="$DIR/spinema-$(date +%Y%m%d-%H%M%S).sql.gz"
mkdir -p "$DIR"

docker compose exec -T db pg_dump -U "${POSTGRES_USER:-spinema}" -d "${POSTGRES_DB:-spinema}" --no-owner | gzip > "$FILE.tmp"
mv "$FILE.tmp" "$FILE"
ls -1t "$DIR"/spinema-*.sql.gz | tail -n +"$((KEEP + 1))" | xargs -r rm --
echo "$(date -Is) sauvegarde $FILE ($(du -h "$FILE" | cut -f1))"
