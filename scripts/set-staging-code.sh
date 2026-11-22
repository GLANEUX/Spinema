#!/usr/bin/env bash
# Sets (or changes) the access code of the staging site. Run it yourself:
#   ./scripts/set-staging-code.sh
# The code stays on the server (/opt/spinema-staging/.env). Changing it logs everyone out.
# Needs: the "vps2" SSH alias (root).
set -euo pipefail

SERVER="${SERVER:-vps2}"
DIR=/opt/spinema-staging

read -rsp "Nouveau code d'accès au staging (6 caractères minimum, lettres, chiffres, - ou _) : " CODE; echo
read -rsp "Encore une fois : " CODE2; echo
[[ "$CODE" == "$CODE2" ]] || { echo "Les codes ne correspondent pas." >&2; exit 1; }
[[ "$CODE" =~ ^[A-Za-z0-9_-]{6,64}$ ]] || { echo "Code refusé : 6 à 64 caractères, lettres, chiffres, - ou _." >&2; exit 1; }

# The code goes through stdin, never on a command line.
ssh "$SERVER" "DIR=$DIR bash -s" <<REMOTE
set -euo pipefail
CODE='$CODE'
ENV="\$DIR/.env"
sed -i '/^STAGING_ACCESS_CODE=/d' "\$ENV"
echo "STAGING_ACCESS_CODE=\$CODE" >> "\$ENV"
# Cookie signing secret: generated once, kept afterwards.
grep -q '^GATE_SECRET=' "\$ENV" || echo "GATE_SECRET=\$(openssl rand -hex 32)" >> "\$ENV"
chown spinema:spinema "\$ENV"; chmod 600 "\$ENV"
cd "\$DIR"
if [ -f infra/staging/gate/server.mjs ]; then
  su -s /bin/bash spinema -c "docker compose up -d --force-recreate gate web" >/dev/null 2>&1 && echo "Code appliqué : la page demande le nouveau code."
else
  echo "Code enregistré : il sera actif au prochain déploiement du staging."
fi
REMOTE
