# Spinema — Plan du projet

Application mobile pour choisir quoi regarder, seul ou à plusieurs : une **bibliothèque** de films à voir organisée en **collections**, une **roulette** pour tirer au sort, un mode **découverte** pour explorer tous les films, et le suivi **vu / pas vu** synchronisé automatiquement depuis **Letterboxd**.

---

## 1. Concepts clés

### Espaces
Tout se passe dans un **espace**. Il en existe deux sortes :
- **Espace perso** : créé automatiquement à l'inscription, toujours présent, privé, on ne peut pas y inviter. L'app est donc utilisable seul, sans rien configurer.
- **Salons partagés** : créés à la demande (ex. « Nous deux »), on y invite quelqu'un par **code / lien d'invitation**. On peut en avoir plusieurs.

Un sélecteur d'espace en haut de l'app permet de passer de « Perso » à « Nous deux ».

### Bibliothèque et collections
Dans chaque espace :
- **À voir** (collection par défaut, toujours là) : tous les films enregistrés « à voir plus tard ». Chaque film ajouté y est automatiquement.
- **Collections personnalisées** : ex. « Soirée horreur », « Films doudous », « À voir avec maman ». Un film peut être dans plusieurs collections.
- **Déjà vus** (collection automatique, toujours là) : les films vus, alimentée par l'app et par la synchro Letterboxd. **Exclue de la roulette par défaut**, mais on peut l'y ajouter (voir Roulette).
- **Catégories auto** : générées automatiquement à partir des infos du film, sans rien faire. Elles apparaissent dans la bibliothèque et servent de source ou de filtre pour la roulette (voir ci-dessous).

Quand un film de « À voir » est marqué vu, il passe dans « Déjà vus » et sort de la roulette par défaut, mais il reste dans ses collections personnalisées (affiché grisé avec un badge « Vu »).

Dans un salon partagé, « vu » se gère **par personne** : l'app affiche « Vu par toi, pas par lui », et la roulette propose un filtre « personne ne l'a vu » ou « au moins un ne l'a pas vu ».

### Catégories auto
Calculées à partir des données TMDB de chaque film de la bibliothèque. Seules les catégories qui contiennent au moins un film sont affichées, avec leur nombre de films.

| Critère | Exemples de catégories |
|---|---|
| **Genre** | Horreur, Comédie, Science-fiction, Romance, Thriller… |
| **Type** | Film live, Animation, Documentaire, Court métrage (< 40 min) |
| **Durée** | Moins de 1h30 · 1h30 – 2h · 2h – 2h30 · Plus de 2h30 |
| **Époque** | Années 70, 80, 90, 2000, 2010, 2020 · Avant 1970 · Sorti cette année |
| **Pays / langue** | Français, Coréen, Japonais, Anglais… |
| **Réalisateur** | Une catégorie par réalisateur dès qu'il a au moins 2 films dans la bibliothèque |
| **Note** | Très bien noté (≥ 7,5 sur TMDB) |

### Roulette
1. **Source** — on choisit une ou plusieurs sources, combinées entre elles :
   - **Tout « À voir »** (par défaut),
   - des **collections** perso,
   - des **catégories auto** (ex. « Horreur » + « Moins de 1h30 »).
2. **Filtres** — pour affiner : genre(s), type, durée max, période (année min / max), pays / langue, note minimale.
3. **Inclure les films déjà vus** — interrupteur, **désactivé par défaut**. Une fois activé, les films vus de la source sont ajoutés au tirage (ex. revoir un film doudou). Dans un salon : réglage « personne ne l'a vu » / « au moins un ne l'a pas vu » / « tous, même vus ».
4. Lancer la roue → *Accepter* (le film est marqué vu ce soir) ou *Relancer*.

La roulette affiche le nombre de films dans le tirage avant de lancer (« 23 films dans la roue »). Les derniers réglages sont mémorisés.

---

## 2. Fonctionnalités

