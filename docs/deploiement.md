# Déploiement et versions

Comment Spinema passe du code au téléphone : branches, staging, Google Play, secrets et sauvegardes.

## Le circuit

```
pull request ──► dev ──► preprod ──► main
                  │         │          │
             vérifications  │          ├─ APK et AAB de prod signés, release v<version>
                            │          └─ image Docker :main
                            ├─ image Docker :preprod, puis déploiement du staging
                            └─ APK « Spinema préprod », release preprod-latest
```

- Toutes les modifications passent par une **pull request vers `dev`**, avec la CI verte.
- **`dev` → `preprod`** quand on veut tester une version : on pousse `dev` sur `preprod`.
- **`preprod` → `main`** pour la production, après avoir augmenté `version` dans [apps/mobile/app.config.ts](../apps/mobile/app.config.ts).
- Les builds Android prennent environ 25 minutes et ne tournent que sur `preprod` et `main`. Un build manuel sur `preprod` est possible : Actions > Android > Run workflow.

## Les trois variantes de l'app

| Variante      | Nom affiché     | Package                  | Où                                                      |
| ------------- | --------------- | ------------------------ | ------------------------------------------------------- |
| développement | Spinema dev     | `fr.spinema.app.dev`     | Expo Go, sur le PC                                      |
| préprod       | Spinema préprod | `fr.spinema.app.preview` | release `preprod-latest`, s'installe à côté de la vraie |
| production    | Spinema         | `fr.spinema.app`         | Google Play                                             |

L'adresse de l'API de chaque variante vient des variables GitHub `API_URL_PREVIEW` et `API_URL_PRODUCTION`.

## Staging

- **Adresses** : `staging.<domaine>` (page web) et `api.staging.<domaine>` (API). Elles ne sont pas écrites ici : demande-les à la mainteneuse.
- **Code d'accès** : la page web demande un code, que le navigateur retient 30 jours. Le service [infra/staging/gate](../infra/staging/gate) le vérifie, et 5 essais ratés bloquent l'adresse IP pendant 15 minutes. `assetlinks.json` et l'API restent publics. Pour choisir ou changer le code : `./scripts/set-staging-code.sh` (changer le code déconnecte tout le monde).
- **La stack**, décrite dans [infra/staging/docker-compose.yml](../infra/staging/docker-compose.yml), n'écoute qu'en local sur le serveur. Le Nginx du serveur fait le HTTPS (Let's Encrypt) et le relais.
- **Déploiement** : le job « Deploy staging » de la CI envoie les fichiers et lance [infra/staging/deploy.sh](../infra/staging/deploy.sh), avec une clé SSH qui ne peut lancer que ce script.
- **Le serveur héberge d'autres services en production** : on n'ajoute qu'un fichier de site Nginx, on lance `nginx -t` avant chaque rechargement, et on ne redémarre aucun autre service.

### Mise en place (une seule fois)

1. Créer deux entrées DNS de type A, `staging.<domaine>` et `api.staging.<domaine>`, vers l'IP du serveur.
2. Lancer `./scripts/setup-staging-server.sh <domaine>`. Le script crée l'utilisateur `spinema`, le dossier de la stack et son `.env` (mot de passe de la base généré sur place), la clé de déploiement, la sauvegarde quotidienne, le site Nginx avec HTTPS, ainsi que les secrets et variables GitHub.
3. Choisir le code d'accès : `./scripts/set-staging-code.sh`.

Pour suivre les logs sur le serveur, depuis le dossier de la stack : `docker compose logs -f api`.

## Google Play

- **Signature** : la clé d'envoi se crée une fois, avec `./scripts/create-android-keystore.sh`. Garder le fichier `.jks` et son mot de passe hors du PC : sans eux, plus de mise à jour possible. Google Play signe ensuite l'app avec sa propre clé (« Signature d'application par Google Play »).
- **`assetlinks.json`** contient les empreintes des deux clés, pour que les liens d'invitation ouvrent l'app.
- **Publication** : la release `v<version>` contient le fichier `.aab`, à importer dans la Play Console (test interne, puis test fermé, puis production).

## Secrets

Les secrets sont rangés dans des **environnements GitHub protégés** :

| Environnement | Contenu                  | Branches autorisées |
| ------------- | ------------------------ | ------------------- |
| `release`     | clé de signature Android | `preprod`, `main`   |
| `staging`     | clé SSH de déploiement   | `preprod`           |

Les scripts y écrivent directement. Pour déplacer d'anciens secrets du dépôt vers ces environnements : `./scripts/move-secrets-to-environments.sh`.

## Sauvegardes

- Chaque nuit, [infra/backup/backup.sh](../infra/backup/backup.sh) sauvegarde la base et garde les 14 dernières copies.
- [infra/backup/restore-test.sh](../infra/backup/restore-test.sh) vérifie que la dernière sauvegarde se restaure bien, dans une base jetable.
- À faire : copier aussi les sauvegardes hors du serveur (voir [TODO.md](../TODO.md)).
