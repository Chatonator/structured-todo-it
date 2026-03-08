

## Améliorations QOL pour la vue Équipe

### 1. Switcher d'équipe rapide dans le header de la vue
Quand l'utilisateur a plusieurs équipes, ajouter un dropdown dans le header de la vue (à côté du titre) pour changer d'équipe sans revenir à l'écran de sélection. Actuellement il faut désélectionner puis re-sélectionner.

### 2. Bouton "Quitter l'équipe"
Ajouter un bouton discret (destructif) dans la section membres ou en bas de page pour quitter une équipe. La fonction `leaveTeam` existe déjà dans le contexte mais n'est pas exposée dans la vue.

### 3. Confirmation avant actions destructives
Les actions "Retirer de l'équipe" et "Quitter l'équipe" n'ont aucune confirmation. Ajouter un `AlertDialog` pour éviter les clics accidentels.

### 4. Indicateur "Vous" sur sa propre ligne membre
Dans la liste des membres, marquer la ligne de l'utilisateur connecté avec un badge "Vous" pour se repérer rapidement. Actuellement tous les membres ont le même style.

### 5. Activité récente par membre
Afficher le nombre de tâches assignées/complétées par membre dans la liste (données déjà disponibles via `useTeamTasks`). Donne une vue d'ensemble de la contribution de chacun.

### 6. Bouton "Créer une équipe" même quand on en a déjà une
Actuellement les cartes Créer/Rejoindre n'apparaissent que quand `teams.length === 0`. Ajouter un bouton secondaire dans le header ou en bas de la vue pour créer/rejoindre une nouvelle équipe.

### 7. État vide amélioré pour stats à zéro
Quand l'équipe n'a aucune tâche ni projet, les stats affichent "0/0". Remplacer par un mini-onboarding ("Créez votre première tâche d'équipe") plus engageant.

---

### Fichiers modifiés
- `src/components/views/teams/TeamTasksView.tsx` — switcher, quitter, créer/rejoindre, onboarding
- `src/components/team/TeamMembersList.tsx` — badge "Vous", stats par membre
- `src/hooks/view-data/useTeamViewData.ts` — exposer `leaveTeam`, stats par membre, currentUserId

### Priorité suggérée
Les points 1, 2, 3, 4 sont rapides et à fort impact. Les points 5, 6, 7 sont des bonus.

