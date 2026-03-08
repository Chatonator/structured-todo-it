

# Système partagé de liaison tâches-outils

## Problème actuel

Chaque outil implémente sa propre logique de sélection de tâches (Popover + liste basique dans Pomodoro, Popover + ScrollArea dans Rule135). Le résultat est incohérent, peu intuitif, et non réutilisable.

## Solution : un composant `TaskLinker` partagé

Créer un composant et un hook réutilisables que tout outil (existant ou futur) peut intégrer en une ligne.

### Composant `TaskLinker`

Un sélecteur de tâches riche avec :
- **Recherche** par nom (filtre en temps réel)
- **Filtres rapides** : par contexte (Pro/Perso), par projet, par priorité
- **Affichage enrichi** : nom + projet + temps estimé + badges priorité/contexte
- **Mode single** (Pomodoro : 1 tâche liée) ou **mode multi** (Rule135, futurs outils)
- **Tâches sélectionnées** affichées avec chip amovible
- **Rendu via Popover** (compact) ou **inline** (intégré dans l'outil)

### Hook `useTaskLinker`

```text
useTaskLinker({ mode, maxSelection?, storageKey? })
  → selectedIds, selectedTasks, search, filters
  → select, deselect, clear, setSearch, setFilter
  → filteredAvailableTasks (search + filters appliqués)
```

- Persistance optionnelle dans localStorage (par outil + par jour)
- Accès aux tâches via `useViewDataContext`

### Intégration

```text
src/components/views/toolbox/shared/
├── TaskLinker.tsx          ← Composant UI réutilisable
├── useTaskLinker.ts        ← Hook logique
└── index.ts
```

### Refactoring des outils existants

| Outil | Avant | Après |
|---|---|---|
| **Pomodoro** | Popover custom avec liste brute | `<TaskLinker mode="single" />` |
| **Rule135** | TaskSelector custom par slot | `<TaskLinker mode="multi" max={N} />` pour chaque slot |
| **Eisenhower** | Pas de liaison | Prêt pour l'avenir |

### API du composant

```text
<TaskLinker
  mode="single" | "multi"
  max?={number}
  selectedIds={string[]}
  onSelect={(id) => void}
  onDeselect={(id) => void}
  excludeIds?={string[]}
  placeholder?="Lier une tâche..."
  variant?="popover" | "inline"
/>
```

### Fichiers impactés

| Fichier | Action |
|---|---|
| `src/components/views/toolbox/shared/useTaskLinker.ts` | Nouveau hook |
| `src/components/views/toolbox/shared/TaskLinker.tsx` | Nouveau composant |
| `src/components/views/toolbox/shared/index.ts` | Barrel export |
| `src/components/views/toolbox/tools/pomodoro/PomodoroTool.tsx` | Remplacer le Popover custom par `TaskLinker` |
| `src/components/views/toolbox/tools/rule135/Rule135Tool.tsx` | Remplacer `TaskSelector` par `TaskLinker` |

