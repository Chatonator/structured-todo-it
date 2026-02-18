

# Verrouillage du moteur de recompenses : coherence, anti-farming, streak fiable

## Problemes identifies et corrections

### 1. Timeline ne declenche pas les points

**Probleme** : `handleCompleteEvent` (useTimelineScheduling.ts L428-453) appelle `updateTask(id, { isCompleted })` au lieu de `toggleTaskCompletion`. Or seul `toggleTaskCompletion` (useTasks.ts L123-142) appelle `rewardTaskCompletion`.

**Correction** : Remplacer `updateTask(task.id, { isCompleted: newStatus === 'completed' })` par `toggleTaskCompletion(task.id)` dans `handleCompleteEvent`. Importer `toggleTaskCompletion` depuis `useTasks` (deja disponible via le hook). Ajouter un guard : ne pas appeler si le toggle va vers "uncomplete" et qu'il y a deja une transaction (lie au point 2).

**Fichier** : `src/hooks/useTimelineScheduling.ts` (L428-453)

---

### 2. Farming par complete/uncomplete/recomplete

**Probleme** : Aucune barriere d'idempotence. Un utilisateur peut toggle une tache N fois et accumuler N transactions.

**Correction en deux couches** :

**Couche DB** : Ajouter un index unique sur `xp_transactions(user_id, source_type, source_id)`. Cela garantit qu'une seule transaction existe par tache par utilisateur. Toute tentative d'INSERT duplique echouera.

**Couche code** : Dans `rewardTaskCompletion`, avant l'INSERT, verifier si une transaction existe deja pour cette tache :
```text
SELECT id FROM xp_transactions 
WHERE user_id = ? AND source_type = 'task' AND source_id = ?
```
Si oui, ne pas inserer (et ne pas incrementer `tasks_completed`). Afficher un toast neutre "Deja comptabilise".

**Couche annulation** : Quand une tache est decomplete, ne PAS supprimer la transaction (les points restent acquis). C'est volontaire : on ne veut pas encourager le toggle pour "recalculer" avec de meilleures conditions.

**Fichiers** : Migration SQL + `src/hooks/useGamification.ts`

---

### 3. Streak non fiable

**Probleme** : La logique actuelle melange `lastActivityDate` (qui represente "dernier jour avec activite") avec "dernier jour qualifie pour la streak". Si un utilisateur complete des taches non-importantes, `lastActivityDate` est mis a jour mais la streak n'est pas incrementee. Le lendemain, le code pense que la veille etait "active" (car `lastActivityDate === yesterday`) mais elle n'etait pas qualifiee, et incremente quand meme.

Autre bug : si l'utilisateur qualifie la journee avec sa 3eme tache importante (atteignant 30 min), mais que `lastActivityDate` est deja a aujourd'hui (car une tache non-importante a ete faite plus tot), la branche `else if` (L219-223) ne gere que le cas `currentTaskStreak === 0`, ratant le cas ou la streak etait > 0 et pas encore incrementee aujourd'hui.

**Correction** : 

1. Ajouter une colonne `last_streak_qualified_date` (type `date`, nullable) dans `user_progress`.

2. Refactorer la logique streak dans `rewardTaskCompletion` :

```text
Si streakQualified ET last_streak_qualified_date !== aujourd'hui :
  Si last_streak_qualified_date === hier : streak += 1
  Sinon : streak = 1
  Mettre a jour last_streak_qualified_date = aujourd'hui
  Mettre a jour longest si necessaire

last_activity_date = aujourd'hui (toujours, independamment de la qualification)
```

Cette logique est idempotente : meme appelee plusieurs fois dans la journee, elle n'incremente la streak qu'une seule fois grace a `last_streak_qualified_date`.

**Fichiers** : Migration SQL + `src/hooks/useGamification.ts` + `src/types/gamification.ts`

---

### 4. Eisenhower toolbox : mapping inverse

**Probleme** : Dans `useEisenhowerViewData.ts`, le mapping est :
- Obligation -> urgent-important (correct)
- Quotidien -> not-urgent-important (FAUX : Quotidien = Urgent seul)
- Envie -> urgent-not-important (FAUX : Envie = Important seul)

Cela inverse les quadrants "Important seul" et "Urgent seul" dans la matrice visuelle.

**Correction** : Aligner le mapping sur la verite du systeme :
```text
Obligation -> urgent-important
Quotidien  -> urgent-not-important    (etait not-urgent-important)
Envie      -> important-not-urgent    (etait urgent-not-important : l'inverse !)  
Autres     -> not-urgent-not-important
```

