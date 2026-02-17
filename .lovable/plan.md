
# Moteur de recompenses : remplacement total du systeme de gamification

## Resume

Remplacer entierement le systeme de recompenses actuel (XP fixe par categorie, niveaux, achievements) par un moteur deterministe base sur la formule `sqrt(duree) x coefficient_quadrant x bonus_unique`, avec plafond micro-taches, streak par minutes importantes, et indicateurs hebdomadaires.

## Etat actuel

Le systeme actuel dans `useGamification.ts` :
- Attribue des XP fixes par categorie (Obligation=15, Quotidien=10, Envie=12, Autres=8)
- Gere un systeme de niveaux avec progression exponentielle
- Supporte les achievements et les defis
- La streak est basee sur des paliers fixes (7, 14, 30 jours)
- Les tables DB utilisees : `user_progress`, `xp_transactions`, `achievements`, `user_achievements`, `challenges`, `user_challenges`

Les appels a `rewardTaskCompletion` se font dans `useTasks.ts` (ligne 140), `rewardHabitCompletion` dans `useHabits.ts`, et `rewardProjectCreation`/`rewardProjectCompletion` dans `useProjects.ts`.

**Donnee manquante en DB** : il n'existe pas de compteur de reports (`postpone_count`) sur les taches. Il faudra l'ajouter.

## Plan d'implementation

### Phase 1 : Migration de la base de donnees

**Ajouter `postpone_count` a la table `items`** :

```text
ALTER TABLE items ADD COLUMN postpone_count integer NOT NULL DEFAULT 0;
```

**Ajouter `metadata` a la table `xp_transactions`** (deja existant en JSONB) pour stocker les details du calcul (base, coefficient, bonus, formule).

**Adapter `user_progress`** : Les colonnes existantes `total_xp`, `current_points`, `current_task_streak`, `longest_task_streak`, `tasks_completed`, `last_activity_date` sont reutilisees. Les colonnes `current_level`, `xp_for_next_level`, `lifetime_points` restent mais ne sont plus alimentees par le nouveau moteur (on garde les points comme unite unique). Les colonnes `daily_challenge_streak`, `weekly_challenges_completed` ne sont plus utilisees.

### Phase 2 : Moteur de calcul pur (nouveau fichier)

**Creer `src/lib/rewards/engine.ts`** -- module pur, sans effet de bord, facilement testable :

```text
Fonctions exportees :

1. computeTaskPoints(params: TaskRewardInput): TaskRewardResult
   - TaskRewardInput : { durationMinutes, isImportant, isUrgent, postponeCount, scheduledAt?, completedAt }
   - TaskRewardResult : { points, base, quadrantCoeff, bonusType, bonusValue, isMicroTask, formula }
   
   Logique :
   - base = sqrt(durationMinutes)
   - quadrantCoeff selon (isImportant, isUrgent) : 1.5, 1.6, 1.0, 0.7
   - bonus unique (exclusif, priorite anti-zombie) :
     - postponeCount >= 3 : 1.5
     - scheduledAt et completedAt definis :
       - diff > 48h : 1.20
       - diff <= 48h : 1.10
     - sinon : 1.00
   - points = Math.round(base * quadrantCoeff * bonusValue)
   - isMicroTask = durationMinutes <= 10

2. checkMicroTaskCap(microTasksCompletedToday: number): boolean
   - Retourne true si < 5 (scorable), false sinon

3. checkStreakDay(importantMinutesToday: number): boolean
   - Retourne true si >= 30 (minutes de taches importantes > 10 min)

4. computeWeeklySummary(tasks: WeeklyTaskEntry[]): WeeklySummary
   - WeeklyTaskEntry : { durationMinutes, isImportant, isUrgent, points }
   - WeeklySummary : {
       pctImportantNotUrgent, pctUrgent, pctMaintenance,
       alignmentScore (points important-non-urgent / points total)
     }
```

**Creer `src/lib/rewards/constants.ts`** -- toutes les constantes du moteur :

