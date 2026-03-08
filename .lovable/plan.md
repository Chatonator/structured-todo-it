

## Améliorations globales de la gestion d'équipe

### 1. Liste des tâches d'équipe avec assignation directe

La vue équipe actuelle est un dashboard sans liste de tâches. On ajoute une section "Tâches de l'équipe" directement dans la vue avec :
- Liste des tâches actives (non complétées), groupées par assignation (Mes tâches / Non assignées / Autres membres)
- **Assignation rapide** via un dropdown avatar sur chaque tâche (sélection parmi les membres)
- Toggle de complétion inline
- Badge du membre assigné sur chaque ligne

Le hook `useTeamTasks` expose déjà `assignTask(taskId, userId)` et `toggleComplete`. Le composant `AssignmentSelector` existe déjà.

### 2. Boutons "Demander de l'aide" et "Encourager"

Sur chaque tâche d'équipe, deux petits boutons :
- **🆘 Demander de l'aide** : envoie une notification au reste de l'équipe ("X a besoin d'aide sur : [nom tâche]")
- **💪 Encourager** : sur les tâches des *autres* membres, envoie une notification d'encouragement au membre assigné

Utilise la table `notifications` existante avec un INSERT pour chaque membre concerné. Pas besoin de migration DB, le schéma supporte déjà les métadonnées JSON.

### 3. Améliorations globales du dashboard

- **Section tâches récentes** : affiche les 10 dernières tâches non complétées avec assignation inline
- **Filtre par membre** : dropdown pour filtrer les tâches par membre dans la liste
- **Compteur "Non assignées"** dans les stats (nouvelle card ou badge dans la card existante)

---

### Fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `src/components/views/teams/TeamTasksView.tsx` | Ajout section liste de tâches avec assignation, boutons aide/encouragement, filtre par membre |
| `src/hooks/view-data/useTeamViewData.ts` | Exposer `tasks`, `assignTask`, `toggleComplete`, fonctions d'envoi de notifications |
| `src/components/views/teams/TeamTaskCard.tsx` | **Nouveau** — Composant carte tâche d'équipe avec assignation rapide + boutons aide/encourager |

### Détails techniques

- L'assignation utilise `useTeamTasks.assignTask(taskId, userId)` existant
- Les notifications sont insérées via `supabase.from('notifications').insert(...)` — la RLS exige `auth.uid() = user_id`, donc on utilisera une edge function ou on insérera côté destinataire via une fonction SQL `SECURITY DEFINER`
- **Migration DB nécessaire** : une fonction SQL `send_team_notification` en `SECURITY DEFINER` pour insérer des notifications pour d'autres utilisateurs (la RLS actuelle ne permet d'insérer que pour soi-même)

