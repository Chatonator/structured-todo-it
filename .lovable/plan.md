# Integration de l'Observatoire et Organisation en Dossiers

## Statut: ✅ COMPLÉTÉ

## Résumé des Modifications

### Phase 1 : Correction de la Navigation ✅
- `src/contexts/AppContext.tsx` : Remplacé `tasks` et `completed` par `observatory`
- `src/components/layout/ViewNavigation.tsx` : Ajouté icône `Telescope` pour observatory

### Phase 2 : Organisation en Dossiers Collapsibles ✅
- **Créé** `src/components/views/observatory/components/TaskFolders.tsx`
  - Groupement par projet (dossiers collapsibles)
  - Sous-groupement par catégorie
  - Compteurs et stats par dossier
  - Mode compact avec une ligne par tâche
  - Actions: compléter, supprimer, restaurer

### Phase 3 : Hook de Groupement ✅
- `src/hooks/view-data/useObservatoryViewData.ts` : 
  - Ajouté type `TaskGroup` 
  - Fonction `groupedTasks` pour regrouper par projet puis catégorie
  - Exporté dans `data.groupedTasks`

### Intégration ObservatoryView ✅
- Toggle vue dossiers / vue tableau
- Tabs unifiés pour filtrer (Actives, Terminées, Zombies, Récentes)
- TasksTable accepte maintenant `hideTabBar` prop

## Structure Finale

```
ObservatoryView
├── InsightsCards (métriques)
├── Visualizations (heatmap, trends, donut)
├── View Mode Toggle (folders | table)
├── Tab Filters (active, completed, zombie, recent)
├── TaskFolders OR TasksTable (selon mode)
└── ActivityTimeline
```
