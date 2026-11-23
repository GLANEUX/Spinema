#!/usr/bin/env bash
# Connects the staging API to Brevo, so it sends real emails. Run it yourself:
#   ./scripts/set-staging-smtp.sh
# Asks for the SMTP login and key shown in Brevo (SMTP & API > SMTP). The key stays on the
# server (/opt/spinema-staging/.env). Also turns on the email check at sign-up.
# Needs: the "vps2" SSH alias (root).
set -euo pipefail

SERVER="${SERVER:-vps2}"
DIR=/opt/spinema-staging

read -rp "Identifiant SMTP Brevo (finit par @smtp-brevo.com) : " SMTP_USER
read -rsp "Clé SMTP Brevo (ne s'affiche pas) : " SMTP_PASSWORD; echo
[[ "$SMTP_USER" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+$ ]] || { echo "Identifiant refusé." >&2; exit 1; }
[[ "$SMTP_PASSWORD" =~ ^[A-Za-z0-9_-]{16,256}$ ]] || { echo "Clé refusée : lettres, chiffres, - ou _." >&2; exit 1; }

# The key goes through stdin, never on a command line.
ssh "$SERVER" "DIR=$DIR bash -s" <<REMOTE
set -euo pipefail
ENV="\$DIR/.env"
sed -i '/^\(SMTP_HOST\|SMTP_PORT\|SMTP_USER\|SMTP_PASSWORD\|REQUIRE_EMAIL_VERIFICATION\)=/d' "\$ENV"
cat >> "\$ENV" <<VARS
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=$SMTP_USER
SMTP_PASSWORD=$SMTP_PASSWORD
REQUIRE_EMAIL_VERIFICATION=true
VARS
chown spinema:spinema "\$ENV"; chmod 600 "\$ENV"
cd "\$DIR"
if grep -q '^BETTER_AUTH_SECRET=' "\$ENV" && grep -q 'SMTP_HOST' docker-compose.yml; then
  su -s /bin/bash spinema -c "docker compose up -d api" >/dev/null 2>&1 && echo "Brevo branché : l'API du staging envoie les e-mails."
else
  echo "Brevo enregistré : actif au prochain déploiement du staging."
fi
REMOTE
