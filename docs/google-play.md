# Google Play : réponses aux formulaires

Ce qu'il faut déclarer dans la Play Console (**Règles et programmes > Contenu de l'appli**), d'après ce que fait réellement Spinema. À relire à chaque nouvelle fonctionnalité qui touche aux données (notifications push, rapports de plantage…).

## Liens à fournir

| Champ                            | Adresse                                 |
| -------------------------------- | --------------------------------------- |
| Politique de confidentialité     | `https://<domaine>/confidentialite/`    |
| Suppression du compte (lien web) | `https://<domaine>/suppression-compte/` |

Ces deux pages restent accessibles sans le code d'accès du staging, en attendant le site de production.

## Sécurité des données

**Collecte et partage**

- L'appli collecte des données : **oui**.
- Elles sont partagées avec des tiers : **non**. Les prestataires qui agissent pour nous (hébergement, envoi d'e-mails) ne comptent pas comme un partage au sens de Google.
- Les données sont chiffrées en transit : **oui** (HTTPS partout).
- Les utilisateurs peuvent demander la suppression de leurs données : **oui**, dans l'app et via le lien web ci-dessus.

**Types de données**

| Catégorie Google                                                  | Donnée                                | Collectée | Obligatoire | Finalités                                                   |
| ----------------------------------------------------------------- | ------------------------------------- | --------- | ----------- | ----------------------------------------------------------- |
| Infos personnelles > Adresse e-mail                               | e-mail du compte                      | oui       | oui         | Fonctionnement de l'appli, Gestion du compte                |
| Infos personnelles > ID utilisateur                               | pseudo                                | oui       | oui         | Fonctionnement de l'appli, Gestion du compte                |
| Infos personnelles > Autres infos                                 | date de naissance                     | oui       | oui         | Fonctionnement de l'appli (âge minimum, filtrage des films) |
| Activité dans l'appli > Autres contenus générés par l'utilisateur | listes, collections, films vus, votes | oui       | oui         | Fonctionnement de l'appli                                   |

**Non collecté** : position, contacts, photos et vidéos, audio, fichiers, agenda, messages, santé, finances, historique de navigation, identifiants publicitaires, rapports de plantage (pour l'instant).

## Public cible

- Tranches d'âge : **13-15**, **16-17** et **18 et plus**. L'inscription est refusée avant 15 ans.
- L'appli ne s'adresse pas aux enfants de moins de 13 ans : elle n'entre pas dans le programme « Familles ».

## Autres déclarations

| Formulaire                                    | Réponse                                                                                                                                                                                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Publicités                                    | Non                                                                                                                                                                                                                                                     |
| Accès à l'appli                               | Un compte est nécessaire : fournir à Google un compte de test (e-mail et mot de passe) dans ce formulaire                                                                                                                                               |
| Classification du contenu                     | Appli de référence et de catalogue de films. Les affiches et bandes-annonces viennent de TMDB, et les films au-dessus de l'âge de l'utilisateur sont masqués. Pas de contenu généré visible publiquement : les échanges restent dans des salons privés. |
| Appli d'actualités, de santé, gouvernementale | Non                                                                                                                                                                                                                                                     |
