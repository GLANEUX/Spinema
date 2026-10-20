# Spinema — Plan du projet

Application Android pour choisir quoi regarder, seul ou à plusieurs : des listes de films **à voir** (perso et communes), des **collections**, des **catégories auto**, une **machine à sous** pour tirer au sort — **en direct sur tous les téléphones du salon, avec vote et veto** —, un mode **découverte**, et le suivi **vu / pas vu**.

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
| **Films partagés** | Chaque salon | Les films de mon « À voir » perso que **j'ai choisi de partager** avec ce salon. Partage film par film (et par salon), révocable. Le film reste à moi : si je le retire de mon perso, il disparaît du salon. |

Dans un salon, la bibliothèque affiche donc : « À voir » commun + films partagés par chaque membre (avec l'avatar de qui l'a partagé). Le même film présent deux fois (commun + partagé) n'apparaît qu'une fois.

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

### Rôles et restrictions d'âge
- Le **créateur** du salon est propriétaire. Il peut donner des **droits** aux membres, à la carte :

  | Droit | Permet de |
  |---|---|
  | `invite` | Inviter des personnes |
  | `kick` | Exclure un membre |
  | `manage_library` | Retirer un film ajouté par quelqu'un d'autre de l'« À voir » commun |
  | `manage_collections` | Modifier / supprimer les collections des autres |
  | `manage_settings` | Renommer le salon, changer la restriction d'âge |

  Sans droit particulier, un membre peut : ajouter des films, partager les siens, créer ses collections, lancer la roulette, voter.
- **Restriction d'âge** : basée sur la **classification française** du film (TMDB `release_dates`, pays FR ; repli sur US converti ; sinon « inconnue »). Proposition en §11.

### Roulette (machine à sous)
**Réglages**
1. **Source** (combinables) : « À voir » (commun + partagés dans un salon), collections, catégories auto.
2. **Filtres** : genre(s), type, durée max, période, pays / langue, note minimale.
3. **Déjà vus** — tout décoché par défaut (= personne ne l'a vu) :
   ```
   [ ] Inclure les films déjà vus      ← global, coche / décoche tout
       [ ] vus par Alex
       [ ] vus par Sam
   ```
   Un film est exclu dès qu'un membre **décoché** l'a vu.
4. « **23 films** dans la machine ». La machine ne se lance qu'à partir de **2 films**.

**Tirage**
- Le serveur tire le **film gagnant**, puis un **échantillon aléatoire** du tirage (ex. ~30 films dont le gagnant), dans un **ordre mélangé à chaque lancer**. Le rouleau ne montre que l'échantillon, mais comme il défile vite et change à chaque fois, l'échantillonnage ne se voit pas.
- L'animation est calculée pour s'arrêter sur le gagnant.
- **Pas de limite** de relances.

**Résultat**
- Affichage plein écran de l'**affiche** du film. Un appui ouvre la **fiche complète** : date de sortie, genres, durée, classification, synopsis, réalisateur, casting principal, note, **bande-annonce** (vidéo YouTube via TMDB, lue dans l'app), où le trouver dans vos collections (ex. « DVD »).
- Le film passe en **« Prévu ce soir »**. On peut toujours **rejeter et relancer**.
- Après le film : « On l'a vu » → chaque membre confirme pour lui-même (voir §11).

**Dans un salon : tirage en direct + vote**
- Quand quelqu'un lance, **tous les membres connectés** voient la machine tourner en même temps (le serveur envoie l'échantillon, l'ordre, le gagnant et l'heure de départ ; chaque téléphone joue la même animation).
- Les membres hors de l'app reçoivent une **notification** « Alex lance la machine ! ».
- Une fois le film affiché, chacun vote **👍 OK** ou **✋ Veto**.
- Un veto peut être **contesté** : les autres votent pour lever le veto. **Si tout le monde n'est pas d'accord pour le lever, le veto tient** (règle exacte à confirmer en §11).
- Sans veto (ou veto levé) → « Prévu ce soir ». Veto maintenu → film écarté, on relance.

**Dans l'espace perso** : tirage **local** (pas de serveur, pas de vote), boutons *Accepter* / *Rejeter et relancer*.

