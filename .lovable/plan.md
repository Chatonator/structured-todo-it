

# Audit d'unification — duplications restantes (round 3)

## 1. Persistance localStorage avec pattern "daily reset" dupliqué 4 fois

Le même pattern `{ date: today, data }` avec try/catch et vérification de la date du jour est copié-collé dans :

| Fichier | Clé | Pattern |
|---|---|---|
| `useTaskLinker.ts` | `taskLinker:*` | `loadPersistedIds()` / `persistIds()` |
| `useRule135Tool.ts` | `rule135_selection` | `loadSelection()` / `saveSelection()` |
| `usePomodoroTool.ts` | `pomodoro_sessions_*` | `getTodaySessions()` / `saveTodaySessions()` |
| `toolLaunchHelpers.ts` | `toolbox_launched_tools` | `getLaunchedTools()` / `markToolLaunched()` |

**Action** : Créer un utilitaire `lib/storage.ts` avec 2 fonctions :
- `loadDailyStorage<T>(key, fallback)` — charge et vérifie la date
- `saveDailyStorage<T>(key, data)` — persiste avec la date du jour
- `loadStorage<T>(key, fallback)` / `saveStorage<T>(key, data)` — version sans expiration quotidienne

Puis remplacer les implémentations locales.

## 2. Calcul de stats `{ total, completed, completionRate }` dupliqué 6 fois

Le même calcul `done / total * 100` est reconstruit dans :
- `useTeamViewData.ts` (stats team)
- `useHomeViewData.ts` (stats home)
- `useRule135Tool.ts` (stats rule135)
- `useUnifiedTasks.ts` (completionRate)
- `useTasks.ts` (completionRate)
- `TeamProjectDetail.tsx` (stats projet)

**Action** : Ajouter une fonction utilitaire dans `lib/formatters.ts` :
```ts
function computeCompletionStats<T>(items: T[], isCompleted: (item: T) => boolean)
  : { total: number; completed: number; completionRate: number }
```

## 3. Pattern empty state reconstruit ~15 fois

Le pattern "icône + texte principal + texte secondaire" pour les états vides est reconstruit manuellement dans ~15 composants avec des structures HTML quasi identiques. Le composant `ViewEmptyState` existe déjà mais n'est utilisé que par les vues principales.

**Impact faible, complexité élevée** — à traiter dans un futur sprint dédié UI. Pas inclus dans cette phase.

---

## Fichiers impactés

| Fichier | Action |
|---|---|
| `src/lib/storage.ts` | **Nouveau** — utilitaires de persistance localStorage |
| `src/lib/formatters.ts` | Ajouter `computeCompletionStats()` |
| `src/components/views/toolbox/shared/useTaskLinker.ts` | Utiliser `loadDailyStorage` / `saveDailyStorage` |
| `src/components/views/toolbox/tools/rule135/useRule135Tool.ts` | Utiliser `loadDailyStorage` / `saveDailyStorage` |
| `src/components/views/toolbox/tools/pomodoro/usePomodoroTool.ts` | Utiliser `loadDailyStorage` / `saveStorage` |
| `src/components/views/toolbox/components/toolLaunchHelpers.ts` | Utiliser `loadStorage` / `saveStorage` |
| `src/hooks/view-data/useTeamViewData.ts` | Utiliser `computeCompletionStats` |
| `src/hooks/view-data/useHomeViewData.ts` | Utiliser `computeCompletionStats` |
| `src/hooks/useUnifiedTasks.ts` | Utiliser `computeCompletionStats` |
| `src/hooks/useTasks.ts` | Utiliser `computeCompletionStats` |
| `src/components/team/TeamProjectDetail.tsx` | Utiliser `computeCompletionStats` |

## Estimation

1 fichier créé, 1 modifié, 9 nettoyés. ~80 lignes de code dupliqué supprimées.