Aussi : harmoniser les cles de quadrant avec celles du moteur de reward (`engine.ts` utilise `important-not-urgent`, le toolbox utilise `not-urgent-important`). Adopter les memes cles partout : `urgent-important`, `important-not-urgent`, `urgent-not-important`, `not-urgent-not-important`.

**Fichier** : `src/components/views/toolbox/tools/eisenhower/useEisenhowerViewData.ts`

---

### 5. Bonus planification : clarifier la semantique

**Probleme** : Le code recupere `time_events.created_at` (date de creation de l'evenement) comme `scheduledAt`, puis calcule `completedAt - scheduledAt`. Cela mesure "combien de temps avant la completion l'evenement a ete cree", pas "combien de temps avant la date prevue la tache a ete planifiee".

**Decision** : Garder la semantique actuelle ("j'ai planifie tot") car elle recompense la planification proactive, ce qui est conforme a la TMT (Temporal Motivation Theory). Mais utiliser `starts_at` au lieu de `created_at` pour que le bonus mesure "j'ai planifie cette tache pour un moment dans le futur" : `diff = starts_at - created_at`. Si la tache est planifiee > 48h avant sa date prevue : bonus long. Sinon : bonus court.

**Correction** : Dans `rewardTaskCompletion`, recuperer `created_at` ET `starts_at` du time_event. Calculer `scheduledDiff = starts_at - created_at` (en heures). Passer ce diff au moteur au lieu de `completedAt - scheduledAt`.

Adapter `computeTaskPoints` pour accepter un `planningLeadHours: number | null` au lieu de `scheduledAt/completedAt`.

**Fichiers** : `src/lib/rewards/engine.ts` + `src/hooks/useGamification.ts`

---

### 6. Metadata micro-tache capee : UX coherente

**Probleme** : Quand une micro-tache est capee, `finalPoints = 0` mais la formule dans metadata montre le calcul "normal" (ex: "sqrt(10) x 1.0 x 1.0 = 3"), ce qui est contradictoire avec les 0 points affiches.

**Correction** : Quand `capped = true`, ecraser `formula` dans la metadata par `"√X × Y × Z = N → capee (0 pts)"` et stocker `finalPoints: 0` en plus de `points: N` (points theoriques).

**Fichier** : `src/hooks/useGamification.ts`

---

### 7. Constantes hardcodees dans l'UI

**Probleme** : Le texte "30 min importantes restantes" dans `ProgressOverview.tsx` (L55) utilise le nombre 30 en dur au lieu de `STREAK_MIN_IMPORTANT_MINUTES`.

**Correction** : Importer la constante et l'utiliser.

**Fichier** : `src/components/rewards/ProgressOverview.tsx`

---

## Resume des fichiers modifies

| Fichier | Modifications |
|---|---|
| `supabase/migrations/` | (1) Index unique `xp_transactions(user_id, source_type, source_id)` (2) Colonne `last_streak_qualified_date` sur `user_progress` |
| `src/lib/rewards/engine.ts` | Remplacer `scheduledAt/completedAt` par `planningLeadHours` dans l'interface et le calcul |
| `src/hooks/useGamification.ts` | Guard idempotence avant INSERT, streak refactoree avec `last_streak_qualified_date`, formule capee, planning lead hours |
| `src/hooks/useTimelineScheduling.ts` | `handleCompleteEvent` utilise `toggleTaskCompletion` au lieu de `updateTask` |
| `src/hooks/useTasks.ts` | Aucune modification (deja correct) |
| `src/components/views/toolbox/tools/eisenhower/useEisenhowerViewData.ts` | Corriger le mapping categorie -> quadrant, harmoniser les cles |
| `src/types/gamification.ts` | Ajouter `lastStreakQualifiedDate` a `UserProgress` |
| `src/components/rewards/ProgressOverview.tsx` | Utiliser `STREAK_MIN_IMPORTANT_MINUTES` au lieu de 30 en dur |

## Ordre d'execution

1. Migration DB (index unique + colonne streak)
2. Moteur engine.ts (planningLeadHours)  
3. useGamification.ts (idempotence + streak + formule capee + planning)
4. useTimelineScheduling.ts (unifier completion)
5. useEisenhowerViewData.ts (mapping corrige)
6. Types + UI (ProgressOverview)

