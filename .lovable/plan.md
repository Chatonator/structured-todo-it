

# Factorisation de l'Application

## Résumé des changements effectués

### Session 1 : Nettoyage du code mort
- ✅ Supprimé `src/hooks/useAppState.ts` (hook jamais importé)
- ✅ Supprimé `src/hooks/useViewState.ts` (hook jamais importé)
- ✅ Supprimé `src/components/habits/HabitsView.tsx` (re-export orphelin)
- ✅ Supprimé `src/components/projects/ProjectsView.tsx` (re-export orphelin)
- ✅ Supprimé 6 hooks spécialisés inutilisés dans `useItems.ts` (`useTaskItems`, `useSubtaskItems`, `useProjectItems`, `useProjectTaskItems`, `useHabitItems`, `useDeckItems`)

### Session 2 : Factorisation structurelle
- ✅ Supprimé `src/components/views/index.ts` (barrel export jamais importé)
- ✅ Supprimé `src/components/primitives/lists/` (composants `ItemList` et `TaskList` jamais utilisés)
- ✅ Déplacé `useEisenhowerViewData` de `hooks/view-data/` vers `components/views/toolbox/tools/eisenhower/` (hook spécifique à l'outil, pas un hook de vue)
- ✅ Nettoyé l'export de `HomeHabitsSection` du barrel `home/index.ts` (utilisé uniquement localement via import relatif)
- ✅ Nettoyé `hooks/view-data/index.ts` (retiré l'export d'Eisenhower)

## Architecture actuelle

### Vues
Chaque vue a un seul emplacement canonique dans `src/components/views/{feature}/` :
- `home/` - HomeView avec widgets
- `observatory/` - ObservatoryView (analyse de productivité)
- `timeline/` - TimelineView
- `projects/` - ProjectsView (utilise `useUnifiedProjects`)
- `habits/` - HabitsView
- `rewards/` - RewardsView (utilise `useRewardsViewData`)
- `teams/` - TeamTasksView
- `toolbox/` - ToolboxView avec outils (Eisenhower, Rule 1-3-5)

### Hooks de données
- `hooks/view-data/` : hooks de données pour les vues (tasks, habits, projects, recurring, home, timeline, rewards, observatory)
- Les hooks d'outils restent dans leur dossier d'outil (`toolbox/tools/eisenhower/`, `toolbox/tools/rule135/`)

### Registre de vues
`src/components/routing/viewRegistry.ts` est la source de vérité unique pour le chargement lazy des vues.
