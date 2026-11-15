# Sécurité

## Signaler une faille

Merci de **ne pas ouvrir d'issue publique** pour une faille de sécurité.

Utilise plutôt le signalement privé de GitHub : onglet **Security** du dépôt, puis **Report a vulnerability**. Seule la mainteneuse le verra. Une réponse arrive en général sous une semaine.

Indique si possible :

- ce qui est touché (app Android, API, page web) et la version ;
- comment reproduire le problème ;
- l'impact possible.

## Versions suivies

Seule la dernière version publiée (release `v<version>` et version de test `preprod-latest`) reçoit des correctifs.

## Ce qui protège le dépôt

- Détection de secrets avec blocage des pushes qui en contiennent, et GitGuardian sur chaque pull request.
- Alertes et correctifs de sécurité Dependabot, et mises à jour hebdomadaires sur `dev`.
- Analyse de code CodeQL.
- Branches `dev`, `preprod` et `main` protégées (pas de suppression ni de réécriture, CI verte obligatoire), et tags `v*` non modifiables.
