# Spinema — Plan du projet

Application Android pour choisir quoi regarder, seul ou à plusieurs : des listes de films **à voir** (perso et communes), des **collections**, des **catégories auto**, une **machine à sous** pour tirer au sort — **en direct sur tous les téléphones du salon, avec un système de vetos** —, un mode **découverte**, et le suivi **vu / pas vu**.

---

## 1. Concepts clés

### Espaces
- **Espace perso** : créé automatiquement à l'inscription, privé, on ne peut pas y inviter. L'app est utilisable seul sans rien configurer.
- **Salons** : créés à la demande (« Nous deux », « Ciné entre potes »), **N membres**. On rejoint un salon par **lien d'invitation** (`https://<domaine>/i/<code>`, ouvre l'app via Android App Links) ou par **invitation via pseudo** (recherche d'utilisateur → invitation à accepter dans l'app).

Un sélecteur en haut de l'app permet de passer d'un espace à l'autre.

### Listes « À voir »
| Liste | Où | Contenu |
|---|---|---|
| **Mon « À voir »** | Espace perso | Tous les films que **j'ai** envie de voir. |
| **« À voir » commun** | Chaque salon | Les films ajoutés directement au salon par ses membres. |
| **Films partagés** | Chaque salon | Les films de mon « À voir » perso que **j'ai choisi de partager** avec ce salon. Le film reste à moi : si je le retire de mon perso ou si je quitte le salon, il disparaît du salon. |