**Tirage pondéré (option)** — voir §11. Techniquement simple (un tirage aléatoire pondéré tient en quelques lignes), le vrai sujet est l'UX : il faut que ça reste compréhensible et juste.

---

## 2. Fonctionnalités

### MVP (v1)
| # | Fonctionnalité | Détail |
|---|---|---|
| 1 | **Comptes** | Inscription / connexion email + mot de passe, **pseudo unique**, vérification email, mot de passe oublié. Espace perso créé automatiquement. |
| 2 | **Salons** | Création, invitation par lien (App Links) ou par pseudo, rejoindre, quitter, rôles et droits, restriction d'âge. |
| 3 | **À voir + partage** | Recherche TMDB → ajout à mon « À voir » ou à l'« À voir » commun d'un salon. Partage de mes films avec un ou plusieurs salons. |
| 4 | **Collections** | Créer / renommer / supprimer, un film dans plusieurs collections. |
| 5 | **Vu / Pas vu** | Booléen par personne, « Déjà vus », badges par membre. |
| 6 | **Catégories auto** | Genre, type, durée, époque, pays, réalisateur, note, classification. |
| 7 | **Machine à sous** | Source + filtres + cases « déjà vus », échantillon aléatoire, ordre mélangé, min. 2 films, tirage local (perso) ou en direct (salon), vote / veto / contestation, « Prévu ce soir », fiche film avec bande-annonce. |
| 8 | **Découverte** | Tendances, populaires, par genre / année, recherche. Ajout ou « Déjà vu » depuis la fiche. |
| 9 | **Notifications push** | Machine lancée, invitation reçue, vote en attente. |

