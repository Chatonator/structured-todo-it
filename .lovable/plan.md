

# Audit d'unification — duplications restantes

## 1. `priorityMap` dupliqué 3 fois

Le mapping priorité → niveau numérique est défini localement dans **3 fichiers** alors que `getPriorityLevel()` existe déjà dans `lib/styling.ts` :

| Fichier | Code dupliqué |
|---|---|
| `UnscheduledTasksPanel.tsx` | `const priorityMap = { 'Le plus important': 4, ... }` |
| `time-sync/helpers.ts` | `const priorityMap = { 'Le plus important': 4, ... }` |
| `lib/time/EventNormalizer.ts` | `const priorityMap = { 'Le plus important': 4, ... }` |

**Action** : Remplacer par `import { getPriorityLevel } from '@/lib/styling'`.

## 2. `priorityColors` dupliqué dans ResizableEvent et ScheduledEvent

Le mapping identique `{ 4: 'bg-priority-highest/20 border-l-priority-highest', ... }` est copié-collé dans :
- `ResizableEvent.tsx`
- `ScheduledEvent.tsx`

**Action** : Centraliser dans `lib/styling.ts` via une nouvelle fonction `getPriorityEventClasses(level: number)`.

## 3. Tri par priorité reconstruit dans `UnscheduledTasksPanel`

`UnscheduledTasksPanel.tsx` implémente manuellement un système de filtre + tri (search, sort, source filter) alors que `useTaskFilters` existe déjà et est utilisé par `ProjectDetail` et `TeamProjectDetail`.

**Action** : Migrer vers `useTaskFilters` pour éliminer la logique de tri/filtre locale (≈30 lignes).

## 4. `SchedulingSection.formatTime` — faux positif

La fonction `formatTime(hour, minute)` dans `SchedulingSection.tsx` formate des heures HH:MM (pas des durées). Ce n'est **pas** une duplication de `formatDuration` — c'est un usage différent. Pas d'action.

---

## Fichiers impactés

| Fichier | Action |
|---|---|
| `src/lib/styling.ts` | Ajouter `getPriorityEventClasses()` |
| `src/components/timeline/UnscheduledTasksPanel.tsx` | Remplacer `priorityMap` par `getPriorityLevel`, envisager `useTaskFilters` |
| `src/components/timeline/ResizableEvent.tsx` | Utiliser `getPriorityEventClasses` |
| `src/components/timeline/ScheduledEvent.tsx` | Utiliser `getPriorityEventClasses` |
| `src/hooks/time-sync/helpers.ts` | Remplacer `priorityMap` par `getPriorityLevel` |
| `src/lib/time/EventNormalizer.ts` | Remplacer `priorityMap` par `getPriorityLevel` |

## Estimation

6 fichiers modifiés, ~50 lignes supprimées, 1 fonction ajoutée. Refactorisation pure sans impact fonctionnel.

