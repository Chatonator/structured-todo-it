

# 3 nouvelles interactions sur les taches d'equipe

## Fonctionnalites

1. **S'attribuer** : Sur une tache non assignee, bouton rapide inline (pas dans le menu) pour s'auto-assigner en un clic + notification a l'equipe
2. **Signaler un blocage** : Dans le menu contextuel, marquer une tache comme "bloquee" avec une raison courte, visible par toute l'equipe via un badge
3. **Suivre une tache (Watch)** : Dans le menu contextuel, s'abonner aux mises a jour d'une tache sans y etre assigne

## Plan technique

### Migration SQL

- Ajouter colonne `is_blocked boolean DEFAULT false` et `blocked_reason text` sur `team_tasks`
- Nouvelle table `team_task_watchers` (`id`, `task_id`, `user_id`, `created_at`) avec RLS via `is_team_member`
- Mettre a jour le trigger `log_team_task_activity` pour logger les blocages

### `TeamTaskCard.tsx`

- **Bouton "S'attribuer"** : Quand `!task.assigned_to && !task.isCompleted`, remplacer l'icone `UserCircle` grisee par un bouton cliquable (tooltip "S'attribuer") qui appelle `onAssign(task.id, currentUserId)` + notification
- **Badge "Bloque"** : Si `task.is_blocked`, afficher un petit badge rouge "Bloque" inline (entre le nom et les autres badges)
- **Menu contextuel** : Ajouter "Signaler un blocage" (ouvre un petit input pour la raison) et "Suivre / Ne plus suivre"
- Nouvelles props : `onBlockTask`, `onToggleWatch`, `watchedByMe`

### `useTeamTasks.ts`

- Ajouter fonction `blockTask(taskId, reason)` : update `is_blocked = true, blocked_reason = reason`
- Ajouter fonction `unblockTask(taskId)` : update `is_blocked = false, blocked_reason = null`
- Mapper `is_blocked` et `blocked_reason` dans le type `TeamTask`

### Nouveau hook `useTaskWatchers.ts`

- Charge les watchers pour le team (ou par tache)
- `watchTask(taskId)` : insert dans `team_task_watchers`
- `unwatchTask(taskId)` : delete
- `isWatching(taskId)` : boolean

### `useTeamViewData.ts`

- Integrer `useTaskWatchers`
- Ajouter `handleBlockTask`, `handleUnblockTask`, `handleToggleWatch`
- `handleBlockTask` envoie une notification a l'equipe via `sendTeamNotification`
- `handleAssignToMe` : wrapper autour de `handleAssignTask` + notification equipe

### `TeamTasksView.tsx`

- Passer les nouvelles props aux `TeamTaskCard`

| Etape | Fichier |
|-------|---------|
| 1 | Migration SQL : colonnes blocage + table watchers |
| 2 | `useTeamTasks.ts` : blockTask/unblockTask + mapper |
| 3 | `useTaskWatchers.ts` : nouveau hook |
| 4 | `useTeamViewData.ts` : integrer les nouvelles actions |
| 5 | `TeamTaskCard.tsx` : bouton s'attribuer + badge bloque + menu watch/blocage |
| 6 | `TeamTasksView.tsx` : passer les nouvelles props |

