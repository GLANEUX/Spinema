# Spinema — Plan du projet

Application mobile pour choisir quoi regarder, seul ou à plusieurs : une **bibliothèque** de films à voir organisée en **collections**, une **roulette** pour tirer au sort, un mode **découverte** pour explorer tous les films, et le suivi **vu / pas vu**. La synchro avec **Letterboxd** viendra plus tard.

---

## 1. Concepts clés

### Espaces
Tout se passe dans un **espace**. Il en existe deux sortes :
- **Espace perso** : créé automatiquement à l'inscription, toujours présent, privé, on ne peut pas y inviter. L'app est donc utilisable seul, sans rien configurer.
- **Salons partagés** : créés à la demande (ex. « Nous deux », « Ciné entre potes »), on y invite **une ou plusieurs personnes** par **code / lien d'invitation**, sans limite fixe de membres. On peut en avoir plusieurs.

Un sélecteur d'espace en haut de l'app permet de passer de « Perso » à « Nous deux ».

### Bibliothèque et collections
Dans chaque espace :
- **À voir** (collection par défaut, toujours là) : tous les films enregistrés « à voir plus tard ». Chaque film ajouté y est automatiquement.
- **Collections personnalisées** : ex. « Soirée horreur », « Films doudous », « À voir avec maman ». Un film peut être dans plusieurs collections.
- **Déjà vus** (collection automatique, toujours là) : les films vus, marqués dans l'app (et plus tard depuis Letterboxd). **Exclue de la roulette par défaut**, mais on peut l'y ajouter (voir Roulette).
- **Catégories auto** : générées automatiquement à partir des infos du film, sans rien faire. Elles apparaissent dans la bibliothèque et servent de source ou de filtre pour la roulette (voir ci-dessous).

Quand un film de « À voir » est marqué vu, il passe dans « Déjà vus » et sort de la roulette par défaut, mais il reste dans ses collections personnalisées (affiché grisé avec un badge « Vu »).