### Plus tard (à garder en tête)
- **Synchro Letterboxd** par pseudo (§3).
- **Partage depuis TikTok / Instagram** : *Partager → Spinema* sur une vidéo, identification du film (légende + recherche TMDB, IA si besoin), confirmation, ajout à « À voir ». Android : intent filter `ACTION_SEND`.
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
| Emails | SMTP (fournisseur à choisir, §11) |
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
users              id, username (citext, unique), email (unique), email_verified, created_at
                   (+ tables de session/compte gérées par la lib d'auth)
push_tokens        user_id, token, platform, updated_at

spaces             id, name, kind ('personal'|'shared'), owner_id,
                   age_limit (null | 'U'|'10'|'12'|'16'|'18'), created_at
space_members      space_id, user_id, role ('owner'|'member'),
                   permissions (text[]), joined_at                    PK(space_id, user_id)
invitations        id, space_id, code (unique), created_by,
                   invited_user_id (null = lien), expires_at, max_uses, uses,
                   status ('pending'|'accepted'|'declined'|'revoked'), created_at

movies             tmdb_id (PK), title, original_title, release_date, year, poster_path,
                   backdrop_path, runtime, genres (int[]), overview, vote_average,
                   original_language, countries (text[]), directors (jsonb),
                   certification_fr, trailer_youtube_key, refreshed_at   ← cache TMDB

library_items      id, space_id, tmdb_id, added_by, added_at, note     UNIQUE(space_id, tmdb_id)
                   → perso : mon « À voir » ; salon : l'« À voir » commun
library_shares     library_item_id (item de mon perso), space_id (salon), shared_at
                                                                        PK(library_item_id, space_id)
collections        id, space_id, name, emoji, position, created_by, created_at
collection_items   collection_id, library_item_id, added_at          PK(collection_id, library_item_id)
                   → dans un salon, une collection peut contenir des items communs ou partagés

watched            user_id, tmdb_id, watched_at, source ('app')       PK(user_id, tmdb_id)

spins              id, space_id, started_by, config (jsonb : source, filtres, cases vus),
                   pool_size, sample (int[]), winner_tmdb_id, seed, starts_at,
                   status ('spinning'|'voting'|'planned'|'vetoed'|'rejected'|'watched'),
                   created_at
spin_votes         spin_id, user_id, vote ('ok'|'veto'), voted_at       PK(spin_id, user_id)
veto_challenges    spin_id, user_id, lift (bool), voted_at               PK(spin_id, user_id)
```

- **Pool du tirage d'un salon** = `library_items` du salon ∪ items perso présents dans `library_shares` pour ce salon, dédoublonnés par `tmdb_id`, puis filtres, restriction d'âge et cases « vus par ».
- La logique (pool → filtres → échantillon → ordre) vit dans `packages/shared` sous forme de **fonctions pures** testées à 100 %, la requête SQL ne fait que le pré-filtrage.
- Le hasard côté serveur utilise `crypto.randomInt` ; le `seed` est stocké pour rejouer / débugger un tirage.
- Autorisations : vérifiées dans l'API par un middleware (`requireMember`, `requirePermission('kick')`…), couvertes par des tests d'intégration.

---

## 6. Protocole temps réel (salon)

```
client → server   spin:start   { spaceId, config }
server → room     spin:started { spinId, sample[], winnerIndex, startsAt, durationMs }
                  (startsAt = maintenant + ~800 ms pour que tous les téléphones démarrent ensemble)
server → room     spin:voting  { spinId }
client → server   spin:vote    { spinId, vote: 'ok' | 'veto' }
server → room     spin:votes   { spinId, votes: { userId: vote } }
client → server   veto:challenge { spinId, lift: true | false }
server → room     spin:result  { spinId, status: 'planned' | 'vetoed' }
```
- Les votes attendus = **membres connectés à la room** au moment du tirage (présence Socket.IO). Un membre qui arrive en cours de route peut voter tant que le vote est ouvert.
- État de la machine stocké en base : si un téléphone se reconnecte, il récupère l'état du tirage en cours.
- Décalage d'horloge : chaque client mesure son écart avec le serveur à la connexion (ping) pour caler `startsAt`.

---

## 7. Écrans

```
Auth ─ Connexion · Inscription (email, pseudo, mot de passe) · Mot de passe oublié
│
└─ [Sélecteur d'espace : Perso ▾ | Nous deux | Ciné entre potes | + Créer / rejoindre]
   │
   └─ Onglets
      ├─ 🎰 Machine      réglages (source, filtres, déjà vus global + par membre) · « 23 films »
      │                  → machine à sous (en direct en salon) → affiche → vote / veto / contestation
      │                  → « Prévu ce soir » · historique des tirages
      ├─ 📚 Bibliothèque  À voir (commun + partagés) · collections · catégories auto · Déjà vus
      ├─ 🔍 Découvrir     tendances, genres, années, recherche
      └─ 👤 Profil        mes salons, invitations reçues, notifications, déconnexion

Salon › Réglages : membres, droits, inviter (lien / pseudo), restriction d'âge, quitter / supprimer
Fiche film : affiche, backdrop, date, genres, durée, classification, synopsis, réalisateur,
             casting, note, bande-annonce, qui l'a vu, dans quelles collections,
             [Ajouter à… (mon À voir / À voir commun / collections)] [Partager avec…] [Je l'ai vu]
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
- **Tag `v*`** : déploiement **prod** · build APK de production (EAS Build ou Gradle dans Actions) · release GitHub avec l'APK · EAS Update canal `production`.
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
| **5. Machine (perso)** | Logique de tirage partagée, échantillon, animation, « Prévu ce soir ». | Tirage solo. 🎰 |
| **6. Salons** | Création, invitations (lien + pseudo), App Links, rôles / droits, « À voir » commun, partage de films, restriction d'âge. | Salons complets. |
| **7. Machine (salon)** | Temps réel, tirage synchronisé, votes, veto, contestation, notifications push. | Tirage à plusieurs. 🎉 |
| **8. Découverte** | Tendances, genres, années, pagination infinie. | Explorer les films. |
| **9. Finitions + prod** | Design final, états vides, accessibilité, perf, release APK v1.0. | v1 en prod. |

---

## 10. Décisions prises

| Sujet | Décision |
|---|---|
| Plateforme | Android uniquement (v1). |
| Contenu | Films uniquement. |
| Listes | « À voir » perso + « À voir » commun par salon + partage de films perso vers un salon. |
| Salons | N membres, propriétaire = créateur, droits délégables, restriction d'âge. |
| Qui regarde ce soir | Non. |
| Vu | Booléen par personne. |
| Machine à sous | Ordre mélangé, échantillon aléatoire invisible, min. 2 films, relances illimitées. |
| Résultat | Affiche → fiche complète avec bande-annonce, statut « Prévu ce soir », rejet + relance possible. |
| Salon | Tirage en direct sur tous les téléphones, vote OK / veto, veto contestable. |
| Perso | Tirage local, sans vote. |
| Backend | Serveur perso sous Docker. |
| Offline | Cache simple + gestion d'erreurs soignée. |
| Auth | Email + mot de passe + pseudo unique, pas de Google pour l'instant. |
| Invitations | Lien (domaine dispo) ou recherche par pseudo. |
| Qualité | Couverture maximale, CI/CD complète, envs dev / staging / prod. |
| Maquette | Artifact (HTML cliquable). |
| Plus tard | Letterboxd, TikTok / Insta, thèmes, swipe, journal, iOS, séries. |

---

## 11. Questions ouvertes

### Vote et veto
1. **Règle exacte de la contestation.** Scénario : Alex, Sam, Lou. Lou met un veto. Proposition :
   - Alex et Sam votent « lever le veto ». Si **tous les autres** votent pour le lever, le veto est levé (même si Lou ne change pas d'avis) ? Ou faut-il aussi l'accord de Lou (dans ce cas c'est juste Lou qui retire son veto) ?
   - Avec **deux vetos** (Lou et Sam), Alex seul ne peut rien faire, OK ?
   - Combien de temps reste ouvert le vote ? (proposition : pas de limite, mais un nouveau lancer annule le vote en cours)
2. **Qui doit voter** : seulement les membres **connectés** au moment du tirage (proposition), ou tous les membres, ce qui bloque si quelqu'un est absent ?
3. **Contester un veto donne-t-il une seconde chance au film**, ou le film vetoé est-il écarté pour la soirée même si on relance ?

### Prévu ce soir / vu
4. Quand on passe un film « Prévu ce soir » en **« On l'a vu »** dans un salon : chaque membre le confirme pour lui-même (proposition), ou ça marque vu pour tous les votants ?
5. Un seul film « Prévu ce soir » à la fois par salon, ou plusieurs (double programme) ? Il expire tout seul le lendemain ?

### Partage et listes
6. J'ajoute à l'« À voir » commun un film **déjà dans mon perso** : l'app propose plutôt de le **partager** (pas de doublon), ou on accepte les deux ?
7. Partage par défaut : quand j'ajoute un film à mon perso, une option « partager automatiquement avec Nous deux » par salon, ou toujours manuel ?
8. Quand un membre **quitte** un salon : ses films partagés disparaissent (proposition), ses ajouts dans l'« À voir » commun restent ?

### Restriction d'âge
9. Quel modèle ?
   - (a) **Par salon** : le propriétaire fixe une classification max (ex. -12) ; tous les films au-dessus sont exclus de la machine de ce salon. Simple.
   - (b) **Par membre** : le propriétaire marque un membre comme « mineur -12 » ; dès que ce membre est dans le salon, la machine exclut les films -16 et -18.
   - (c) Les deux.
   - Et les films **sans classification connue** : exclus ou inclus quand une restriction est active ?

### Tirage pondéré
10. Proposition simple : sur chaque film, chaque membre peut mettre **🔥 « j'ai très envie »**. Poids = 1 + nombre de 🔥. Bonus : un film refusé dans les 7 derniers jours a un poids ×0,5. Option « Tirage pondéré » activable dans les réglages de la machine. On le met en v1 (étape 5) ou juste après ?

### Infra
11. Ton serveur : il a déjà un **reverse proxy** (Traefik, Nginx, Caddy) et d'autres services ? Quelle machine (CPU / RAM) ? On ajoute un **staging** sur le même serveur ?
12. **Emails** (vérification, mot de passe oublié) : tu as un SMTP (OVH, Brevo, Resend, Postmark…) sur ton domaine ?
13. **Distribution** : APK téléchargeable depuis ton domaine + mises à jour OTA (gratuit), ou piste de test interne Google Play (25 $ une fois, mises à jour automatiques via le Store) ?
14. OK pour dépendre d'**Expo EAS** (builds cloud, OTA) dans la CI, ou tu préfères tout builder dans GitHub Actions (Gradle) sans service tiers ?

### Design
15. Pour la maquette en Artifact, une direction visuelle de départ ? (néon de casino rétro, ticket de cinéma / art déco, sombre minimaliste façon Letterboxd…) Je peux aussi proposer 2–3 variantes de l'écran machine à sous pour choisir.
