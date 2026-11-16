#!/usr/bin/env bash
# Moves the GitHub secrets into the protected environments, so that only the release branches
# can read them:
# - "release" (preprod, main): Android signing key
# - "staging" (preprod): SSH deploy key of the staging server (a new key is generated)
# Run it yourself, once, from the repo root: ./scripts/move-secrets-to-environments.sh
# Needs: ~/spinema-upload.jks and its password, the "vps2" SSH alias, gh logged in.
set -euo pipefail
cd "$(dirname "$0")/.."

REPO="GLANEUX/Spinema"
KEYSTORE="${KEYSTORE:-$HOME/spinema-upload.jks}"
ALIAS="spinema"
SERVER="${SERVER:-vps2}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "== Clé de signature Android -> environnement release"
[[ -f "$KEYSTORE" ]] || { echo "$KEYSTORE introuvable." >&2; exit 1; }
read -rsp "Mot de passe du keystore : " PASS; echo
# Checks the password before storing anything.
docker run --rm --user "$(id -u):$(id -g)" -v "$(dirname "$KEYSTORE"):/k" eclipse-temurin:21-jre \
  keytool -list -keystore "/k/$(basename "$KEYSTORE")" -alias "$ALIAS" -storepass "$PASS" >/dev/null \
  || { echo "Mot de passe incorrect : rien n'a été changé." >&2; exit 1; }
base64 -w0 "$KEYSTORE" | gh secret set ANDROID_KEYSTORE_BASE64 --env release --repo "$REPO"
printf '%s' "$PASS" | gh secret set ANDROID_KEYSTORE_PASSWORD --env release --repo "$REPO"
printf '%s' "$ALIAS" | gh secret set ANDROID_KEY_ALIAS --env release --repo "$REPO"
printf '%s' "$PASS" | gh secret set ANDROID_KEY_PASSWORD --env release --repo "$REPO"

echo "== Nouvelle clé de déploiement du staging -> environnement staging"
ssh-keygen -q -t ed25519 -N "" -C "github-actions-spinema-staging" -f "$TMP/deploy"
# Same restrictions as setup-staging-server.sh: the key can only run deploy.sh.
ssh "$SERVER" "cat > /home/spinema/.ssh/authorized_keys && chown spinema:spinema /home/spinema/.ssh/authorized_keys && chmod 600 /home/spinema/.ssh/authorized_keys" \
  <<<"restrict,command=\"/opt/spinema-staging/deploy.sh\" $(cat "$TMP/deploy.pub")"
gh secret set STAGING_SSH_KEY --env staging --repo "$REPO" < "$TMP/deploy"

echo "== Suppression des anciens secrets du dépôt"
for s in ANDROID_KEYSTORE_BASE64 ANDROID_KEYSTORE_PASSWORD ANDROID_KEY_ALIAS ANDROID_KEY_PASSWORD STAGING_SSH_KEY; do
  gh secret delete "$s" --repo "$REPO" 2>/dev/null || true
done

echo
gh secret list --env release --repo "$REPO"
gh secret list --env staging --repo "$REPO"
echo "Terminé. Les secrets ne sont plus lisibles que depuis preprod (et main pour la signature)."
