

# Labels/Tags + Commentaires sur les tâches d'équipe

## 1. Labels/Tags personnalisés

### Base de données
Nouvelle table `team_labels` :
- `id` uuid PK
- `team_id` uuid FK → teams
- `name` text (ex: "frontend", "urgent-client")
- `color` text (couleur hex, défaut "#6366f1")
- `created_by` uuid
- `created_at` timestamptz

Table de jonction `team_task_labels` :
- `id` uuid PK
- `task_id` uuid FK → team_tasks
- `label_id` uuid FK → team_labels

RLS via `is_team_member` pour les deux tables.

### Code
- **`useTeamLabels.ts`** : Hook pour CRUD labels + association task↔label. Charge les labels de l'équipe et les associations.
- **`TeamTaskCard.tsx`** : Afficher les labels sous forme de petits badges colorés inline après le nom. Dans le menu contextuel, sous-menu "Labels" avec checkboxes pour ajouter/retirer.
- **`TeamTasksView.tsx`** : Section de gestion des labels dans les paramètres d'équipe (créer, renommer, supprimer, changer couleur).

## 2. Commentaires sur les tâches

### Base de données
Nouvelle table `team_task_comments` :
- `id` uuid PK
- `task_id` uuid FK → team_tasks
- `user_id` uuid
- `content` text
- `created_at` timestamptz

RLS : lecture/écriture pour les membres de l'équipe (via `is_watcher_team_member` ou similaire pour vérifier que le user est membre de l'équipe de la tâche).

### Code
- **`useTeamComments.ts`** : Hook pour charger/ajouter des commentaires sur une tâche. Realtime subscription pour mise à jour instantanée.
- **`TeamTaskCard.tsx`** : Petit compteur de commentaires (icône bulle + nombre) cliquable pour ouvrir un panneau/dialog.
- **`TeamCommentThread.tsx`** : Nouveau composant — liste des commentaires + input pour en ajouter. Affiche avatar, nom, date, contenu. Dialog ou collapsible sous la carte.
- Notification à l'équipe quand un commentaire est ajouté (via `send_team_notification`).

## Résumé des fichiers

| Étape | Fichier |
|-------|---------|
| 1 | Migration SQL : tables labels, task_labels, comments + RLS |
| 2 | `useTeamLabels.ts` : CRUD labels + associations |
| 3 | `useTeamComments.ts` : CRUD commentaires + realtime |
| 4 | `TeamCommentThread.tsx` : UI fil de commentaires |
| 5 | `TeamTaskCard.tsx` : badges labels + compteur commentaires + menu labels |
| 6 | `TeamTasksView.tsx` : gestion des labels d'équipe |
| 7 | `useTeamViewData.ts` : intégrer les nouveaux hooks |

