# Spinema — Plan du projet

Application Android pour choisir quoi regarder, seul ou à plusieurs : des listes de films **à voir** (perso et communes), des **collections**, des **catégories auto**, une **machine à sous** pour tirer au sort — **en direct sur tous les téléphones du salon, avec un système de vetos** —, un mode **découverte**, et le suivi **vu / pas vu**.

---

## 1. Concepts clés

### Espaces
- **Espace perso** : créé automatiquement à l'inscription, privé, on ne peut pas y inviter. L'app est utilisable seul sans rien configurer.
- **Salons** : créés à la demande (« Nous deux », « Ciné entre potes »), **N membres** (max **20**, et **10 salons** max par personne). On rejoint un salon par **lien d'invitation** ou par **invitation via pseudo** (voir *Invitations* ci-dessous).

### Invitations
- **Lien** `https://<domaine>/i/<code>` (ouvre l'app via Android App Links) : valable **7 jours**, utilisable par plusieurs personnes, révocable. Ouvrir le lien crée une **demande d'adhésion** que le propriétaire (ou un membre avec le droit `invite`) doit **valider**.
- **Par pseudo** : on trouve quelqu'un seulement en tapant son **pseudo exact** (pas d'annuaire, pas d'autocomplétion). L'invité accepte ou refuse dans l'app.
- **Blocage** : on peut bloquer un utilisateur ; il ne peut plus nous inviter ni nous trouver par pseudo.

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

### Cycle de vie
- **Le propriétaire quitte le salon** → le salon est **supprimé pour tout le monde** (pas de transfert de propriété en v1). L'app l'affiche clairement dans la confirmation : « Quitter supprimera *Ciné entre potes* pour ses 4 membres ».
- **Suppression d'un salon** : réservée au propriétaire, avec confirmation. L'« À voir » commun, les collections du salon, les séances et l'historique sont supprimés ; les films partagés restent dans les « À voir » perso de leurs propriétaires.
- **Suppression de compte** : **tout est supprimé** — espace perso, vus, films partagés, salons dont il est propriétaire (même règle que ci-dessus), et ses ajouts à l'« À voir » commun des autres salons. Un film commun ajouté aussi par d'autres membres reste, seul son badge disparaît.

### Âge et classification
- La **date de naissance** est demandée à l'inscription (seul l'âge calculé est affiché, la date reste privée).
- Chaque film a une **classification française** (TMDB `release_dates`, pays FR ; repli sur la classification US convertie ; sinon **« non classé »**).
- Dans les filtres de la machine, la classification se choisit par cases : `Tous publics · -10 · -12 · -16 · -18`. **On ne peut pas cocher une classification au-dessus de son âge** : à 17 ans, la case -18 est grisée.
- **Dans un salon**, la limite est celle du **plus jeune des membres présents** (connectés à la session de tirage) : si Lou a 15 ans et participe, -16 et -18 sont grisés pour tout le monde.
- **Films « non classés »** : recommandation → **exclus dès qu'un mineur est présent**, inclus sinon. C'est le choix prudent, et il concerne surtout de vieux films ou des films étrangers peu distribués. Un badge « non classé » sur la fiche l'indique.
- La même limite s'applique **partout** pour un compte mineur : machine, **découverte** et **recherche** masquent les films au-dessus de son âge (et les non classés).
- **Pas d'âge minimum** pour créer un compte en v1 (app privée entre proches) — à revoir avant Google Play.

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
- **Effets sonores** (défilement, arrêt, fanfare) **activés par défaut**, désactivables dans le profil, coupés en mode silencieux. Haptique en plus.

**Résultat**
- Affichage plein écran de l'**affiche**. Un appui ouvre la **fiche complète** : date de sortie, genres, durée, classification, synopsis, réalisateur, casting principal, note, **bande-annonce** (YouTube via TMDB, lue dans l'app), collections où il se trouve (ex. « DVD »).
- Une fois accepté, le film passe **« À l'affiche »** (plutôt que « Prévu ce soir », qui ne marche pas si on regarde le lendemain ou l'après-midi). **Un seul film à l'affiche par espace** : en accepter un nouveau remplace l'ancien (avec confirmation). L'affiche du perso et celle de chaque salon sont **indépendantes**.
- Après la séance : **« Je l'ai vu »** → chaque membre confirme pour lui-même. Le film quitte l'affiche dès qu'un membre l'a confirmé, ou quand quelqu'un le retire. Si personne ne fait rien, rappel au bout de 24 h : « Vous avez vu *Coraline* ? », envoyé **aux présents de la séance** uniquement (à soi-même en perso).
- On peut toujours **rejeter et relancer**.

