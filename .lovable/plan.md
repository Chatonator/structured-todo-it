

# Systeme de pauses de recuperation automatiques

## Concept

Quand une tache est planifiee dans la Timeline, le systeme cree automatiquement un evenement de pause juste apres, selon des regles intelligentes. La pause est non-negociable et impacte le temps total planifie.

## Regles de declenchement

```text
+------------------------------------------+
| REGLE 1 : Tache longue (>= 30 min)      |
| -> Pause = 20% de la duree              |
| Ex: 60 min -> 12 min, 45 min -> 9 min   |
+------------------------------------------+
| REGLE 2 : Tache importante              |
| (isImportant = true)                     |
| -> Pause meme si courte (min 5 min)     |
+------------------------------------------+
| REGLE 3 : Accumulation (travail chaine) |
| >= 60 min sans pause dans le bloc        |
| -> Pause de 10-15 min                   |
+------------------------------------------+
| PAS DE PAUSE :                           |
| Tache < 30 min, non-importante,          |
| et cumul < 60 min dans le bloc           |
+------------------------------------------+
```

Ratio pause : **20% de la duree** (arrondi a 5 min pres), minimum 5 min, maximum 20 min.

## Suggestions de recuperation

Liste par defaut (validee scientifiquement) :

| Suggestion | Icone |
|---|---|
| Marche 5-15 min | 🚶 |
| Etirements | 🧘 |
| Respiration lente | 🌬️ |
| Hydratation | 💧 |
| Pause sans ecran | 👁️ |

Une suggestion aleatoire est affichee sur chaque pause. L'utilisateur pourra a terme personnaliser la liste dans les settings.

## Apparence dans la Timeline

La pause apparait comme un evenement distinct, immediatement apres la tache declencheuse :

- Couleur differenciee (vert/bleu apaisant)
- Icone de pause (Coffee ou similar)
- Titre : suggestion aleatoire (ex: "🚶 Marche - 10 min")
- Non draggable (suit sa tache parente)
- Completable (check) et supprimable (X)

## Etapes techniques

### 1. Nouveau type d'evenement `recovery`

Ajouter `'recovery'` dans `TimeEventType` (fichier `src/lib/time/types.ts`). Pas de migration DB car `entity_type` est un champ texte libre.

### 2. Module de calcul des pauses

Creer `src/lib/time/RecoveryEngine.ts` :

- `shouldCreateBreak(task, blockEvents)` : applique les 3 regles (duree, importance, accumulation)
- `calculateBreakDuration(taskDuration)` : 20% arrondi a 5 min, min 5, max 20
- `getRandomSuggestion()` : pioche dans la liste
- `getCumulativeWorkWithoutBreak(blockEvents)` : calcule le temps cumule sans pause dans le bloc
- Constantes exportees : `BREAK_RATIO`, `MIN_BREAK`, `MAX_BREAK`, `ACCUMULATION_THRESHOLD`, `RECOVERY_SUGGESTIONS`

### 3. Integration dans `useTimelineScheduling.ts`

Modifier `scheduleTask` et `scheduleTaskToBlock` :
- Apres la creation reussie de l'evenement tache, appeler `shouldCreateBreak()`
- Si oui, creer un `time_event` de type `recovery` avec :
  - `entity_type: 'recovery'`
  - `entity_id: taskId` (lie a la tache parente)
  - `starts_at` = `ends_at` de la tache
  - `duration` = duree calculee
  - `title` = suggestion aleatoire
  - `description` = `recovery:taskId` (pour le lien)
  - `color` = couleur apaisante (#86efac)

Modifier `unscheduleEvent` : si on deplanifie une tache, supprimer aussi sa pause associee.

Modifier `rescheduleEvent` / `rescheduleEventToBlock` : recalculer et deplacer la pause.

### 4. Affichage dans `ScheduledEventCard.tsx`

Detecter `entity_type === 'recovery'` et appliquer un style different :
- Fond vert/bleu pale
- Icone Coffee au lieu de GripVertical
- Pas de drag handle (non draggable)
- Badge "Pause" visible

### 5. Impact sur le quota

Les pauses comptent dans le temps total planifie (deja le cas car ce sont des `time_events` avec une `duration`). La `DayPlanningView` les inclura automatiquement dans `totalScheduled`.

### 6. Filtrage dans `unscheduledTasks`

Les events `recovery` ne doivent pas apparaitre dans le panneau "A planifier". Ajouter un filtre `entity_type !== 'recovery'` si necessaire.

### Fichiers modifies

| Fichier | Action |
|---|---|
| `src/lib/time/types.ts` | Ajouter `'recovery'` au type `TimeEventType` |
| `src/lib/time/RecoveryEngine.ts` | **Nouveau** - Logique de calcul des pauses |
| `src/hooks/useTimelineScheduling.ts` | Creer pause apres planification, supprimer avec tache |
| `src/components/timeline/ScheduledEventCard.tsx` | Style specifique pour les pauses |
| `src/lib/time/index.ts` | Exporter le RecoveryEngine |