### MVP (v1)
| # | Fonctionnalité | Détail |
|---|---|---|
| 1 | **Comptes** | Inscription / connexion (email + mot de passe, ou lien magique). Profil : pseudo, avatar, pseudo Letterboxd (optionnel). Espace perso créé automatiquement. |
| 2 | **Salons partagés** | Créer un salon, inviter par code / lien, rejoindre, quitter. |
| 3 | **Bibliothèque + collections** | Recherche d'un film (via TMDB) → ajout à « À voir » + choix de collections. Créer / renommer / supprimer des collections. Mise à jour en temps réel dans les salons partagés. |
| 4 | **Vu / Pas vu** | Marquer vu (+ note optionnelle), collection automatique « Déjà vus », badges par membre dans les salons. |
| 5 | **Catégories auto** | Regroupement automatique de la bibliothèque par genre, type, durée, époque, pays / langue, réalisateur, note. |
| 6 | **Roulette** | Source = tout « À voir », des collections et/ou des catégories auto. Filtres (genre, type, durée, année, pays, note), option « inclure les déjà vus » (désactivée par défaut), roue animée avec haptique, Accepter / Relancer, historique des tirages. |
| 7 | **Découverte** | Parcourir tous les films (tendances, populaires, par genre, par année) via TMDB. Depuis une fiche : *Ajouter à…* / *Déjà vu*. |
| 8 | **Synchro Letterboxd** | On saisit seulement son **pseudo Letterboxd**. Import complet des films vus au premier lien, puis synchro automatique. Uniquement dans le sens **Letterboxd → Spinema**, et uniquement les **films vus** (voir §3). |

