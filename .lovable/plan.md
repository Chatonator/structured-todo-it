# Plan "Table Rase" - Parité Projets Perso/Équipe

## ✅ Phases Complétées

### Phase 1 : Migrations DB ✅
- [x] Ajout de `kanban_columns` (JSONB) à `team_projects`
- [x] Ajout de `project_status` (TEXT) à `team_tasks`
- [x] Index sur `project_status` pour performances

### Phase 2 : Hooks et Config Partagés ✅
- [x] Création de `src/config/taskFilterOptions.ts` - Options de tri/filtrage partagées
- [x] Création de `src/hooks/useTaskFilters.ts` - Hook générique de filtrage

### Phase 3 : Mise à jour Hooks Équipe ✅
- [x] `useTeamProjects.ts` - Support `kanbanColumns`
- [x] `useTeamProjectTasks.ts` - Support `projectStatus` pour Kanban 3+ colonnes
- [x] `useTeamTasks.ts` - Mapping du nouveau champ `project_status`

### Phase 4 : Enrichissement Composants ✅
- [x] `KanbanBoard.tsx` - Ajout prop `renderTaskBadge` pour avatars assignation
- [x] `TeamProjectDetail.tsx` - Toutes les fonctionnalités :
  - Gestionnaire de colonnes Kanban (`KanbanColumnManager`)
  - Modal `TaskModal` complet pour créer/éditer
  - Bouton "Terminer" fonctionnel
  - Avatars des membres assignés dans le Kanban
  - Hook `useTaskFilters` pour filtrage/tri
  - Options de tri par assignation

### Phase 5 : Types Unifiés ✅
- [x] `UnifiedProject` inclut `kanbanColumns`
- [x] Adaptateurs `teamProjectToUnified` mis à jour

## Architecture Finale

```
┌─────────────────────────────────────────────────────────────────┐
│                      Composants Partagés                        │
├─────────────────────────────────────────────────────────────────┤
│   KanbanBoard (+ renderTaskBadge)                              │
│   KanbanColumnManager                                           │
│   TaskModal                                                     │
│   ProjectCard                                                   │
│   ProjectModal                                                  │
├─────────────────────────────────────────────────────────────────┤
│                        Hooks Partagés                           │
├─────────────────────────────────────────────────────────────────┤
│   useTaskFilters<T>                                             │
├─────────────────────────────────────────────────────────────────┤
│                        Config Partagée                          │
├─────────────────────────────────────────────────────────────────┤
│   taskFilterOptions.ts (priorityOptions, sortOptions, teamSort) │
└─────────────────────────────────────────────────────────────────┘
```

## Fonctionnalités par Contexte

| Fonctionnalité | Projets Perso | Projets Équipe |
|----------------|---------------|----------------|
| Kanban personnalisable | ✅ | ✅ |
| TaskModal complet | ✅ | ✅ |
| Filtrage/Recherche | ✅ | ✅ |
| Tri par priorité | ✅ | ✅ |
| Tri par assignation | ❌ N/A | ✅ |
| Terminer projet | ✅ | ✅ |
| Avatars assignés | ❌ N/A | ✅ |
| Toggle sidebar | ✅ | ⏳ (à venir) |

## À Faire (Optionnel)

- [ ] Refactoriser `ProjectDetail.tsx` pour utiliser `useTaskFilters` (réduction de ~50 lignes)
- [ ] Toggle sidebar pour projets d'équipe
- [ ] Tests E2E du workflow complet
