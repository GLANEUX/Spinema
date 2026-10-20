# Spinema — Plan du projet

Application mobile pour choisir quoi regarder à deux (ou plus) : une **bibliothèque partagée** de films à voir, une **roulette** pour tirer au sort, un mode **découverte** pour explorer tous les films, et le suivi **vu / pas vu** par personne (avec import Letterboxd).

---

## 1. Fonctionnalités

### MVP (v1)
| # | Fonctionnalité | Détail |
|---|---|---|
| 1 | **Comptes** | Inscription / connexion (email + mot de passe, ou lien magique). Profil : pseudo, avatar, pseudo Letterboxd (optionnel). |
| 2 | **Groupes ("Salons")** | Créer un salon (ex. « Nous deux »), inviter quelqu'un par **code / lien d'invitation**. Un utilisateur peut avoir plusieurs salons. |
| 3 | **Bibliothèque "À voir"** | Recherche d'un film (via TMDB) → ajout manuel à la liste du salon. Affiche, année, durée, genres, note. Qui l'a ajouté. |
| 4 | **Vu / Pas vu** | Chaque membre peut marquer un film « déjà vu » (+ note optionnelle). Visible : « Vu par Alex, pas par Sam ». |
| 5 | **Roulette** | Roue animée qui tire un film de la bibliothèque. **Filtres** : genre, durée max, « aucun de nous ne l'a vu », « au moins un ne l'a pas vu ». Boutons : *Accepter* (→ marquer comme vu ce soir) / *Relancer*. |
| 6 | **Découverte** | Parcourir tous les films (tendances, populaires, par genre, par année) via TMDB. Depuis une fiche : *Ajouter à la liste* / *Déjà vu*. |
| 7 | **Import Letterboxd** | Import du **fichier CSV d'export** Letterboxd (`watched.csv`, `watchlist.csv`, `ratings.csv`) → marque les films vus et peut remplir la bibliothèque. |

### v2 (après le MVP)
- **Roulettes à thème** : thèmes prédéfinis (« Soirée horreur », « Années 90 », « Moins de 1h40 », « Ghibli », « Oscarisés »…) + thèmes personnalisés (= filtres sauvegardés).
- **Mode "Swipe"** façon Tinder : chacun swipe des films de découverte, un *match* quand les deux aiment → ajouté à la liste.
- **Sync Letterboxd automatique** via le flux RSS public (`letterboxd.com/<pseudo>/rss/`) : récupère les derniers films vus régulièrement.
- Où regarder (Netflix, Prime, Disney+… via TMDB « watch providers », région FR).
- Historique des soirées ciné, stats du couple.
- Notifications (« Sam a ajouté 3 films »).
- Séries TV.

---

## 2. Letterboxd — ce qui est possible

Letterboxd **n'a pas d'API publique ouverte** (accès sur demande uniquement, rarement accordé à des projets perso). Donc :

1. **Import CSV (MVP)** — Letterboxd → Settings → Import & Export → *Export your data* → zip contenant `watched.csv`, `watchlist.csv`, `ratings.csv`, `diary.csv`. On parse le CSV dans l'app (titre + année) et on fait la correspondance avec TMDB. Fiable et complet.
2. **Flux RSS (v2)** — public, sans authentification, mais ne contient que les **~50 dernières entrées du journal**. Parfait pour une synchro incrémentale après l'import initial (une fonction serveur qui tourne toutes les X heures). Le RSS contient directement l'ID TMDB du film.
3. Pas d'écriture vers Letterboxd (on ne peut pas marquer « vu » sur Letterboxd depuis Spinema).

---

## 3. Stack technique proposée

