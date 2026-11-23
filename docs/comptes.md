# Comptes (étape 3) : le contrat entre l'API, les e-mails et l'app

Référence commune pour l'API, les e-mails et l'app. Les règles de sécurité viennent de [PLAN.md §8](../PLAN.md).

## Bibliothèque

- **Better Auth 1.7.27** (au moins), monté dans Fastify sous **`/api/auth/*`**, adaptateur Drizzle (PostgreSQL).
- Plugins serveur : `username` (le pseudo), `haveIBeenPwned` (mots de passe fuités), `expo` (`@better-auth/expo`).
- Côté app : `createAuthClient` avec `expoClient` (`@better-auth/expo/client`) et `usernameClient`. La session est rangée dans **`expo-secure-store`**.

## Champs d'un compte

| Champ        | Où                                            | Règle                                                                                                                                                       |
| ------------ | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `email`      | `user.email`                                  | e-mail valide, unique, vérifié avant la première connexion                                                                                                  |
| `username`   | `user.username` (plugin `username`)           | le **pseudo** : 3 à 20 caractères, lettres, chiffres, `_`, `.` et `-` ; unique sans tenir compte des majuscules ; affiché tel que saisi (`displayUsername`) |
| `name`       | `user.name`                                   | exigé par Better Auth : on y met le pseudo                                                                                                                  |
| `birthDate`  | `user.birthDate` (champ ajouté, `YYYY-MM-DD`) | obligatoire, **15 ans minimum** (`isOldEnough` dans `packages/shared`), jamais montré aux autres                                                            |
| mot de passe | table `account` (empreinte)                   | **12 à 128 caractères**, aucune règle de composition, refusé s'il a fuité (Have I Been Pwned)                                                               |

## Parcours et routes Better Auth

| Parcours              | Route                                                                                       | Détail                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Inscription           | `POST /api/auth/sign-up/email`                                                              | `{ email, password, name, username, birthDate }`. Envoie l'e-mail de vérification. Pas de connexion avant la vérification. |
| Vérification          | lien de l'e-mail → `GET /api/auth/verify-email?token=…&callbackURL=<app>`                   | puis retour dans l'app (`<schéma>://connexion?verifie=1`)                                                                  |
| Connexion             | `POST /api/auth/sign-in/email` ou `/sign-in/username`                                       | message identique quel que soit le problème : « E-mail ou mot de passe incorrect. »                                        |
| Mot de passe oublié   | `POST /api/auth/request-password-reset` `{ email, redirectTo: "<schéma>://reinitialiser" }` | réponse identique que l'e-mail existe ou non ; lien valable 1 h, à usage unique                                            |
| Nouveau mot de passe  | `POST /api/auth/reset-password` `{ newPassword, token }`                                    | déconnecte toutes les autres sessions                                                                                      |
| Déconnexion           | `POST /api/auth/sign-out`                                                                   |                                                                                                                            |
| Suppression du compte | `POST /api/auth/delete-user` `{ password }`                                                 | supprime tout (voir PLAN.md §1 _Cycle de vie_)                                                                             |

**Schémas de l'app** (liens profonds), selon la variante : `spinema` (prod), `spinema-preview` (préprod), `spinema-development` (dev). Ils sont dans `trustedOrigins`.

## Routes Spinema (session obligatoire)

| Route                            | Rôle                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------- |
| `GET /me`                        | profil : `{ id, email, username, displayUsername, age, personalSpaceId }` (l'âge, jamais la date) |
| `GET /me/blocks`                 | pseudos bloqués                                                                                   |
| `POST /me/blocks` `{ username }` | bloquer (pseudo exact)                                                                            |
| `DELETE /me/blocks/:username`    | débloquer                                                                                         |

Erreurs au format habituel de l'API : `{ code, message }`, message en français.

## Temps réel

Socket.IO authentifie à la connexion : l'en-tête `Cookie` de la session (l'app le récupère avec `authClient.getCookie()` et l'envoie en `extraHeaders`). Sans session valide, la connexion est refusée (`UNAUTHORIZED`).

## Base de données

- Tables Better Auth : `user`, `session`, `account`, `verification`, `rate_limit` (limites stockées en base).
- `space` : `id`, `kind` (`personal` | `salon`), `name`, `owner_id` → `user` (**suppression en cascade**), `created_at`. Un espace perso est créé à l'inscription.
- `block` : `blocker_id`, `blocked_id` → `user` (cascade), clé primaire sur le couple.

## E-mails

- Module `apps/api/src/mail/` : `createMailer(env)` renvoie `{ send({ to, subject, text, html }) }`.
- **SMTP** si `SMTP_HOST` est défini (Brevo en staging et en prod, **Mailpit** en développement : interface sur http://127.0.0.1:8025). Sinon, transport **journal** : l'e-mail est écrit dans les logs, sans le lien en clair en production.
- Modèles en français, texte et HTML aux couleurs de la charte : `verificationEmail({ username, url })`, `resetPasswordEmail({ username, url })`, `accountDeletedEmail({ username })`.
- Expéditeur : `MAIL_FROM` (par défaut `Spinema <noreply@spinema.fr>`).

## Variables d'environnement

| Variable                                                            | Rôle                                                                                 |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `BETTER_AUTH_SECRET`                                                | secret de signature, 32 caractères minimum                                           |
| `BETTER_AUTH_URL`                                                   | adresse publique de l'API (ex. `https://api.staging.<domaine>`)                      |
| `REQUIRE_EMAIL_VERIFICATION`                                        | `true` par défaut ; `false` possible sur le staging tant que Brevo n'est pas branché |
| `PWNED_PASSWORD_CHECK`                                              | `true` par défaut ; `false` dans les tests (pas d'appel réseau)                      |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` | e-mails                                                                              |
