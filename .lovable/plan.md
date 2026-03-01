

## Remise a zero du systeme de recompenses

### Objectif

Remettre tous les utilisateurs a zero sur le systeme de gamification suite au changement du systeme de raffinage, sans toucher aux taches, projets ni habitudes.

### Donnees a supprimer / reinitialiser

| Table | Action | Impact |
|---|---|---|
| `xp_transactions` | DELETE toutes les lignes | Supprime tout l'historique de points gagnes |
| `claim_history` | DELETE toutes les lignes | Supprime l'historique des recompenses reclamees |
| `user_skills` | DELETE toutes les lignes | Remet les competences a zero |
| `user_achievements` | UPDATE `current_progress = 0`, `is_unlocked = false`, `unlocked_at = NULL` | Reinitialise la progression des succes |
| `user_challenges` | UPDATE `current_progress = 0`, `is_completed = false`, `completed_at = NULL` | Reinitialise les defis en cours |
| `user_progress` | UPDATE tous les compteurs a 0 | Remet XP, points, streaks, compteurs a zero |

### Donnees NON touchees

- `items` (taches, projets) — intact
- `habits` / `habit_completions` — intact
- `time_events` / `time_occurrences` — intact
- `rewards` (definitions des recompenses custom) — intact
- `teams` / `team_tasks` / `team_projects` — intact
- `profiles` — intact

### Detail de la reinitialisation `user_progress`

Tous les champs remis a leur valeur par defaut :
- `total_xp = 0`, `current_level = 1`, `xp_for_next_level = 100`
- `lifetime_points = 0`, `current_points = 0`
- `points_available = 0`, `total_points_earned = 0`, `total_points_spent = 0`
- `tasks_completed = 0`, `habits_completed = 0`
- `current_task_streak = 0`, `longest_task_streak = 0`
- `current_habit_streak = 0`, `longest_habit_streak = 0`
- `last_activity_date = NULL`, `last_streak_qualified_date = NULL`
- `daily_challenge_streak = 0`, `weekly_challenges_completed = 0`

### Execution

6 requetes SQL via l'outil d'insertion de donnees (pas de migration de schema).