| Couche | Choix | Pourquoi |
|---|---|---|
| App mobile | **Expo (React Native) + TypeScript** | Une seule base de code iOS + Android, test immédiat sur téléphone avec *Expo Go*, pas besoin de Mac pour iOS. |
| Navigation | Expo Router | Navigation par fichiers, simple. |
| Animations (roue) | react-native-reanimated + react-native-svg | Roue fluide 60 fps, haptique avec expo-haptics. |
| Backend / BDD / Auth | **Supabase** (Postgres + Auth + Row Level Security + Realtime) | Gratuit pour un usage perso, comptes inclus, temps réel (la liste se met à jour chez l'autre instantanément). |
| Données films | **TMDB API** (gratuite) | Catalogue complet, affiches, genres, durées, recherche FR, plateformes de streaming. |
| Fonctions serveur | Supabase Edge Functions | Proxy TMDB (cacher la clé API), sync RSS Letterboxd. |
| Distribution | EAS Build → APK Android / TestFlight iOS | Pour l'installer sur vos deux téléphones. |

---

## 4. Modèle de données (Supabase / Postgres)

```
profiles        id (= auth.users.id), username, avatar_url, letterboxd_username, created_at
groups          id, name, invite_code (unique), created_by, created_at
group_members   group_id, user_id, role ('owner'|'member'), joined_at        PK(group_id, user_id)
movies          tmdb_id (PK), title, original_title, year, poster_path,
                runtime, genres (int[]), overview, vote_average, updated_at   ← cache TMDB
watchlist_items id, group_id, tmdb_id, added_by, added_at, note           UNIQUE(group_id, tmdb_id)
watched         user_id, tmdb_id, watched_at, rating, source ('app'|'letterboxd_csv'|'letterboxd_rss')
                                                                            PK(user_id, tmdb_id)
themes (v2)     id, group_id (null = thème global), name, emoji, filters (jsonb)
spins           id, group_id, tmdb_id, spun_by, accepted (bool), created_at  ← historique
```

**Sécurité (RLS)** : un utilisateur ne voit que les salons dont il est membre et les listes de ces salons ; `watched` est lisible par les membres des salons communs, modifiable seulement par son propriétaire.

Requête clé de la roulette — « films de la liste que personne du salon n'a vus » :
```sql
select w.* from watchlist_items w
where w.group_id = :group
  and not exists (
    select 1 from watched v
    join group_members m on m.user_id = v.user_id and m.group_id = w.group_id
    where v.tmdb_id = w.tmdb_id);
```

---

## 5. Écrans

```
Auth ─ Connexion / Inscription
│
└─ Onglets
   ├─ 🎡 Roulette      choix du salon, filtres/thème, roue, résultat (Accepter / Relancer)
   ├─ 📚 Ma liste      bibliothèque du salon, tri/filtre, badges "vu par…", recherche + ajout
   ├─ 🔍 Découvrir     tendances, genres, recherche TMDB → fiche film
   └─ 👤 Profil        mes salons, inviter / rejoindre (code), import Letterboxd, déconnexion

Fiche film (modale) : affiche, synopsis, durée, genres, qui l'a vu,
                      [Ajouter à la liste] [Je l'ai vu ★]
```

---

## 6. Étapes de réalisation

| Étape | Contenu | Livrable |
|---|---|---|
| **0. Setup** | Projet Expo + TS, lint, structure de dossiers, projet Supabase, clé TMDB, variables d'env. | App vide qui tourne dans Expo Go. |
| **1. Comptes** | Auth Supabase, écran connexion/inscription, table `profiles`. | On peut créer un compte et se connecter. |
| **2. Salons** | Création de salon, code d'invitation, rejoindre, RLS. | Toi et ton copain dans le même salon. |
| **3. Films + Liste** | Client TMDB (via Edge Function), recherche, fiche film, ajout à la liste, temps réel. | Bibliothèque partagée fonctionnelle. |
| **4. Vu / Pas vu** | Marquer vu + note, badges par membre, filtres. | Suivi vu/pas vu. |
| **5. Roulette** | Roue animée + haptique, filtres, accepter/relancer, historique. | Le cœur de l'app. 🎉 |
| **6. Découverte** | Tendances, populaires, par genre, pagination infinie. | Explorer tous les films. |
| **7. Import Letterboxd** | Sélection du CSV/zip, parsing, matching TMDB (titre + année), écran de récap des films non trouvés. | Historique Letterboxd importé. |
| **8. Polish + build** | Thème sombre « cinéma », icône, splash, états vides, erreurs, build EAS. | App installée sur vos téléphones. |
| **v2** | Thèmes de roulette, swipe/match, sync RSS, plateformes de streaming, stats. | |

---

## 7. Ce qu'il te faudra créer (gratuit)
- Un compte **Supabase** (supabase.com) → URL du projet + clé `anon`.
- Une clé API **TMDB** (themoviedb.org → Paramètres → API).
- Un compte **Expo** (expo.dev) pour les builds, + l'app *Expo Go* sur vos téléphones.
- *(iOS uniquement, pour une vraie installation hors Expo Go : compte Apple Developer, 99 €/an. Android : gratuit via APK.)*

---

## 8. Questions ouvertes
1. **iPhone, Android, ou les deux ?** (impacte la distribution)
2. **Roulette** : roue classique type « roue de la fortune » avec les affiches, ou machine à sous / défilement d'affiches ?
3. **Films seulement**, ou aussi les **séries** dès le début ?
4. Thèmes de roulette dès la v1, ou d'abord la roulette avec filtres simples ?
5. Langue de l'app : français uniquement ?
