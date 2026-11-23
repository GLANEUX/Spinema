#!/usr/bin/env bash
# Erases the staging containers' logs older than 6 months (privacy policy: "au plus 6 mois").
# Run daily by root (cron set up by scripts/setup-staging-server.sh): Docker log files belong to root.
# Size is capped separately (logging options in docker-compose.yml).
#   ./prune-logs.sh            erase
#   ./prune-logs.sh --dry-run  only list what would be erased
set -euo pipefail

DAYS="${LOG_RETENTION_DAYS:-180}"
DRY_RUN="${1:-}"
CUTOFF=$(date -d "-$DAYS days" +%s)

# Date of a Docker json-file log line, in seconds ("time" is the last field of each line).
line_epoch() {
  local time
  time=$(sed -n 's/.*"time":"\([^"]*\)"}$/\1/p' <<<"$1")
  [ -n "$time" ] && date -d "$time" +%s || echo ""
}

act() {
  if [ "$DRY_RUN" = "--dry-run" ]; then echo "à faire : $*"; else "$@"; echo "fait : $*"; fi
}

for id in $(docker ps -aq --filter label=com.docker.compose.project=spinema-staging); do
  log=$(docker inspect "$id" --format '{{.LogPath}}')
  [ -n "$log" ] || continue
  # Rotated files (.1, .2…): erased once even their newest line is too old.
  for old in "$log".*; do
    [ -f "$old" ] || continue
    newest=$(line_epoch "$(tail -n 1 "$old")")
    if [ -n "$newest" ] && [ "$newest" -lt "$CUTOFF" ]; then act rm -f "$old"; fi
  done
  # Current file: emptied when its oldest line is too old (Docker keeps writing to it).
  if [ -s "$log" ]; then
    oldest=$(line_epoch "$(head -n 1 "$log")")
    if [ -n "$oldest" ] && [ "$oldest" -lt "$CUTOFF" ]; then act truncate -s 0 "$log"; fi
  fi
done
