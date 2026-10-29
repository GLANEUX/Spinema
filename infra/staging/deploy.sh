#!/usr/bin/env bash
# Runs on the server as the "spinema" user: it is the forced command of the CI deploy key
# (see infra/staging/README.md), so the CI cannot run anything else.
# stdin: a GHCR token on the first line, then a .tar.gz of the stack files.
set -euo pipefail
cd /opt/spinema-staging

IFS= read -r TOKEN
# The archive never overwrites the secrets nor this script.
tar -xz --no-same-owner --no-same-permissions --exclude=.env --exclude=deploy.sh -f -

# Throwaway Docker config: the token is not kept on the server.
DOCKER_CONFIG="$(mktemp -d)"
export DOCKER_CONFIG
trap 'rm -rf "$DOCKER_CONFIG"' EXIT
printf '%s' "$TOKEN" | docker login ghcr.io -u spinema --password-stdin >/dev/null

docker compose pull --quiet
docker compose up -d --remove-orphans --wait --wait-timeout 120
curl -fsS http://127.0.0.1:3100/health
echo
echo "$(date -Is) staging déployé"