### Plus tard (à garder en tête, pas maintenant)
- **Partage depuis TikTok / Instagram** : depuis l'appli TikTok ou Insta, *Partager → Spinema* sur une vidéo qui parle d'un film. Spinema lit la légende / le titre de la vidéo, identifie le film (recherche TMDB, avec une IA si nécessaire pour comprendre la légende), affiche une confirmation (« C'est bien *Past Lives* (2023) ? ») et l'ajoute directement à « À voir ». Techniquement : *share extension* iOS + *intent filter* Android, possible avec Expo via un module de partage.
- **Roulettes à thème** : réglages de roulette enregistrés sous un nom (« Dimanche soir doudou » = Animation + déjà vus inclus), et thèmes prêts à l'emploi (« Ghibli », « Oscarisés »…).
- **Mode "Swipe"** à deux : chacun swipe des films, un *match* quand les deux aiment → ajouté à « À voir » du salon.
- Où regarder (Netflix, Prime, Disney+… via TMDB, région FR).
- Historique des soirées ciné, stats.
- Notifications (« Sam a ajouté 3 films »).
- Séries TV.

---

## 3. Synchro Letterboxd par pseudo

Letterboxd n'a pas d'API publique, mais les pages des profils publics sont lisibles avec seulement le pseudo. Le plan :

| Étape | Source | Contenu |
|---|---|---|
| **Import initial** (au moment où on renseigne son pseudo) | Pages publiques `letterboxd.com/<pseudo>/films/page/N/` | **Tous** les films vus (~72 par page), avec la note. Lu côté serveur, page par page. |
| **Synchro auto** (toutes les quelques heures) | Flux RSS public `letterboxd.com/<pseudo>/rss/` | Les ~50 dernières entrées du journal, avec l'**ID TMDB** directement inclus → pas de correspondance approximative. |
| **Resynchro complète** (bouton manuel + 1×/semaine) | Pages `/films/` | Rattrape les films marqués vus sans entrée dans le journal (non présents dans le RSS). |

- Le travail est fait par une **fonction serveur planifiée** (Supabase Edge Function + cron), pas par le téléphone, donc ça tourne même app fermée.
- Correspondance avec TMDB : par l'ID TMDB quand il est disponible (RSS), sinon par le slug Letterboxd / titre + année, avec mise en cache.
- Un film vu sur Letterboxd est ajouté à « Déjà vus » et sort automatiquement de la roulette (sauf si « inclure les déjà vus » est activé).
- On ne supprime jamais un « vu » marqué dans l'app à cause de Letterboxd.

**Points d'attention** :
- Le profil Letterboxd doit être **public**.
- Lire les pages du site est une zone grise des conditions d'utilisation de Letterboxd, et le site peut bloquer ou changer sa structure. On reste raisonnable : un usage perso, peu de requêtes, un délai entre les pages. **Solution de secours** déjà prévue : importer le fichier CSV d'export Letterboxd (`watched.csv`) si la lecture des pages ne fonctionne plus. Le RSS, lui, est un flux officiel et stable.

---

## 4. Stack technique

| Couche | Choix | Pourquoi |
|---|---|---|
| App mobile | **Expo (React Native) + TypeScript** | Une seule base de code iOS + Android, test immédiat avec *Expo Go*. Le partage depuis TikTok/Insta sera aussi faisable plus tard. |
| Navigation | Expo Router | Navigation par fichiers, simple. |
| Animations (roue) | react-native-reanimated + react-native-svg + expo-haptics | Roue fluide 60 fps. |
| Backend / BDD / Auth | **Supabase** (Postgres + Auth + Row Level Security + Realtime + Cron) | Gratuit à votre échelle, comptes inclus, temps réel, tâches planifiées. |
| Données films | **TMDB API** (gratuite) | Catalogue complet, affiches, genres, durées, recherche en FR. |
| Fonctions serveur | Supabase Edge Functions | Proxy TMDB (clé API cachée), synchro Letterboxd. |
| Distribution | EAS Build → APK Android / TestFlight iOS | Installation sur vos téléphones. |

---

## 5. Modèle de données (Supabase / Postgres)

```
profiles           id (= auth.users.id), username, avatar_url,
                   letterboxd_username, letterboxd_last_sync_at, created_at

spaces             id, name, kind ('personal'|'shared'), owner_id,
                   invite_code (null si personal), created_at
                   → 1 espace 'personal' par utilisateur, créé par trigger à l'inscription
space_members      space_id, user_id, role ('owner'|'member'), joined_at   PK(space_id, user_id)

movies             tmdb_id (PK), title, original_title, year, release_date, poster_path,
                   runtime, genres (int[]), overview, vote_average,
                   original_language, countries (text[]), directors (jsonb),
                   letterboxd_slug, updated_at                             ← cache TMDB
                   → toutes les infos utilisées par les catégories auto et les filtres.
                     Le type est déduit : genre 16 = Animation, 99 = Documentaire,
                     runtime < 40 = Court métrage, sinon Film live.

library_items      id, space_id, tmdb_id, added_by, added_at, note      UNIQUE(space_id, tmdb_id)
                   → = la collection « À voir » de l'espace
collections        id, space_id, name, emoji, position, created_by, created_at
collection_items   collection_id, library_item_id, added_at             PK(collection_id, library_item_id)

watched            user_id, tmdb_id, watched_at, rating,
                   source ('app'|'letterboxd_rss'|'letterboxd_scrape'|'letterboxd_csv')
                   PK(user_id, tmdb_id)
                   → « Déjà vus » est calculée à partir de cette table (pas stockée comme collection)

spins              id, space_id, tmdb_id, spun_by, source (jsonb: collections, catégories auto, filtres, include_watched),
                   accepted (bool), created_at                           ← historique
```

**Sécurité (RLS)** : on ne voit que les espaces dont on est membre (et donc son espace perso) ; personne ne peut rejoindre un espace `personal` ; `watched` est lisible par les membres des espaces communs, modifiable seulement par son propriétaire.

Les **catégories auto ne sont pas stockées** : ce sont des filtres sur `movies` (ex. « Années 90 » = `year between 1990 and 1999`), calculés à la volée. Une vue `space_auto_categories` renvoie la liste des catégories non vides avec leur nombre de films.

Requête de la roulette (fonction Postgres `roulette_pool`) — films de la source choisie, filtrés, non vus par défaut :
```sql
select li.*, m.* from library_items li
join movies m on m.tmdb_id = li.tmdb_id
where li.space_id = :space
  -- source : collections perso (null = tout « À voir »)
  and (:collections is null or exists (
        select 1 from collection_items ci
        where ci.library_item_id = li.id and ci.collection_id = any(:collections)))
  -- catégories auto + filtres
  and (:genres     is null or m.genres && :genres)
  and (:max_runtime is null or m.runtime <= :max_runtime)
  and (:year_min   is null or m.year >= :year_min)
  and (:year_max   is null or m.year <= :year_max)
  and (:languages  is null or m.original_language = any(:languages))
  and (:min_rating is null or m.vote_average >= :min_rating)
  -- déjà vus exclus sauf si include_watched = true
  and (:include_watched or not exists (
        select 1 from watched v
        join space_members m2 on m2.user_id = v.user_id and m2.space_id = li.space_id
        where v.tmdb_id = li.tmdb_id));
```
(Dans l'espace perso, il n'y a qu'un membre, donc c'est « films que je n'ai pas vus ». Si on inclut les déjà vus, les films vus hors « À voir » — ceux venant de Letterboxd — sont aussi ajoutés quand la source est « Déjà vus ».)

---

## 6. Écrans

```
Auth ─ Connexion / Inscription
│
└─ [Sélecteur d'espace : Perso ▾ | Nous deux | + Créer / rejoindre]
   │
   └─ Onglets
      ├─ 🎡 Roulette      source (À voir / collections / catégories auto), filtres,
      │                   [ ] inclure les déjà vus, « 23 films dans la roue », roue, Accepter / Relancer
      ├─ 📚 Bibliothèque  À voir · mes collections · catégories auto · Déjà vus ;
      │                   créer une collection ; recherche + ajout
      ├─ 🔍 Découvrir     tendances, genres, recherche TMDB → fiche film
      └─ 👤 Profil        pseudo Letterboxd + état de la synchro, mes salons, inviter / rejoindre, déconnexion

Fiche film (modale) : affiche, synopsis, durée, genres, qui l'a vu,
                      [Ajouter à…  (À voir + collections)] [Je l'ai vu ★]
```

---

## 7. Étapes de réalisation

| Étape | Contenu | Livrable |
|---|---|---|
| **0. Setup** | Projet Expo + TS, lint, structure, projet Supabase, clé TMDB, variables d'env. | App vide qui tourne dans Expo Go. |
| **1. Comptes + espace perso** | Auth Supabase, `profiles`, création automatique de l'espace perso. | Compte créé, espace perso prêt. |
| **2. Films + bibliothèque** | Client TMDB (Edge Function), recherche, fiche film, ajout à « À voir ». | Bibliothèque perso fonctionnelle. |
| **3. Collections** | Créer / gérer des collections, ajouter un film à plusieurs collections. | Bibliothèque organisée. |
| **4. Vu / Pas vu** | Marquer vu + note, collection « Déjà vus », grisage dans les collections. | Suivi vu/pas vu. |
| **5. Catégories auto + filtres** | Enrichissement TMDB (type, pays, réalisateurs…), vue des catégories auto, écran de filtres. | Bibliothèque triée automatiquement. |
| **6. Roulette** | Choix de la source (À voir / collections / catégories auto), filtres, option « inclure les déjà vus », roue animée + haptique, accepter / relancer, historique. | Le cœur de l'app. 🎉 |
| **7. Salons partagés** | Création, invitation par code / lien, sélecteur d'espace, temps réel, badges « vu par… ». | Toi et ton copain dans le même salon. |
| **8. Synchro Letterboxd** | Import initial par les pages publiques, cron RSS, resynchro hebdo, matching TMDB, écran d'état, secours CSV. | Films vus Letterboxd synchronisés automatiquement. |
| **9. Découverte** | Tendances, populaires, par genre, pagination infinie. | Explorer tous les films. |
| **10. Polish + build** | Thème sombre « cinéma », icône, splash, états vides, erreurs, build EAS. | App installée sur vos téléphones. |
| **Plus tard** | Partage TikTok / Insta, roulettes à thème, swipe/match, plateformes de streaming, stats, séries. | |

---

## 8. Ce qu'il te faudra créer (gratuit)
- Un compte **Supabase** (supabase.com) → URL du projet + clé `anon`.
- Une clé API **TMDB** (themoviedb.org → Paramètres → API).
- Un compte **Expo** (expo.dev) pour les builds, + l'app *Expo Go* sur vos téléphones.
- *(iOS uniquement, pour une vraie installation hors Expo Go : compte Apple Developer, 99 €/an. Android : gratuit via APK.)*

---

## 9. Questions ouvertes
1. **iPhone, Android, ou un de chaque ?** (impacte la distribution)
2. **Roulette** : roue façon « roue de la fortune » avec les affiches, ou défilement façon machine à sous ?
3. **Films seulement**, ou aussi les **séries** dès le début ?
4. Dans un salon partagé, quand un seul des deux a vu un film : on le **garde dans la roulette par défaut** (filtre « au moins un ne l'a pas vu ») ou on l'**exclut** (« personne ne l'a vu ») ?