Dans un salon partagé, « vu » se gère **par personne** : l'app affiche qui l'a vu (« Vu par Alex et Sam · pas par Lou »). Par défaut, la roulette n'utilise que les films que **personne** dans le salon n'a vus.

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
3. **Films déjà vus** — tous **décochés par défaut** (= « personne ne l'a vu ») :
   ```
   [ ] Inclure les films déjà vus            ← interrupteur global, coche / décoche tout
       [ ] vus par Alex
       [ ] vus par Sam
       [ ] vus par Lou
   ```
   Un film est exclu dès qu'un membre **décoché** l'a vu. Cocher « vus par Alex » ajoute les films que seul Alex a vus (pratique s'il veut bien les revoir). L'interrupteur global coche ou décoche toutes les lignes. Dans l'espace perso il n'y a qu'une ligne, donc juste l'interrupteur global.
4. **Tirage façon machine à sous** — un rouleau vertical qui fait défiler les titres (et affiches) des films du tirage, puis ralentit et s'arrête sur le film choisi. **L'ordre des films sur le rouleau est mélangé à chaque lancer**, pour qu'on ne puisse pas deviner où il va s'arrêter. Le film gagnant est tiré au hasard **avant** l'animation, et l'animation est calculée pour s'arrêter dessus.
5. Résultat → *Accepter* (le film est marqué vu) ou *Relancer*.

La roulette affiche le nombre de films dans le tirage avant de lancer (« 23 films dans la machine »). Les derniers réglages sont mémorisés par espace.

---

## 2. Fonctionnalités

### MVP (v1)
| # | Fonctionnalité | Détail |
|---|---|---|
| 1 | **Comptes** | Inscription / connexion (email + mot de passe, ou lien magique). Profil : pseudo, avatar. Espace perso créé automatiquement. |
| 2 | **Salons partagés** | Créer un salon, inviter une ou plusieurs personnes par code / lien, rejoindre, quitter. |
| 3 | **Bibliothèque + collections** | Recherche d'un film (via TMDB) → ajout à « À voir » + choix de collections. Créer / renommer / supprimer des collections. Mise à jour en temps réel dans les salons partagés. |
| 4 | **Vu / Pas vu** | Marquer vu (+ note optionnelle), collection automatique « Déjà vus », badges par membre dans les salons. |
| 5 | **Catégories auto** | Regroupement automatique de la bibliothèque par genre, type, durée, époque, pays / langue, réalisateur, note. |
| 6 | **Roulette** | Source = tout « À voir », des collections et/ou des catégories auto. Filtres (genre, type, durée, année, pays, note), films déjà vus exclus par défaut avec une case globale + une case par membre, machine à sous (ordre mélangé à chaque lancer) avec haptique, Accepter / Relancer, historique des tirages. |
| 7 | **Découverte** | Parcourir tous les films (tendances, populaires, par genre, par année) via TMDB. Depuis une fiche : *Ajouter à…* / *Déjà vu*. |

### Plus tard (à garder en tête, pas maintenant)
- **Synchro Letterboxd** : on saisit seulement son **pseudo Letterboxd**, import complet des films vus puis synchro automatique. Uniquement dans le sens **Letterboxd → Spinema**, et uniquement les **films vus**. Détails techniques en §3.
- **Partage depuis TikTok / Instagram** : depuis l'appli TikTok ou Insta, *Partager → Spinema* sur une vidéo qui parle d'un film. Spinema lit la légende / le titre de la vidéo, identifie le film (recherche TMDB, avec une IA si nécessaire pour comprendre la légende), affiche une confirmation (« C'est bien *Past Lives* (2023) ? ») et l'ajoute directement à « À voir ». Techniquement : *share extension* iOS + *intent filter* Android, possible avec Expo via un module de partage.
- **Roulettes à thème** : réglages de roulette enregistrés sous un nom (« Dimanche soir doudou » = Animation + déjà vus inclus), et thèmes prêts à l'emploi (« Ghibli », « Oscarisés »…).
- **Mode "Swipe"** à deux : chacun swipe des films, un *match* quand les deux aiment → ajouté à « À voir » du salon.
- Où regarder (Netflix, Prime, Disney+… via TMDB, région FR).
- Historique des soirées ciné, stats.
- Notifications (« Sam a ajouté 3 films »).
- Séries TV (v1 = films uniquement).
- Version iOS (v1 = Android uniquement).

---

## 3. Synchro Letterboxd par pseudo — *plus tard, pas dans la v1*

Noté ici pour ne pas perdre la réflexion. Le reste de l'app est conçu pour l'accueillir sans refonte : la table `watched` a déjà une colonne `source`, et on y ajoutera les champs Letterboxd le moment venu.

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
| App mobile | **Expo (React Native) + TypeScript** — *à confirmer, voir §10* | Ciblée **Android uniquement** pour la v1, mais garde iOS possible plus tard. Test immédiat avec *Expo Go*. Le partage depuis TikTok/Insta sera faisable plus tard (intent filter Android). |
| Navigation | Expo Router | Navigation par fichiers, simple. |
| Animations (machine à sous) | react-native-reanimated + expo-haptics | Défilement fluide 60 fps calculé sur le thread UI, vibration à chaque film qui passe. |
| Backend / BDD / Auth | **Supabase** (Postgres + Auth + Row Level Security + Realtime + Cron) | Gratuit à votre échelle, comptes inclus, temps réel, tâches planifiées. |
| Données films | **TMDB API** (gratuite) | Catalogue complet, affiches, genres, durées, recherche en FR. |
| Fonctions serveur | Supabase Edge Functions | Proxy TMDB (clé API cachée). Plus tard : synchro Letterboxd. |
| Distribution | EAS Build → APK Android (+ EAS Update pour les mises à jour sans réinstaller) | Installation directe sur vos deux téléphones Android. |

---

## 5. Modèle de données (Supabase / Postgres)

```
profiles           id (= auth.users.id), username, avatar_url, created_at
                   (plus tard : letterboxd_username, letterboxd_last_sync_at)

spaces             id, name, kind ('personal'|'shared'), owner_id,
                   invite_code (null si personal), created_at
                   → 1 espace 'personal' par utilisateur, créé par trigger à l'inscription
space_members      space_id, user_id, role ('owner'|'member'), joined_at   PK(space_id, user_id)

movies             tmdb_id (PK), title, original_title, year, release_date, poster_path,
                   runtime, genres (int[]), overview, vote_average,
                   original_language, countries (text[]), directors (jsonb),
                   updated_at                                             ← cache TMDB
                   → toutes les infos utilisées par les catégories auto et les filtres.
                     Le type est déduit : genre 16 = Animation, 99 = Documentaire,
                     runtime < 40 = Court métrage, sinon Film live.

library_items      id, space_id, tmdb_id, added_by, added_at, note      UNIQUE(space_id, tmdb_id)
                   → = la collection « À voir » de l'espace
collections        id, space_id, name, emoji, position, created_by, created_at
collection_items   collection_id, library_item_id, added_at             PK(collection_id, library_item_id)

watched            user_id, tmdb_id, watched_at, rating,
                   source ('app' ; plus tard 'letterboxd_rss'|'letterboxd_scrape'|'letterboxd_csv')
                   PK(user_id, tmdb_id)
                   → « Déjà vus » est calculée à partir de cette table (pas stockée comme collection)

spins              id, space_id, tmdb_id, spun_by,
                   source (jsonb: collections, catégories auto, filtres, membres dont les « vus » sont inclus),
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
  -- exclu si un membre dont la case « vus par … » est décochée l'a vu
  -- :watched_ok_users = membres cochés (vide par défaut = personne ne l'a vu)
  and not exists (
        select 1 from watched v
        join space_members m2 on m2.user_id = v.user_id and m2.space_id = li.space_id
        where v.tmdb_id = li.tmdb_id
          and v.user_id <> all(:watched_ok_users));
```
(Dans l'espace perso, il n'y a qu'un membre, donc c'est « films que je n'ai pas vus », ou tout si la case est cochée.)

---

## 6. Écrans

```
Auth ─ Connexion / Inscription
│
└─ [Sélecteur d'espace : Perso ▾ | Nous deux | + Créer / rejoindre]
   │
   └─ Onglets
      ├─ 🎡 Roulette      source (À voir / collections / catégories auto), filtres,
      │                   [ ] déjà vus (global + par membre), « 23 films », machine à sous, Accepter / Relancer
      ├─ 📚 Bibliothèque  À voir · mes collections · catégories auto · Déjà vus ;
      │                   créer une collection ; recherche + ajout
      ├─ 🔍 Découvrir     tendances, genres, recherche TMDB → fiche film
      └─ 👤 Profil        mes salons, inviter / rejoindre, déconnexion

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
| **6. Roulette** | Choix de la source (À voir / collections / catégories auto), filtres, cases « déjà vus » (global + par membre), machine à sous à ordre mélangé + haptique, accepter / relancer, historique. | Le cœur de l'app. 🎉 |
| **7. Salons partagés** | Création, invitation par code / lien (N membres), sélecteur d'espace, temps réel, badges « vu par… », cases « vus par » par membre dans la roulette. | Toi et ton copain (et d'autres) dans le même salon. |
| **8. Découverte** | Tendances, populaires, par genre, pagination infinie. | Explorer tous les films. |
| **9. Polish + build** | Thème sombre « cinéma », icône, splash, états vides, erreurs, build EAS Android. | App installée sur vos deux Android. |
| **Plus tard** | Synchro Letterboxd, partage TikTok / Insta, roulettes à thème, swipe/match, plateformes de streaming, stats, séries. | |

---

## 8. Ce qu'il te faudra créer (gratuit)
- Un compte **Supabase** (supabase.com) → URL du projet + clé `anon`.
- Une clé API **TMDB** (themoviedb.org → Paramètres → API).
- Un compte **Expo** (expo.dev) pour les builds, + l'app *Expo Go* sur vos téléphones.
- *(Optionnel : compte Google Play Console, 25 $ une fois, si vous préférez passer par un test interne Play Store plutôt que par un APK.)*

---

## 9. Décisions prises

| Sujet | Décision |
|---|---|
| Plateforme | **Android uniquement** pour la v1 (vous êtes tous les deux sur Android). |
| Roulette | **Machine à sous**, ordre des films **mélangé à chaque lancer**. |
| Contenu | **Films uniquement**, séries plus tard. |
| Salons | **N membres** (pas limité à 2). |
| Déjà vus | Par défaut **personne ne l'a vu**. Case globale + une case par membre. |
| Letterboxd | Plus tard. |
| Partage TikTok / Insta | Plus tard. |

---

## 10. Questions ouvertes

### A. Modèle produit
1. **Perso et salons : bibliothèques indépendantes ou reliées ?**
   - (a) Indépendantes : un film ajouté dans « Nous deux » n'est pas dans mon perso. Simple, mais il faut ajouter deux fois.
   - (b) Le salon **agrège** les « À voir » perso de ses membres + ses propres ajouts. Pas de double saisie, mais il faut pouvoir garder un film « privé ».
   - (c) Un film a **un seul propriétaire** (moi) et je le **partage** vers un ou plusieurs salons.
2. **Collections dans un salon** : modifiables par tout le monde, ou par leur créateur seulement ? Rôles (owner / admin / membre) : qui peut retirer un film ajouté par quelqu'un d'autre, exclure un membre, supprimer le salon ?
3. **Présents ce soir** : à 3+ membres, on ne regarde pas toujours tous ensemble. Faut-il un sélecteur « qui regarde ce soir ? » avant la roulette, qui servirait aussi à calculer « personne ne l'a vu » et à savoir qui marquer comme ayant vu le film ? Les cases « vus par … » ne montreraient alors que les présents.
4. **« Vu » = booléen ou journal ?** Un simple vu / pas vu, ou un historique de visionnages (dates, revisionnages, note par visionnage) ? Le journal coûte un peu plus maintenant, mais il correspond à ce que fournira Letterboxd plus tard et permet « revu 3 fois ».
5. **Accepter un tirage** : marque vu immédiatement pour tous les présents, ou crée un « en cours / prévu ce soir » à confirmer après le film (on peut abandonner un film au bout de 20 min) ?
6. **Quitter un salon** : les films que la personne a ajoutés restent dans le salon ? Ses « vus » cessent d'être pris en compte (normalement oui) ?

### B. Roulette
7. **Hasard uniforme ou pondéré ?** Tous les films ont la même chance, ou on pondère : films ajoutés il y a longtemps, « envie » notée par chaque membre (1 à 3 ★ d'envie), films jamais sortis au tirage, pénalité pour un film tiré puis refusé récemment ?
8. **Droit de veto** : en salon, chacun a-t-il un nombre de vetos limité par soirée (sinon on relance à l'infini) ? Et un film refusé est-il retiré du rouleau pour la suite de la soirée ?
9. **Tirage synchronisé** : en salon, faut-il que le tirage s'affiche **en direct sur tous les téléphones** (l'un lance, les autres voient la machine tourner) ? Ça implique un tirage côté serveur (seed partagé + Realtime) plutôt que local.
10. **Taille du rouleau** : avec 300 films à voir, on fait défiler tout le monde ou un échantillon (ex. 30 films dont le gagnant) ? Et avec 1 seul film dans le tirage, on tourne quand même ou on affiche directement ?

### C. Technique
11. **Expo / React Native ou Kotlin + Jetpack Compose ?** Pour du 100 % Android, Compose est natif et très confortable. Expo garde la porte iOS ouverte et facilite les mises à jour OTA. Tu as une préférence ou de l'expérience dans l'un des deux ?
12. **Backend** : OK pour Supabase ? Attention : un projet gratuit est **mis en pause après 7 jours sans activité** (relance manuelle). Alternatives : Firebase, ou ton propre backend (Node / Postgres) sur un VPS que tu as déjà ?
13. **Offline** : l'app doit-elle marcher sans réseau (consulter la bibliothèque, lancer la roulette) ? Si oui : cache local persistant (TanStack Query persisté) ou vrai offline-first avec synchro (SQLite + file d'écriture) et gestion des conflits ?
14. **Auth** : email + mot de passe, lien magique, **Google Sign-In** (naturel sur Android) ? Le pseudo doit-il être unique (utile pour inviter quelqu'un par pseudo plutôt que par code) ?
15. **Liens d'invitation** : un simple code à 6 caractères suffit, ou de vrais liens qui ouvrent l'app (Android App Links, demande un domaine) ? Les codes expirent-ils ?
16. **Données TMDB** : on cache en base uniquement les films ajoutés, avec quel rafraîchissement ? Titres et synopsis en **français**, avec repli en anglais ? (Rappel : TMDB demande d'afficher son attribution dans l'app.)
17. **Qualité / outillage** : tests (unitaires pour la logique du tirage et des filtres, e2e avec Maestro ?), CI GitHub Actions, migrations SQL versionnées dans le repo avec la CLI Supabase, environnements dev / prod séparés ?

### D. Design
18. Tu as une **direction visuelle** en tête (néon de casino rétro, ticket de cinéma, minimaliste sombre…) ou une maquette / Figma ? Ou tu veux qu'on fasse d'abord une maquette des écrans principaux ?
19. **Découverte** : masquer les films déjà vus et ceux déjà dans la bibliothèque ? Suggestions basées sur ta bibliothèque (TMDB « recommendations »), ou juste tendances / genres pour la v1 ?