**Partage**
- Par salon, une option **« Partager automatiquement mes nouveaux ajouts »**.
- Sinon, à l'ajout d'un film, des cases à cocher pour choisir les salons avec lesquels le partager (pré-cochées selon l'option auto). Modifiable ensuite depuis la fiche film.
- Si j'ajoute à l'« À voir » commun un film **déjà dans mon perso**, l'app propose de le **partager** plutôt que de créer un doublon.

**Badges « qui l'a ajouté »** — dans un salon, chaque film n'apparaît qu'une fois, avec **un badge par personne** qui l'a ajouté ou partagé. Si Lou et Léa ajoutent toutes les deux *Coraline*, le film porte deux badges : Lou et Léa. Quand quelqu'un quitte le salon, ses films partagés disparaissent et son badge est retiré des autres films.

### Collections
- **Collections personnalisées** dans chaque espace : ex. « DVD » (films qu'on possède), « Soirée horreur », « Films doudous ». Un film peut être dans plusieurs collections.
- **Déjà vus** : automatique, à partir des films marqués vus. Exclue de la roulette par défaut.
- **Catégories auto** : calculées à partir des infos TMDB (voir ci-dessous).

Un film marqué vu reste dans ses collections, grisé avec un badge « Vu ».

### Vu / pas vu
- Simple **booléen par personne** (pour l'instant), global à toute l'app : si je l'ai vu, je l'ai vu dans tous mes espaces.
- Dans un salon : « Vu par Alex et Sam · pas par Lou ».

### Catégories auto
Calculées à la volée à partir des données TMDB. Seules les catégories non vides s'affichent, avec leur nombre de films.

| Critère | Exemples |
|---|---|
| **Genre** | Horreur, Comédie, Science-fiction, Romance… |
| **Type** | Film live, Animation, Documentaire, Court métrage (< 40 min) |
| **Durée** | < 1h30 · 1h30 – 2h · 2h – 2h30 · > 2h30 |
| **Époque** | Années 70, 80, 90, 2000, 2010, 2020 · Avant 1970 · Sorti cette année |
| **Pays / langue** | Français, Coréen, Japonais… |
| **Réalisateur** | Dès 2 films du même réalisateur dans la bibliothèque |
| **Note** | Très bien noté (≥ 7,5 TMDB) |
| **Classification** | Tous publics, -10, -12, -16, -18 (visa CNC via TMDB) |

### Rôles et droits
Le **créateur** du salon est propriétaire. Il peut donner des **droits** aux membres, à la carte :

| Droit | Permet de |
|---|---|
| `invite` | Inviter des personnes |
| `kick` | Exclure un membre |
| `manage_library` | Retirer de l'« À voir » commun un film ajouté par quelqu'un d'autre |
| `manage_collections` | Modifier / supprimer les collections des autres |
| `manage_settings` | Renommer le salon, régler les options du salon |

Sans droit particulier, un membre peut : ajouter des films, partager les siens, créer ses collections, lancer la machine, utiliser ses vetos.

### Âge et classification
- La **date de naissance** est demandée à l'inscription (seul l'âge calculé est affiché, la date reste privée).
- Chaque film a une **classification française** (TMDB `release_dates`, pays FR ; repli sur la classification US convertie ; sinon **« non classé »**).
- Dans les filtres de la machine, la classification se choisit par cases : `Tous publics · -10 · -12 · -16 · -18`. **On ne peut pas cocher une classification au-dessus de son âge** : à 17 ans, la case -18 est grisée.
- **Dans un salon**, la limite est celle du **plus jeune des membres présents** (connectés à la session de tirage) : si Lou a 15 ans et participe, -16 et -18 sont grisés pour tout le monde.
- **Films « non classés »** : recommandation → **exclus dès qu'un mineur est présent**, inclus sinon. C'est le choix prudent, et il concerne surtout de vieux films ou des films étrangers peu distribués. Un badge « non classé » sur la fiche l'indique.
- La même limite s'applique à la **découverte** et à la **recherche** pour un compte mineur (à confirmer, §11).

### Machine à sous
**Deux modes**
- **Tirage normal** (v1) : chaque film a la même chance.
- **Tirage pondéré** (plus tard) : un mode séparé, choisi avant de lancer, où certains films ont plus de chances (🔥 « j'ai très envie », ancienneté dans la liste…).

**Réglages**
1. **Source** (combinables) : « À voir » (commun + partagés dans un salon), collections, catégories auto.
2. **Filtres** : genre(s), type, durée max, période, pays / langue, note minimale, classification (limitée par l'âge, voir ci-dessus).
3. **Déjà vus** — tout décoché par défaut (= personne ne l'a vu) :
   ```
   [ ] Inclure les films déjà vus      ← global, coche / décoche tout
       [ ] vus par Alex
       [ ] vus par Sam
   ```
   Un film est exclu dès qu'un membre **décoché** l'a vu.
4. « **23 films** dans la machine ». La machine ne se lance qu'à partir de **2 films**.

**Tirage**
- Le serveur tire le **film gagnant**, puis un **échantillon aléatoire** du pool (ex. ~30 films dont le gagnant), dans un **ordre mélangé à chaque lancer**. Comme le rouleau défile vite et change à chaque fois, l'échantillonnage ne se voit pas.
- L'animation est calculée pour s'arrêter sur le gagnant.
- **Pas de limite** de relances.

**Résultat**
- Affichage plein écran de l'**affiche**. Un appui ouvre la **fiche complète** : date de sortie, genres, durée, classification, synopsis, réalisateur, casting principal, note, **bande-annonce** (YouTube via TMDB, lue dans l'app), collections où il se trouve (ex. « DVD »).
- Une fois accepté, le film passe **« À l'affiche »** (plutôt que « Prévu ce soir », qui ne marche pas si on regarde le lendemain ou l'après-midi). **Un seul film à l'affiche par salon** : en accepter un nouveau remplace l'ancien (avec confirmation).
- Après la séance : **« Je l'ai vu »** → chaque membre confirme pour lui-même. Le film quitte l'affiche dès qu'un membre l'a confirmé, ou quand quelqu'un le retire. Si personne ne fait rien, rappel au bout de 24 h : « Vous avez vu *Coraline* ? ».
- On peut toujours **rejeter et relancer**.

**Dans un salon : tirage en direct + vetos**
- Celui qui lance ouvre une **séance** et choisit le **nombre de vetos par personne** pour cette séance (ex. 2).
- Les **membres présents** = connectés à la séance. Ils voient tous la machine tourner en même temps (le serveur envoie l'échantillon, l'ordre, le gagnant et l'heure de départ ; chaque téléphone joue la même animation). Les autres reçoivent une **notification** « Alex lance la machine ! » et peuvent rejoindre en cours de séance.
- Quand le film s'affiche, chaque présent choisit **👍 OK** ou **✋ Veto**.
  - **Un seul veto suffit** : le film est écarté, sans contestation possible.
  - **Si tous les présents mettent un veto** sur le même film, le film est écarté et **tout le monde récupère son veto**.
  - Quelqu'un qui n'a plus de veto ne peut que voter OK.
- Un film écarté **ne revient plus de la séance**. Un vote reste ouvert jusqu'au lancer suivant.
- Tout le monde a voté OK → le film passe **à l'affiche** et la séance se termine.

**Dans l'espace perso** : tirage **local** (pas de serveur, pas de veto), boutons *Accepter* / *Rejeter et relancer*.

---

## 2. Fonctionnalités

### MVP (v1)
| # | Fonctionnalité | Détail |
|---|---|---|
| 1 | **Comptes** | Inscription / connexion : email + **pseudo unique** + mot de passe + **date de naissance**. Espace perso créé automatiquement. Vérification email et mot de passe oublié dès que le SMTP est en place (§11). |
| 2 | **Salons** | Création, invitation par lien (App Links) ou par pseudo, rejoindre, quitter, rôles et droits. |
| 3 | **À voir + partage** | Recherche TMDB → ajout à mon « À voir » ou à l'« À voir » commun d'un salon. Partage auto ou manuel (cases à cocher), badges « ajouté par » par personne. |
| 4 | **Collections** | Créer / renommer / supprimer, un film dans plusieurs collections. |
| 5 | **Vu / Pas vu** | Booléen par personne, « Déjà vus », badges par membre. |
| 6 | **Catégories auto** | Genre, type, durée, époque, pays, réalisateur, note, classification. |
| 7 | **Machine à sous** | Tirage normal. Source + filtres + classification limitée par l'âge + cases « déjà vus », échantillon aléatoire, ordre mélangé, min. 2 films, tirage local (perso) ou séance en direct (salon) avec vetos, « À l'affiche », fiche film avec bande-annonce. |
| 8 | **Découverte** | Tendances, populaires, par genre / année, recherche. Ajout ou « Déjà vu » depuis la fiche. |
| 9 | **Notifications push** | Séance lancée, invitation reçue, rappel « Vous l'avez vu ? ». |

### Plus tard (à garder en tête)
- **Synchro Letterboxd** par pseudo (§3).
- **Partage depuis TikTok / Instagram** : *Partager → Spinema* sur une vidéo, identification du film (légende + recherche TMDB, IA si besoin), confirmation, ajout à « À voir ». Android : intent filter `ACTION_SEND`.
- **Tirage pondéré** : mode séparé (🔥 « j'ai très envie », ancienneté, pénalité des films récemment écartés).
- **Roulettes à thème** : réglages enregistrés sous un nom (« Dimanche doudou » = Animation + déjà vus inclus) et thèmes prêts à l'emploi.
- **Mode Swipe** : chacun swipe, match → ajout à l'« À voir » commun.
- **Journal de visionnage** (dates, revisionnages) à la place du booléen.
- Où regarder (plateformes, région FR), stats, séries TV, version iOS, Google Sign-In.

---

## 3. Synchro Letterboxd par pseudo — *plus tard, pas dans la v1*

Noté ici pour ne pas perdre la réflexion. Le reste de l'app est conçu pour l'accueillir sans refonte : la table `watched` a déjà une colonne `source`, et on y ajoutera les champs Letterboxd le moment venu.

Letterboxd n'a pas d'API publique, mais les pages des profils publics sont lisibles avec seulement le pseudo. Le plan :

| Étape | Source | Contenu |
|---|---|---|
| **Import initial** (au moment où on renseigne son pseudo) | Pages publiques `letterboxd.com/<pseudo>/films/page/N/` | **Tous** les films vus (~72 par page), avec la note. Lu côté serveur, page par page. |
| **Synchro auto** (toutes les quelques heures) | Flux RSS public `letterboxd.com/<pseudo>/rss/` | Les ~50 dernières entrées du journal, avec l'**ID TMDB** directement inclus → pas de correspondance approximative. |
| **Resynchro complète** (bouton manuel + 1×/semaine) | Pages `/films/` | Rattrape les films marqués vus sans entrée dans le journal (non présents dans le RSS). |

- Le travail est fait par un **job planifié de l'API** (pg-boss), pas par le téléphone, donc ça tourne même app fermée.
- Correspondance avec TMDB : par l'ID TMDB quand il est disponible (RSS), sinon par le slug Letterboxd / titre + année, avec mise en cache.
- Un film vu sur Letterboxd est ajouté à « Déjà vus » et sort automatiquement de la roulette (sauf si « inclure les déjà vus » est activé).
- On ne supprime jamais un « vu » marqué dans l'app à cause de Letterboxd.

**Points d'attention** :
- Le profil Letterboxd doit être **public**.
- Lire les pages du site est une zone grise des conditions d'utilisation de Letterboxd, et le site peut bloquer ou changer sa structure. On reste raisonnable : un usage perso, peu de requêtes, un délai entre les pages. **Solution de secours** déjà prévue : importer le fichier CSV d'export Letterboxd (`watched.csv`) si la lecture des pages ne fonctionne plus. Le RSS, lui, est un flux officiel et stable.

---


## 4. Stack technique

### App mobile : Expo (React Native) + TypeScript — recommandé
Kotlin + Compose serait parfaitement adapté à du 100 % Android, mais **rien dans Spinema ne demande du natif**, et Expo apporte plus ici :
- ton expérience React Native / Expo → vitesse et qualité dès le départ ;
- **TypeScript de bout en bout** : l'app et l'API partagent les mêmes types, schémas de validation (zod) et la logique du tirage (un seul code testé, utilisé par le serveur et par le tirage local) ;
- mises à jour **OTA** (EAS Update) sans réinstaller l'APK ;
- iOS reste possible plus tard, et le partage TikTok/Insta se fait via un module de partage.

| Couche | Choix |
|---|---|
| Navigation | Expo Router |
| Données serveur / cache | TanStack Query (cache persisté sur le téléphone, retry, états d'erreur) |
| État local | Zustand (réglages roulette, session) |
| Animations | react-native-reanimated (défilement 60 fps sur le thread UI) + expo-haptics |
| Bande-annonce | react-native-youtube-iframe |
| Notifications | expo-notifications (FCM) |
| Formulaires | react-hook-form + zod |

### Backend : API TypeScript sur ton serveur, sous Docker
Supabase auto-hébergé est possible mais lourd (une dizaine de conteneurs) pour ce dont on a besoin. Proposition plus légère et entièrement maîtrisée :

| Couche | Choix |
|---|---|
| API | **Node + Fastify** (TypeScript), validation zod partagée avec l'app |
| Base | **PostgreSQL** + **Drizzle ORM** (migrations SQL versionnées dans le repo) |
| Auth | Bibliothèque éprouvée (**Better Auth**) plutôt que maison : email + mot de passe (argon2), sessions / refresh tokens, vérification email, reset |
| Temps réel | **WebSocket** (Socket.IO) — une room par salon pour la machine à sous et les votes |
| Jobs | pg-boss (file de tâches dans Postgres) : rafraîchissement du cache TMDB, expiration des invitations, plus tard synchro Letterboxd |
| Données films | **TMDB API** via l'API (clé cachée côté serveur, cache en base) |
| Emails | SMTP — pas encore de fournisseur ; v1 sans vérification email ni reset automatique (§11) |
| Push | Expo Push → FCM |
| Reverse proxy | **Caddy** (HTTPS automatique) — ou ton proxy existant (§11) |
| Observabilité | Logs structurés (pino), healthcheck, Sentry (app + API) optionnel |

### Monorepo (pnpm workspaces + Turborepo)
```
apps/
  mobile/        Expo (Android)
  api/           Fastify + Socket.IO
  web/           page d'invitation /i/<code> + assetlinks.json + page de téléchargement APK
packages/
  shared/        schémas zod, types, logique pure (tirage, échantillon, filtres, règles de vote)
  db/            schéma Drizzle + migrations
infra/
  docker-compose.yml (api, postgres, caddy), docker-compose.dev.yml, sauvegardes
```

---

## 5. Modèle de données (PostgreSQL)

```
users              id, username (citext, unique), email (unique), email_verified,
                   birth_date, created_at
                   (+ tables de session/compte gérées par la lib d'auth)
push_tokens        user_id, token, platform, updated_at

spaces             id, name, kind ('personal'|'shared'), owner_id, created_at
space_members      space_id, user_id, role ('owner'|'member'),
                   permissions (text[]), auto_share (bool), joined_at   PK(space_id, user_id)
invitations        id, space_id, code (unique), created_by,
                   invited_user_id (null = lien), expires_at, max_uses, uses,
                   status ('pending'|'accepted'|'declined'|'revoked'), created_at

movies             tmdb_id (PK), title, original_title, release_date, year, poster_path,
                   backdrop_path, runtime, genres (int[]), overview, vote_average,
                   original_language, countries (text[]), directors (jsonb), cast (jsonb),
                   certification_fr ('U'|'10'|'12'|'16'|'18'|null = non classé),
                   trailer_youtube_key, refreshed_at                      ← cache TMDB

library_items      id, space_id, tmdb_id, created_at                   UNIQUE(space_id, tmdb_id)
                   → perso : mon « À voir » ; salon : l'« À voir » commun
library_adders     library_item_id, user_id, added_at                 PK(library_item_id, user_id)
                   → badges « ajouté par » (Lou + Léa sur Coraline)
library_shares     library_item_id (item de mon perso), space_id (salon), shared_at
                                                                        PK(library_item_id, space_id)
collections        id, space_id, name, emoji, position, created_by, created_at
collection_items   collection_id, tmdb_id, added_at                    PK(collection_id, tmdb_id)

watched            user_id, tmdb_id, watched_at, source ('app')       PK(user_id, tmdb_id)

spin_sessions      id, space_id, opened_by, vetos_per_member, config (jsonb),
                   status ('open'|'closed'), opened_at, closed_at
session_members    session_id, user_id, vetos_left, joined_at          PK(session_id, user_id)
spins              id, session_id, started_by, pool_size, sample (int[]), winner_tmdb_id,
                   seed, starts_at, status ('spinning'|'voting'|'accepted'|'vetoed'|'superseded'),
                   created_at
spin_votes         spin_id, user_id, vote ('ok'|'veto'), voted_at      PK(spin_id, user_id)
now_showing        space_id (PK), tmdb_id, spin_id (null en perso), accepted_at, remind_at
                   → « À l'affiche » : un seul film par espace
```

- **Pool d'un salon** = `library_items` du salon ∪ items perso partagés via `library_shares`, dédoublonnés par `tmdb_id`, badges = union des `library_adders` et des propriétaires des partages ; puis filtres, limite d'âge des présents, cases « vus par », et films écartés pendant la séance.
- **Vetos** : quand tous les présents ont voté et que **tous** ont mis un veto, `vetos_left` est rendu à chacun.
- La logique (pool → filtres → âge → échantillon → ordre → règles de veto) vit dans `packages/shared` sous forme de **fonctions pures** testées à 100 % ; la requête SQL ne fait que le pré-filtrage.
- Le hasard côté serveur utilise `crypto.randomInt` ; le `seed` est stocké pour rejouer / débugger un tirage.
- Autorisations : middleware API (`requireMember`, `requirePermission('kick')`…), couvertes par des tests d'intégration.

---

## 6. Protocole temps réel (salon)

```
client → server   session:open   { spaceId, vetosPerMember, config }
server → room     session:opened { sessionId, openedBy, vetosPerMember }
client → server   session:join   { sessionId }                  (présence)
server → room     session:presence { members: [{ userId, age, vetosLeft }], ageLimit }
client → server   spin:start     { sessionId }
server → room     spin:started   { spinId, sample[], winnerIndex, startsAt, durationMs }
                  (startsAt = maintenant + ~800 ms pour que tous les téléphones démarrent ensemble)
client → server   spin:vote      { spinId, vote: 'ok' | 'veto' }
server → room     spin:votes     { spinId, votes: { userId: 'ok' | 'veto' | null } }
server → room     spin:result    { spinId, status: 'accepted' | 'vetoed', vetosRefunded: bool,
                                   vetosLeft: { userId: n } }
server → room     now_showing:updated { tmdbId }
```
- Votes attendus = **membres présents** dans la séance au moment du tirage.
- Un nouveau `spin:start` pendant un vote clôt le vote en cours (`superseded`).
- La limite d'âge est recalculée à chaque arrivée / départ dans la séance ; si un mineur rejoint, le pool est recalculé au lancer suivant.
- État stocké en base : un téléphone qui se reconnecte récupère la séance et le tirage en cours.
- Décalage d'horloge : chaque client mesure son écart avec le serveur à la connexion pour caler `startsAt`.

---

## 7. Écrans

```
Auth ─ Connexion · Inscription (email, pseudo, mot de passe) · Mot de passe oublié
│
└─ [Sélecteur d'espace : Perso ▾ | Nous deux | Ciné entre potes | + Créer / rejoindre]
   │
   └─ Onglets
      ├─ 🎰 Machine      « À l'affiche » en haut · mode (normal) · réglages (source, filtres,
      │                  classification, déjà vus global + par membre) · « 23 films »
      │                  → salon : ouvrir une séance (nb de vetos) · présents · vetos restants
      │                  → machine à sous → affiche → 👍 / ✋ → « À l'affiche » · historique
      ├─ 📚 Bibliothèque  À voir (commun + partagés) · collections · catégories auto · Déjà vus
      ├─ 🔍 Découvrir     tendances, genres, années, recherche
      └─ 👤 Profil        mes salons, invitations reçues, notifications, déconnexion

Salon › Réglages : membres, droits, inviter (lien / pseudo), partage auto, quitter / supprimer
Fiche film : affiche, backdrop, date, genres, durée, classification, synopsis, réalisateur,
             casting, note, bande-annonce, qui l'a vu, ajouté par (badges), collections,
             [Ajouter à… (mon À voir / À voir commun / collections)] [Partager avec… ☑] [Je l'ai vu]
```

---

## 8. Qualité, tests et CI/CD

### Tests
| Niveau | Outil | Cible |
|---|---|---|
| Unitaires | **Vitest** | `packages/shared` : tirage, échantillon, pondération, filtres, règles de vote / veto, mapping des classifications. **100 %**. |
| Intégration API | Vitest + **Testcontainers** (vrai Postgres) + supertest | Chaque route, chaque droit, chaque cas de refus ; événements Socket.IO. |
| Composants mobile | **Jest + React Native Testing Library** | Écrans et composants, états de chargement / erreur / vide. |
| End-to-end | **Maestro** sur émulateur Android | Parcours clés : inscription, ajout de film, partage, tirage, vote. |
| Contrats | Schémas zod partagés | L'app et l'API ne peuvent pas diverger silencieusement. |

Seuils de couverture bloquants en CI (proposition : 100 % `shared`, ≥ 90 % `api`, ≥ 80 % `mobile`).

### Pipeline GitHub Actions
- **Pull request** : lint (ESLint) · format (Prettier) · typecheck · tests unitaires + intégration + composants · couverture · build Docker de l'API · `expo-doctor`.
- **main** : tout ce qui précède + e2e Maestro · image Docker publiée sur **GHCR** · déploiement **staging** (SSH → `docker compose pull && up -d`, migrations au démarrage) · publication EAS Update sur le canal `staging`.
- **Tag `v*`** : déploiement **prod** · build de l'APK signé **dans GitHub Actions** (`eas build --local`, keystore dans les secrets) · release GitHub + page de téléchargement sur ton domaine · EAS Update canal `production`.
- Plus tard : publication sur Google Play (piste de test interne puis production) quand l'app te satisfait.
- Renovate / Dependabot, scan de secrets, sauvegarde quotidienne Postgres (`pg_dump` → stockage externe) avec test de restauration.

### Gestion des erreurs
- API : erreurs typées (`code`, `message`), jamais de stacktrace côté client, logs corrélés par requête.
- App : error boundaries par écran, messages clairs, retry automatique (TanStack Query) et manuel, bandeau « hors ligne » (la bibliothèque reste consultable depuis le cache), reconnexion automatique du WebSocket avec reprise de l'état du tirage.

---

## 9. Étapes de réalisation

| Étape | Contenu | Livrable |
|---|---|---|
| **0. Maquette** | Maquette cliquable (Artifact HTML) des écrans principaux, dont la machine à sous animée et le vote. | Direction visuelle validée. |
| **1. Socle** | Monorepo, Docker Compose, Postgres, Fastify, Expo, lint / tests / CI, déploiement staging. | Pipeline verte, app « hello » sur vos téléphones. |
| **2. Comptes** | Inscription / connexion / pseudo / email, espace perso auto. | Comptes fonctionnels. |
| **3. Films + À voir** | Proxy TMDB + cache, recherche, fiche film complète (bande-annonce), mon « À voir ». | Bibliothèque perso. |
| **4. Collections + vu** | Collections, vu / pas vu, Déjà vus, catégories auto, filtres. | Bibliothèque organisée. |
| **5. Machine (perso)** | Logique de tirage partagée, échantillon, animation, classification limitée par l'âge, « À l'affiche ». | Tirage solo. 🎰 |
| **6. Salons** | Création, invitations (lien + pseudo), App Links, rôles / droits, « À voir » commun, partage auto / manuel, badges. | Salons complets. |
| **7. Machine (salon)** | Séances, présence, tirage synchronisé, vetos (budget, remboursement), limite d'âge des présents, notifications push, rappel 24 h. | Tirage à plusieurs. 🎉 |
| **8. Découverte** | Tendances, genres, années, pagination infinie. | Explorer les films. |
| **9. Finitions + prod** | Design final, états vides, accessibilité, perf, release APK v1.0. | v1 en prod. |

---

## 10. Décisions prises

| Sujet | Décision |
|---|---|
| Plateforme | Android uniquement (v1). APK d'abord, Google Play plus tard. |
| Contenu | Films uniquement. |
| Listes | « À voir » perso + « À voir » commun par salon + partage de films perso (auto ou manuel). |
| Doublons | Ajouter au commun un film déjà dans son perso → proposition de partage. |
| Badges | Un badge par personne qui a ajouté / partagé le film. |
| Départ d'un membre | Ses films partagés disparaissent, son badge est retiré. |
| Salons | N membres, propriétaire = créateur, droits délégables. |
| Âge | Date de naissance à l'inscription ; classification max = âge du plus jeune présent ; non classés exclus si un mineur est présent. |
| Vu | Booléen par personne, chacun confirme pour soi. |
| Modes de tirage | Normal (v1) ; pondéré = mode séparé, plus tard. |
| Machine à sous | Ordre mélangé, échantillon aléatoire invisible, min. 2 films, relances illimitées. |
| Séance (salon) | Tirage en direct ; présents = connectés ; nombre de vetos par personne fixé par qui lance ; un veto = film écarté ; veto unanime = vetos rendus ; film écarté exclu de la séance. |
| Résultat | Affiche → fiche complète avec bande-annonce ; « À l'affiche » (un seul par salon) ; rejet + relance possible. |
| Perso | Tirage local, sans veto. |
| Backend | API TypeScript sur serveur perso sous Docker. |
| Offline | Cache simple + gestion d'erreurs soignée. |
| Auth | Email + pseudo unique + mot de passe + date de naissance. Pas de Google pour l'instant. |
| Invitations | Lien (domaine dispo) ou recherche par pseudo. |
| Build | APK buildé dans GitHub Actions ; mises à jour OTA via EAS Update. |
| Qualité | Couverture maximale, CI/CD complète, envs dev / staging / prod. |
| Maquette | Artifact (HTML cliquable), après choix de la direction visuelle. |
| Plus tard | Tirage pondéré, Letterboxd, TikTok / Insta, thèmes, swipe, journal, iOS, séries, Google Play. |

---

## 11. Questions ouvertes

### Séances et vetos
1. **Vetos et séance** : le budget de vetos vaut pour **toute la séance** (pas par film) et la séance se termine quand un film passe à l'affiche ou quand celui qui l'a ouverte la ferme ? Que se passe-t-il quand **plus personne n'a de veto** : le prochain film tiré est imposé (« la machine a parlé ») ?
2. **Délai de vote** : on attend que tous les présents aient voté, ou on met un compte à rebours (ex. 20 s, sans réponse = OK) pour qu'un téléphone posé sur la table ne bloque pas la séance ?
3. Quelqu'un qui **rejoint une séance en cours** reçoit le même nombre de vetos que les autres au départ ?
4. Quand **tous les présents** mettent un veto et récupèrent leurs vetos : ça marche aussi à 2 personnes (les deux vetos → rendus) ?

### Âge
5. **Découverte / recherche** pour un compte mineur : on masque aussi les films au-dessus de son âge, ou seulement dans la machine ?
6. **Âge minimum** pour créer un compte ? (En France, la majorité numérique est à 15 ans pour le consentement au traitement de données. Pour une app privée entre proches, le plus simple est de ne rien collecter de plus que la date de naissance et de ne pas mettre d'âge minimum, mais à garder en tête avant Google Play.)

### À l'affiche
7. Un film **à l'affiche en perso** et le même en salon : indépendants (proposition) ?
8. Le rappel « Vous l'avez vu ? » : uniquement aux membres présents lors de la séance, ou à tout le salon ?

### Infra (à voir plus tard)
9. Ton serveur : reverse proxy existant (Traefik, Nginx, Caddy) ? Machine (CPU / RAM) ? Staging sur le même serveur ?
10. **Emails** : sans SMTP, la v1 n'a ni vérification d'email ni « mot de passe oublié ». En attendant, un **reset par le propriétaire du salon** (il génère un lien de réinitialisation à usage unique) ou par toi en admin ? Quand tu voudras un SMTP : Brevo (300 mails/jour gratuits) ou Resend (3 000/mois gratuits) suffisent largement.

### Design
11. Choix de la direction visuelle pour la maquette :
    - **A. Néon de casino rétro** — fond noir violacé, néons rose / cyan, machine à sous avec levier et ampoules qui clignotent, typo display rétro.
    - **B. Grand écran art déco** — bordeaux, or et crème, rideau rouge qui s'ouvre sur l'affiche gagnante, rouleau en pellicule 35 mm perforée, typo serif art déco. Colle bien à « À l'affiche ».
    - **C. Sombre minimaliste** — anthracite + une couleur d'accent, les affiches font tout le travail, rouleau d'affiches avec flou de mouvement, typo sans serif moderne.
