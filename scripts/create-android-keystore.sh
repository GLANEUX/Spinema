#!/usr/bin/env bash
# Creates the Android signing key and stores it as GitHub secrets for the "Android" workflow.
# Run it yourself, once: ./scripts/create-android-keystore.sh
# Keep a copy of the .jks file and its password somewhere safe (password manager):
# losing them means the Play Store app can no longer be updated.
set -euo pipefail

OUT="${1:-$HOME/spinema-upload.jks}"
ALIAS="spinema"

if [[ -e "$OUT" ]]; then
  echo "$OUT existe déjà : je ne l'écrase pas." >&2
  exit 1
fi

read -rsp "Mot de passe du keystore (6 caractères minimum) : " PASS; echo
read -rsp "Encore une fois : " PASS2; echo
[[ "$PASS" == "$PASS2" ]] || { echo "Les mots de passe ne correspondent pas." >&2; exit 1; }
[[ ${#PASS} -ge 6 ]] || { echo "Mot de passe trop court." >&2; exit 1; }

DNAME="CN=Spinema, O=Spinema, C=FR"
if command -v keytool >/dev/null; then
  keytool -genkeypair -v -keystore "$OUT" -alias "$ALIAS" -keyalg RSA -keysize 4096 -validity 10000 \
    -storepass "$PASS" -keypass "$PASS" -dname "$DNAME"
else
  # No JDK installed: use keytool from a Java container.
  docker run --rm -v "$(dirname "$OUT"):/out" eclipse-temurin:21-jre keytool -genkeypair -v \
    -keystore "/out/$(basename "$OUT")" -alias "$ALIAS" -keyalg RSA -keysize 4096 -validity 10000 \
    -storepass "$PASS" -keypass "$PASS" -dname "$DNAME"
  sudo chown "$(id -u):$(id -g)" "$OUT" 2>/dev/null || true
fi
chmod 600 "$OUT"

echo "Envoi des secrets vers GitHub (GLANEUX/Spinema)…"
base64 -w0 "$OUT" | gh secret set ANDROID_KEYSTORE_BASE64 --repo GLANEUX/Spinema
printf '%s' "$PASS" | gh secret set ANDROID_KEYSTORE_PASSWORD --repo GLANEUX/Spinema
printf '%s' "$ALIAS" | gh secret set ANDROID_KEY_ALIAS --repo GLANEUX/Spinema
printf '%s' "$PASS" | gh secret set ANDROID_KEY_PASSWORD --repo GLANEUX/Spinema

echo
echo "Clé créée : $OUT"
echo "Empreinte SHA-256 (à mettre dans apps/web/public/.well-known/assetlinks.json) :"
if command -v keytool >/dev/null; then
  keytool -list -v -keystore "$OUT" -alias "$ALIAS" -storepass "$PASS" | grep 'SHA256:'
else
  docker run --rm -v "$(dirname "$OUT"):/out" eclipse-temurin:21-jre keytool -list -v \
    -keystore "/out/$(basename "$OUT")" -alias "$ALIAS" -storepass "$PASS" | grep 'SHA256:'
fi
echo "Sauvegarde ce fichier et son mot de passe hors de ce PC."