```text
QUADRANT_COEFFICIENTS = {
  'urgent-important': 1.5,
  'important-not-urgent': 1.6,
  'urgent-not-important': 1.0,
  'not-urgent-not-important': 0.7
}

ANTI_ZOMBIE_THRESHOLD = 3
ANTI_ZOMBIE_BONUS = 1.5
PLANNING_BONUS_LONG = 1.20
PLANNING_BONUS_SHORT = 1.10
PLANNING_THRESHOLD_HOURS = 48

MICRO_TASK_MAX_MINUTES = 10
MICRO_TASK_DAILY_CAP = 5

STREAK_MIN_IMPORTANT_MINUTES = 30
STREAK_MIN_TASK_DURATION = 10
```

**Creer `src/lib/rewards/index.ts`** -- re-exports.

### Phase 3 : Refonte du hook `useGamification.ts`

Remplacement complet de la logique interne :

**`rewardTaskCompletion(task)`** -- nouvelle version :
1. Extraire `durationMinutes` (= `task.estimatedTime`), `isImportant`, `isUrgent` depuis la tache
2. Recuperer `postpone_count` depuis la DB (items)
3. Recuperer la date de planification depuis `time_events` (si existe pour cette tache)
4. Appeler `computeTaskPoints(...)` du moteur
5. Verifier le plafond micro-taches : compter les transactions du jour avec `isMicroTask` dans metadata
6. Si plafonne : points = 0
7. Enregistrer dans `xp_transactions` avec metadata detaillee (base, coeff, bonus, formula)
8. Mettre a jour `user_progress.total_xp += points`, `tasks_completed += 1`
9. Verifier la streak :
   - Calculer les minutes importantes du jour (taches important=true, duree > 10 min, completees aujourd'hui)
   - Si >= 30 min et `last_activity_date !== aujourd'hui` : incrementer `current_task_streak`
   - Sinon si `last_activity_date` est hier : ne pas casser la streak
   - Sinon si `last_activity_date` < hier : remettre streak a 1 (ou 0 si pas qualifie)
   - Mettre a jour `longest_task_streak` si necessaire
10. Mettre a jour `last_activity_date`

**Supprimer** : `calculateXpForLevel`, `addXp` (remplace par logique directe), `rewardStreak` (ancien systeme de paliers), `checkAndUnlockAchievement`, `rewardProjectCreation`, `rewardProjectCompletion`, `getProgressPercentage` (plus de niveaux).

**Conserver** : `loadProgress`, `formatProgress`, `rewardHabitCompletion` (adaptee pour ne plus utiliser de niveaux).

**Nouvelles fonctions exposees** :
- `getDailyMicroTaskCount()` : compte les micro-taches scorees aujourd'hui
- `getWeeklySummary()` : calcule le resume hebdomadaire
- `getAlignmentScore()` : retourne le score d'alignement

### Phase 4 : Adapter les types

**`src/types/gamification.ts`** -- refonte :

```text
Supprimer : XP_CONFIG (ancien systeme)

Ajouter :
- TaskRewardInput, TaskRewardResult (interfaces du moteur)
- WeeklyTaskEntry, WeeklySummary
- DailyStreakInfo

Adapter UserProgress :
- Garder : totalXp (= total points), currentTaskStreak, longestTaskStreak, 
  tasksCompleted, lastActivityDate
- Deprecier/ignorer : currentLevel, xpForNextLevel, lifetimePoints, 
  currentPoints (tout est dans totalXp maintenant)
- Les habits restent inchanges
```

### Phase 5 : Adapter la vue Recompenses

**`src/components/rewards/ProgressOverview.tsx`** :
- Remplacer la carte "Niveau X" par une carte "Points totaux" avec le streak
- Remplacer la barre de progression XP par le score d'alignement hebdomadaire
- Afficher le resume hebdomadaire (3 pourcentages : Important non urgent / Urgent / Maintenance)
- Afficher le compteur de micro-taches du jour (X/5)

**`src/components/rewards/RecentActivity.tsx`** :
- Adapter pour afficher les details de calcul depuis metadata (base, coeff, bonus)
- Afficher "0 pts (plafond micro-taches)" quand applicable

**`src/hooks/view-data/useRewardsViewData.ts`** :
- Exposer les nouvelles donnees : weeklySummary, alignmentScore, dailyMicroCount, streakInfo
- Supprimer les references aux niveaux

**`src/components/views/rewards/RewardsView.tsx`** :
- Integrer les nouvelles cartes (resume hebdo, alignement, streak)

**`src/components/rewards/LevelUpAnimation.tsx`** :
- Transformer en "StreakAnimation" ou supprimer (plus de niveaux)

### Phase 6 : Incrementer `postpone_count`

Identifier ou les reports/replanifications se font :
- `rescheduleEventToBlock` dans `useTimelineScheduling.ts` (ligne 281)
- `rescheduleEvent` dans `useTimelineScheduling.ts` (ligne 247)

A chaque replanification d'un evenement lie a une tache, incrementer `postpone_count` sur l'item correspondant :

```text
await supabase
  .from('items')
  .update({ postpone_count: currentCount + 1 })
  .eq('id', taskId);
```

### Phase 7 : Nettoyage des appels

**`src/hooks/useTasks.ts`** (ligne 140) : `rewardTaskCompletion(task)` -- la signature reste identique, seul le calcul interne change.

**`src/hooks/useHabits.ts`** (ligne 218) : `rewardHabitCompletion` -- adapter pour ne plus utiliser de niveaux. Les habitudes ne participent pas au calcul de points du brief (seulement les taches). Garder le tracking basique ou le supprimer.

**`src/hooks/useProjects.ts`** (lignes 113, 213) : Supprimer `rewardProjectCreation` et `rewardProjectCompletion` (le brief ne prevoit pas de points pour les projets).

**`src/components/settings/sections/GamificationSettings.tsx`** : Adapter les toggles (supprimer "Notifications de niveau", adapter les labels).

## Fichiers impactes (resume)

| Fichier | Action |
|---|---|
| `supabase/migrations/` | Nouveau : ajouter `postpone_count` sur `items` |
| `src/lib/rewards/engine.ts` | Nouveau : moteur de calcul pur |
| `src/lib/rewards/constants.ts` | Nouveau : constantes |
| `src/lib/rewards/index.ts` | Nouveau : re-exports |
| `src/types/gamification.ts` | Refonte : nouveaux types, supprimer XP_CONFIG |
| `src/hooks/useGamification.ts` | Refonte majeure : nouveau calcul |
| `src/hooks/useTimelineScheduling.ts` | Modifier : incrementer postpone_count |
| `src/hooks/useProjects.ts` | Modifier : supprimer appels reward |
| `src/hooks/view-data/useRewardsViewData.ts` | Modifier : nouvelles donnees |
| `src/components/rewards/ProgressOverview.tsx` | Refonte UI |
| `src/components/rewards/RecentActivity.tsx` | Adapter affichage |
| `src/components/views/rewards/RewardsView.tsx` | Adapter structure |
| `src/components/rewards/LevelUpAnimation.tsx` | Supprimer ou transformer |
| `src/components/settings/sections/GamificationSettings.tsx` | Adapter |
| `src/integrations/supabase/types.ts` | Auto-genere apres migration |

## Risques et points d'attention

1. **Pas de compteur de reports actuellement** : La colonne `postpone_count` doit etre ajoutee. Les taches existantes demarrent a 0.
2. **Date de planification** : Elle est stockee dans `time_events.starts_at`, pas directement sur l'item. Il faut la recuperer via une requete jointe.
3. **Retrocompatibilite** : Les anciennes transactions XP resteront en base avec l'ancien format. La vue RecentActivity devra gerer les deux formats de metadata.
4. **Suppression des niveaux** : L'animation de level-up et la barre de progression niveau disparaissent. Si on veut les garder sous une autre forme, il faudra le preciser.
5. **Habits** : Le brief ne mentionne pas les habitudes dans le calcul de points. Elles continueront d'etre trackees mais ne genereront plus de points sauf decision contraire.
