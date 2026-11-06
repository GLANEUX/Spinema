#!/usr/bin/env bash
# Prepares the staging server for the CI deploys. Run it yourself, from the repo root:
#   ./scripts/setup-staging-server.sh                 # user, folder, deploy key, backups
#   ./scripts/setup-staging-server.sh <domaine>       # same + Nginx site and HTTPS for staging.<domaine>
# Needs: the "vps2" SSH alias (root), gh logged in. Safe to run again.
#
# On the server it only adds things: a "spinema" user (docker group), /opt/spinema-staging,
# a backup cron, and the Nginx site "spinema-staging". Existing sites and services are untouched.
set -euo pipefail
cd "$(dirname "$0")/.."

SERVER="${SERVER:-vps2}"
DOMAIN="${1:-}"
REPO="GLANEUX/Spinema"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

HOST="$(ssh -G "$SERVER" | awk '$1 == "hostname" { print $2 }')"

echo "== Clé de déploiement pour GitHub Actions"
if gh secret list --repo "$REPO" | grep -q '^STAGING_SSH_KEY\b'; then
  echo "Secret STAGING_SSH_KEY déjà présent : clé conservée (supprime le secret pour en refaire une)."
  PUB=""
else
  ssh-keygen -q -t ed25519 -N "" -C "github-actions-spinema-staging" -f "$TMP/deploy"
  PUB="$(cat "$TMP/deploy.pub")"
fi

echo "== Serveur $SERVER ($HOST)"
scp -q infra/staging/deploy.sh "$SERVER:/tmp/spinema-deploy.sh"
# ssh joins its arguments into one command line: quote them (the key contains spaces).
ssh "$SERVER" "bash -s -- $(printf '%q ' "$PUB" "$DOMAIN")" <<'REMOTE'
set -euo pipefail
PUB="$1"; DOMAIN="$2"; DIR=/opt/spinema-staging

id spinema >/dev/null 2>&1 || useradd --system --create-home --shell /bin/bash --groups docker spinema
install -d -o spinema -g spinema -m 750 "$DIR"
install -o root -g root -m 755 /tmp/spinema-deploy.sh "$DIR/deploy.sh" && rm /tmp/spinema-deploy.sh

if [ ! -f "$DIR/.env" ]; then
  (umask 077; printf 'POSTGRES_USER=spinema\nPOSTGRES_PASSWORD=%s\nPOSTGRES_DB=spinema\nLOG_LEVEL=info\nCORS_ORIGINS=http://localhost\n' \
    "$(openssl rand -hex 24)" > "$DIR/.env")
  chown spinema:spinema "$DIR/.env"
  echo ".env créé (mot de passe Postgres généré, il reste sur le serveur)"
fi
if [ -n "$DOMAIN" ]; then
  sed -i "s|^CORS_ORIGINS=.*|CORS_ORIGINS=https://staging.$DOMAIN|" "$DIR/.env"
fi

# The CI key can only run deploy.sh (no shell, no forwarding).
if [ -n "$PUB" ]; then
  install -d -o spinema -g spinema -m 700 /home/spinema/.ssh
  echo "restrict,command=\"$DIR/deploy.sh\" $PUB" > /home/spinema/.ssh/authorized_keys
  chown spinema:spinema /home/spinema/.ssh/authorized_keys
  chmod 600 /home/spinema/.ssh/authorized_keys
fi

echo "15 3 * * * spinema cd $DIR && mkdir -p backups && bash infra/backup/backup.sh >> backups/backup.log 2>&1" > /etc/cron.d/spinema-staging-backup
chmod 644 /etc/cron.d/spinema-staging-backup

if [ -n "$DOMAIN" ]; then
  SITE=/etc/nginx/sites-available/spinema-staging
  if [ ! -f "$SITE" ]; then
    cat > "$SITE" <<NGINX
# Spinema staging (branch preprod). Ports from /opt/spinema-staging/docker-compose.yml.
server {
  server_name staging.$DOMAIN;
  location / {
    proxy_pass http://127.0.0.1:8180;
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}

server {
  server_name api.staging.$DOMAIN;
  location / {
    proxy_pass http://127.0.0.1:3100;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_read_timeout 1h;
  }
}
NGINX
  fi
  ln -sf "$SITE" /etc/nginx/sites-enabled/spinema-staging
  if nginx -t; then
    systemctl reload nginx
  else
    rm /etc/nginx/sites-enabled/spinema-staging
    echo "nginx -t a échoué : site désactivé, rien n'a été rechargé." >&2
    exit 1
  fi
  certbot --nginx --non-interactive --redirect --cert-name spinema-staging \
    -d "staging.$DOMAIN" -d "api.staging.$DOMAIN"
fi
echo "Serveur prêt."
REMOTE

echo "== Secrets et variables GitHub"
if [ -n "$PUB" ]; then
  gh secret set STAGING_SSH_KEY --repo "$REPO" < "$TMP/deploy"
fi
gh variable set STAGING_SSH_HOST --repo "$REPO" --body "$HOST"
gh variable set STAGING_SSH_KNOWN_HOSTS --repo "$REPO" --body "$(ssh-keyscan -t ed25519 "$HOST" 2>/dev/null)"
if [ -n "$DOMAIN" ]; then
  gh variable set API_URL_PREVIEW --repo "$REPO" --body "https://api.staging.$DOMAIN"
fi
echo "Terminé. Le prochain push sur preprod déploiera le staging."
