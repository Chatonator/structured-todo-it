

# 3 nouvelles fonctionnalites equipe : Activite, Echeances, Charge de travail

## 1. Fil d'activite recente (Activity Feed)

**Nouvelle table** `team_activity_log` :
- `id`, `team_id`, `user_id`, `action` (task_completed, task_assigned, task_created, member_joined), `entity_type`, `entity_id`, `entity_name`, `metadata` (jsonb), `created_at`
- RLS : visible par les membres de l'equipe (`is_team_member`)
- Trigger DB sur `team_tasks` (INSERT, UPDATE sur `iscompleted`, `assigned_to`) pour inserer automatiquement des logs

**UI** : Card collapsible "Activite recente" dans `TeamTasksView` affichant les 10 derniers evenements avec avatar, action, et timestamp relatif. Abonnement Realtime pour mise a jour instantanee.

## 2. Dates d'echeance + badges retard

La colonne `scheduleddate` existe deja dans `team_tasks`. Pas de migration necessaire.

**`TeamTaskCard.tsx`** : Ajouter un badge inline :
- Rouge "En retard" si `scheduledDate < today` et pas complete
- Orange "Aujourd'hui" si `scheduledDate === today`
- Gris discret avec la date sinon

**`useTeamViewData.ts`** : Ajouter `overdueTasks` dans les stats (compteur de taches en retard).

**Header stats** : Ajouter un 5e indicateur "En retard" avec badge rouge dans la grille de stats quand > 0.

## 3. Vue charge de travail (Workload)

Pas de nouvelle table -- utilise `memberStats` deja calcule dans `useTeamViewData`.

**Nouveau composant** `TeamWorkloadCard.tsx` : Card collapsible affichant pour chaque membre :
- Nom + avatar
- Barre de progression (taches completees / assignees)
- Indicateur visuel : vert (< 5 taches), orange (5-10), rouge (> 10)
- "Aucune tache" en gris si 0 assignees

Integre dans `TeamTasksView` entre les stats et la section taches.

## Plan d'execution

| Etape | Fichier / Action |
|-------|-----------------|
| 1 | Migration SQL : table `team_activity_log` + RLS + trigger sur `team_tasks` |
| 2 | `src/hooks/useTeamActivity.ts` : hook pour charger + Realtime sur le feed |
| 3 | `src/components/views/teams/TeamActivityFeed.tsx` : composant feed collapsible |
| 4 | `src/components/views/teams/TeamWorkloadCard.tsx` : composant charge de travail |
| 5 | `src/components/views/teams/TeamTaskCard.tsx` : badges echeance |
| 6 | `src/hooks/view-data/useTeamViewData.ts` : ajouter `overdueTasks` aux stats |
| 7 | `src/components/views/teams/TeamTasksView.tsx` : integrer les 3 nouveaux composants |

