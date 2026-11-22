# Politique de sécurité

Merci de prendre le temps de signaler un problème de sécurité dans Spinema. Cette page explique comment le faire, et ce qui se passe ensuite.

## Signaler une faille

**N'ouvre pas d'issue publique** pour une faille : tout le monde pourrait la lire avant qu'elle soit corrigée.

Signale-la en privé sur GitHub :

1. Va sur **[Report a vulnerability](https://github.com/GLANEUX/Spinema/security/advisories/new)** (onglet **Security** du dépôt, puis **Report a vulnerability**).
2. Décris le problème. Seule la mainteneuse du projet voit le message.

Indique si possible :

- la partie touchée : app Android, API, page web ou infrastructure ;
- la version (numéro de l'app, ou commit) ;
- les étapes pour reproduire le problème ;
- l'impact possible : quelles données, quels utilisateurs ;
- une idée de correctif, si tu en as une.

## Ce qui se passe ensuite

| Étape                        | Délai                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------- |
| Accusé de réception          | sous 3 jours                                                                 |
| Première évaluation          | sous 7 jours                                                                 |
| Correctif d'une faille grave | sous 30 jours, en général bien avant                                         |
| Publication de l'avis        | une fois le correctif disponible, au plus tard 90 jours après le signalement |

Tu es tenu au courant à chaque étape. Si tu le souhaites, ton nom figure dans l'avis de sécurité publié avec le correctif.

Spinema est un projet personnel, maintenu sur le temps libre : ces délais sont des engagements sincères, pas un contrat.

## Versions suivies

| Version                                     | Correctifs de sécurité |
| ------------------------------------------- | ---------------------- |
| Dernière release `v<version>` (Google Play) | oui                    |
| Version de test `preprod-latest`            | oui                    |
| Versions plus anciennes                     | non : mettre à jour    |

## Périmètre

Sont concernés :

- l'app Android (`fr.spinema.app` et `fr.spinema.app.preview`) ;
- l'API (`api.spinema.fr`, `api.staging.spinema.fr`) ;
- les pages web (`spinema.fr`, `staging.spinema.fr`) ;
- le code et la configuration de ce dépôt (workflows, scripts, Docker).

Ne sont pas concernés : les services tiers (Google Play, GitHub, TMDB, Brevo), à signaler directement à leurs éditeurs, et les attaques qui demandent un accès physique au téléphone déverrouillé.

## Règles de bonne conduite

Les recherches de bonne foi sont les bienvenues. Pour qu'elles le restent :

- ne teste qu'avec tes propres comptes et tes propres données ;
- n'accède pas aux données des autres utilisateurs, ne les modifie pas et ne les supprime pas ;
- pas de déni de service, de spam ni d'ingénierie sociale ;
- laisse le temps de corriger avant d'en parler publiquement.

Dans ce cadre, aucune poursuite ne sera engagée contre toi.

## Comment le projet se protège

- Détection de secrets, avec blocage des pushes qui en contiennent, et GitGuardian sur chaque pull request.
- Alertes et correctifs Dependabot, et mises à jour régulières des dépendances.
- Analyse de code CodeQL, et note OpenSSF Scorecard chaque semaine.
- Branches `dev`, `preprod` et `main` protégées : pas de suppression ni de réécriture, CI verte obligatoire. Tags `v*` non modifiables.
- Actions GitHub épinglées sur un commit précis, liste fermée d'actions autorisées, jeton des workflows en lecture seule par défaut.
- Clés de signature et de déploiement dans des environnements GitHub protégés, lisibles seulement depuis les branches de release.
- Images Docker épinglées par empreinte, serveurs joignables uniquement en HTTPS.