**Dans un salon : tirage en direct + vetos**
- Celui qui lance ouvre une **séance** et choisit :
  - le **nombre de vetos par personne**, valable pour **toute la séance** (ex. 2) ;
  - le **délai de vote** : aucun · 10 s · 20 s · 60 s. À la fin du délai, un présent qui n'a pas voté compte comme **OK** (un téléphone posé sur la table ne bloque pas la séance).
- Les **membres présents** = connectés à la séance. Ils voient tous la machine tourner en même temps (le serveur envoie l'échantillon, l'ordre, le gagnant et l'heure de départ ; chaque téléphone joue la même animation). Les autres reçoivent une **notification** « Alex lance la machine ! » et peuvent rejoindre en cours de séance, avec le **budget de vetos complet**.
- Quand le film s'affiche, chaque présent choisit **👍 OK** ou **✋ Veto**.
  - **Un seul veto suffit** : le film est écarté, sans contestation possible.
  - **Si tous les présents mettent un veto** sur le même film (dès 2 présents), le film est écarté et **tout le monde récupère son veto**.
  - Quelqu'un qui n'a plus de veto ne peut que voter OK.
- **Plus personne n'a de veto** → « **La machine a parlé** » : le prochain film tiré passe directement à l'affiche, sans vote.
- Un film écarté **ne revient plus de la séance**. Un vote reste ouvert jusqu'au lancer suivant (ou la fin du délai).
- Tout le monde a voté OK → le film passe **à l'affiche** et la séance se termine. Celui qui l'a ouverte peut aussi la fermer à tout moment.

**Dans l'espace perso** : tirage **local** (pas de serveur, pas de veto), boutons *Accepter* / *Rejeter et relancer*.

---

## 2. Fonctionnalités

### MVP (v1)
| # | Fonctionnalité | Détail |
|---|---|---|
| 1 | **Comptes** | Inscription / connexion : email + **pseudo unique** + mot de passe + **date de naissance**. Espace perso créé automatiquement. **Vérification email** et **mot de passe oublié** (SMTP dès la v1). Blocage d'utilisateurs. Suppression de compte. |
| 2 | **Salons** | Création, invitation par lien (App Links, validation des demandes) ou par pseudo exact, rejoindre, quitter, rôles et droits, limites 20 membres / 10 salons. |
| 3 | **À voir + partage** | Recherche TMDB → ajout à mon « À voir » ou à l'« À voir » commun d'un salon. Partage auto ou manuel (cases à cocher), badges « ajouté par » par personne. |
| 4 | **Collections** | Créer / renommer / supprimer, un film dans plusieurs collections. |
| 5 | **Vu / Pas vu** | Booléen par personne, « Déjà vus », badges par membre. |
| 6 | **Catégories auto** | Genre, type, durée, époque, pays, réalisateur, note, classification. |
| 7 | **Machine à sous** | Tirage normal. Source + filtres + classification limitée par l'âge + cases « déjà vus », échantillon aléatoire, ordre mélangé, min. 2 films, effets sonores, tirage local (perso) ou séance en direct (salon) avec vetos et délai de vote, « À l'affiche », fiche film avec bande-annonce. |
| 8 | **Découverte** | Tendances, populaires, par genre / année, recherche (filtrées par l'âge pour un mineur). Ajout ou « Déjà vu » depuis la fiche. |
| 9 | **Notifications push** | Séance lancée, invitation reçue, rappel « Vous l'avez vu ? ». |

### Plus tard (à garder en tête)
- **Synchro Letterboxd** par pseudo (§3).
- **Partage depuis TikTok / Instagram** : *Partager → Spinema* sur une vidéo, identification du film (légende + recherche TMDB, IA si besoin), confirmation, ajout à « À voir ». Android : intent filter `ACTION_SEND`.
- **Tirage pondéré** : mode séparé (🔥 « j'ai très envie », ancienneté, pénalité des films récemment écartés).
- **Roulettes à thème** : réglages enregistrés sous un nom (« Dimanche doudou » = Animation + déjà vus inclus) et thèmes prêts à l'emploi.
- **Mode Swipe** : chacun swipe, match → ajout à l'« À voir » commun.
- **Journal de visionnage** (dates, revisionnages, note personnelle) à la place du booléen.
- **Transfert de propriété** d'un salon.
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
| Son | expo-audio (effets de la machine) |
| Traduction | i18next + expo-localization — interface en français, textes externalisés dès le départ. Titres TMDB en français (`language=fr-FR`), titre original affiché dessous s'il diffère. |
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
| Jobs | pg-boss (file de tâches dans Postgres) : rafraîchissement du cache TMDB, expiration des invitations, fin des délais de vote, rappels 24 h, plus tard synchro Letterboxd |
| Données films | **TMDB API** via l'API (clé cachée côté serveur, cache en base) |
| Emails | **SMTP dès la v1** (Nodemailer) : vérification d'email, mot de passe oublié. Fournisseur **Brevo** (300 mails/jour gratuits, données en UE), domaine d'envoi avec SPF / DKIM / DMARC. |
| Hébergement | Serveur perso (≥ 4 Go de RAM). **Prod et staging sur la même machine** : deux stacks Docker Compose séparées (bases distinctes), sous-domaines `<domaine>` et `staging.<domaine>`. |
| Push | Expo Push → FCM |
| Reverse proxy | **Nginx existant** sur le serveur : un bloc `server` par domaine (API + WebSocket, page web), certificats Let's Encrypt |
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
  docker-compose.yml (api, postgres, web), docker-compose.dev.yml, nginx/ (conf d'exemple), sauvegardes
```

---

## 5. Modèle de données (PostgreSQL)

```
users              id, username (citext, unique), email (unique), email_verified,
                   birth_date, sound_enabled, created_at
                   (+ tables de session/compte/vérification gérées par la lib d'auth)
push_tokens        user_id, token, platform, updated_at
blocks             blocker_id, blocked_id, created_at                 PK(blocker_id, blocked_id)

spaces             id, name, kind ('personal'|'shared'), owner_id, created_at
space_members      space_id, user_id, role ('owner'|'member'),
                   permissions (text[]), auto_share (bool), joined_at   PK(space_id, user_id)
invitations        id, space_id, code (unique), created_by,
                   invited_user_id (null = lien), expires_at (création + 7 j),
                   status ('pending'|'accepted'|'declined'|'revoked'), created_at
join_requests      id, invitation_id, user_id, status ('pending'|'approved'|'rejected'),
                   decided_by, created_at, decided_at                   → validation des liens

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

spin_sessions      id, space_id, opened_by, vetos_per_member,
                   vote_timeout_s (null = pas de délai), config (jsonb),
                   status ('open'|'closed'), opened_at, closed_at
session_members    session_id, user_id, vetos_left, joined_at          PK(session_id, user_id)
spins              id, session_id, started_by, pool_size, sample (int[]), winner_tmdb_id,
                   seed, starts_at, vote_deadline, imposed (bool = « la machine a parlé »),
                   status ('spinning'|'voting'|'accepted'|'vetoed'|'superseded'), created_at
spin_votes         spin_id, user_id, vote ('ok'|'veto'), voted_at      PK(spin_id, user_id)
now_showing        space_id (PK), tmdb_id, spin_id (null en perso), accepted_at, remind_at
                   → « À l'affiche » : un seul film par espace
```

- **Pool d'un salon** = `library_items` du salon ∪ items perso partagés via `library_shares`, dédoublonnés par `tmdb_id`, badges = union des `library_adders` et des propriétaires des partages ; puis filtres, limite d'âge des présents, cases « vus par », et films écartés pendant la séance.
- **Vetos** : quand tous les présents ont voté et que **tous** ont mis un veto (dès 2 présents), `vetos_left` est rendu à chacun. Si la somme des `vetos_left` des présents vaut 0 au lancer, le tirage est `imposed` et passe directement à l'affiche.
- **Limites** : 20 membres par salon, 10 salons par personne (salons possédés + rejoints), vérifiées par l'API.
- La logique (pool → filtres → âge → échantillon → ordre → règles de veto) vit dans `packages/shared` sous forme de **fonctions pures** testées à 100 % ; la requête SQL ne fait que le pré-filtrage.
- Le hasard côté serveur utilise `crypto.randomInt` ; le `seed` est stocké pour rejouer / débugger un tirage.
- Autorisations : middleware API (`requireMember`, `requirePermission('kick')`…), couvertes par des tests d'intégration.

---

## 6. Protocole temps réel (salon)

```
client → server   session:open   { spaceId, vetosPerMember, voteTimeoutS, config }
server → room     session:opened { sessionId, openedBy, vetosPerMember, voteTimeoutS }
client → server   session:join   { sessionId }                  (présence)
server → room     session:presence { members: [{ userId, age, vetosLeft }], ageLimit }
client → server   spin:start     { sessionId }
server → room     spin:started   { spinId, sample[], winnerIndex, startsAt, durationMs,
                                   voteDeadline | null, imposed }
                  (startsAt = maintenant + ~800 ms pour que tous les téléphones démarrent ensemble)
client → server   spin:vote      { spinId, vote: 'ok' | 'veto' }
server → room     spin:votes     { spinId, votes: { userId: 'ok' | 'veto' | null } }
server → room     spin:result    { spinId, status: 'accepted' | 'vetoed', vetosRefunded: bool,
                                   vetosLeft: { userId: n } }
server → room     now_showing:updated { tmdbId }
```
- Votes attendus = **membres présents** dans la séance au moment du tirage. À `voteDeadline`, les votes manquants deviennent `ok` (job pg-boss).
- `imposed: true` → pas de vote, `spin:result` `accepted` suit la fin de l'animation.
- Un membre qui rejoint en cours reçoit `vetosLeft = vetosPerMember`.
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
      │                  → salon : ouvrir une séance (nb de vetos, délai de vote) · présents ·
      │                    vetos restants · compte à rebours
      │                  → machine à sous → affiche → 👍 / ✋ → « À l'affiche » · historique
      ├─ 📚 Bibliothèque  À voir (commun + partagés) · collections · catégories auto · Déjà vus
      ├─ 🔍 Découvrir     tendances, genres, années, recherche
      └─ 👤 Profil        mes salons, invitations reçues, notifications, son, utilisateurs
                          bloqués, déconnexion, supprimer mon compte

Salon › Réglages : membres, droits, inviter (lien / pseudo), demandes en attente, partage auto,
                   quitter (= supprimer si propriétaire) / supprimer
Fiche film : affiche, backdrop, date, genres, durée, classification, synopsis, réalisateur,
             casting, note, bande-annonce, qui l'a vu, ajouté par (badges), collections,
             [Ajouter à… (mon À voir / À voir commun / collections)] [Partager avec… ☑] [Je l'ai vu]
```

### Direction visuelle : Vieilles VHS
Charte complète : [`design/charte-graphique.html`](design/charte-graphique.html) (tokens, composants, mouvement, son, ton).
- **Concept** : l'étagère de cassettes enregistrées à la maison. Chaque film est une VHS avec une étiquette jaunie écrite au feutre ; la bibliothèque est « l'étagère », le film à l'affiche est « dans le magnéto ».
- **Palette** : étagère brun-noir, plastique noir, étiquettes crème ; moutarde pour l'action principale, bleu-vert pour OK, rouge passé pour le veto ; rayures délavées (rouge, orange, moutarde, bleu-vert) dans le logo. Thème sombre uniquement en v1.
- **Typo** : Archivo (italique large et grasse pour les titres et boutons, normale pour le texte), Permanent Marker pour les titres de films sur les étiquettes, IBM Plex Mono pour les compteurs.
- **Machine** : l'étagère défile puis ralentit, une cassette sort, entre dans le magnéto (LED « PLAY »), puis la jaquette apparaît. Sons mécaniques courts.
- **Interdits** : horreur, codes du cinéma classique (rideau, dorures), reflets irisés.

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
| **2. Comptes** | Inscription / connexion / pseudo / email, SMTP (vérification, reset), espace perso auto, blocage, suppression de compte. | Comptes fonctionnels. |
| **3. Films + À voir** | Proxy TMDB + cache, recherche, fiche film complète (bande-annonce), mon « À voir ». | Bibliothèque perso. |
| **4. Collections + vu** | Collections, vu / pas vu, Déjà vus, catégories auto, filtres. | Bibliothèque organisée. |
| **5. Machine (perso)** | Logique de tirage partagée, échantillon, animation, classification limitée par l'âge, « À l'affiche ». | Tirage solo. 🎰 |
| **6. Salons** | Création, invitations (lien avec validation + pseudo exact), App Links, rôles / droits, « À voir » commun, partage auto / manuel, badges, limites, suppression. | Salons complets. |
| **7. Machine (salon)** | Séances, présence, tirage synchronisé, vetos (budget, remboursement, « la machine a parlé »), délai de vote, limite d'âge des présents, notifications push, rappel 24 h. | Tirage à plusieurs. 🎉 |
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
| Salons | N membres (max 20, 10 salons par personne), propriétaire = créateur, droits délégables. |
| Cycle de vie | Le propriétaire qui quitte supprime le salon ; pas de transfert en v1. Suppression de compte = tout supprimer. |
| Invitations | Lien valable 7 jours avec validation des demandes ; pseudo exact uniquement ; blocage possible. |
| Âge | Date de naissance à l'inscription, pas d'âge minimum ; classification max = âge du plus jeune présent ; non classés exclus si un mineur est présent ; filtrage partout (machine, découverte, recherche) pour un mineur. |
| Vu | Booléen par personne, chacun confirme pour soi. Pas de note perso en v1. |
| Modes de tirage | Normal (v1) ; pondéré = mode séparé, plus tard. |
| Machine à sous | Ordre mélangé, échantillon aléatoire invisible, min. 2 films, relances illimitées. |
| Séance (salon) | Tirage en direct ; présents = connectés ; vetos par personne pour toute la séance, fixés par qui lance ; délai de vote réglable (sans réponse = OK) ; un veto = film écarté ; veto unanime (dès 2) = vetos rendus ; plus de veto = « la machine a parlé » ; arrivée en cours = budget complet ; film écarté exclu de la séance. |
| Résultat | Affiche → fiche complète avec bande-annonce ; « À l'affiche » (un seul par espace, perso et salons indépendants) ; rejet + relance possible ; rappel 24 h aux présents. |
| Son | Effets sonores de la machine activés par défaut, désactivables. |
| Langue | Français, i18n dès le départ ; titre FR + titre original. |
| Emails | SMTP dès la v1 (vérification + mot de passe oublié). |
| Serveur | Nginx existant comme reverse proxy ; prod + staging sur la même machine (≥ 4 Go de RAM). |
| SMTP | Brevo. |
| Direction visuelle | Vieilles VHS (charte dans `design/charte-graphique.html`). |
| Repo | Public, licence MIT. |
| Perso | Tirage local, sans veto. |
| Backend | API TypeScript sur serveur perso sous Docker. |
| Offline | Cache simple + gestion d'erreurs soignée. |
| Auth | Email + pseudo unique + mot de passe + date de naissance. Pas de Google pour l'instant. |
| Invitations | Lien (domaine dispo) ou recherche par pseudo. |
| Build | APK buildé dans GitHub Actions ; mises à jour OTA via EAS Update. |
| Qualité | Couverture maximale, CI/CD complète, envs dev / staging / prod. |
| Maquette | Artifact (HTML cliquable) en direction Vieilles VHS : `mockup/spinema-maquette.html`. |
| Plus tard | Tirage pondéré, Letterboxd, TikTok / Insta, thèmes, swipe, journal, iOS, séries, Google Play. |

---

## 11. Questions ouvertes

Aucune pour l'instant : toutes les questions sont tranchées et reportées dans le plan et au §10. Les nouvelles questions qui apparaîtront pendant la réalisation seront ajoutées ici.
