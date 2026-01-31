
# Plan : Parité complète entre Projets/Tâches Perso et Équipe

## Analyse de l'écart

J'ai comparé en détail `ProjectDetail.tsx` (perso) vs `TeamProjectDetail.tsx` (équipe). Voici les fonctionnalités manquantes aux équipes :

### Fonctionnalités manquantes dans TeamProjectDetail

| Fonctionnalité | Projets Perso | Projets Équipe | À ajouter |
|----------------|---------------|----------------|-----------|
| **Gestionnaire de colonnes Kanban** | ✅ `KanbanColumnManager` | ❌ Colonnes fixes | ✅ |
| **Toggle "Afficher en sidebar"** | ✅ `showInSidebar` | ❌ Non implémenté | ✅ |
| **Modal TaskModal complet** | ✅ Avec toutes options | ❌ Input basique | ✅ |
| **Terminer projet** | ✅ Fonctionnel | ❌ Toast placeholder | ✅ |
| **Colonnes Kanban personnalisées** | ✅ 3+ colonnes possibles | ❌ 2 colonnes seulement | ✅ (via migration DB) |
| **Calcul de progression dynamique** | ✅ Via tâches terminées | ✅ Déjà ok | - |
| **Assignation de tâches** | ❌ N/A | ✅ Déjà ok | - |
| **Badge membres assignés** | ❌ N/A | ❌ Pas visible dans Kanban | ✅ |

### Éléments à factoriser

| Élément | Dupliqué actuellement | Factorisation proposée |
|---------|----------------------|------------------------|
| Logique filtrage/tri | Copié dans les 2 fichiers | Créer `useTaskFilters` hook |
| Options de tri/priorité | Arrays identiques | Créer `taskFilterOptions.ts` |
| Interface tâches Kanban | Même UI, props différentes | `KanbanBoard` déjà partagé ✅ |

---

## Plan d'implémentation

### Phase 1 : Migration DB pour colonnes Kanban équipe

**Objectif** : Permettre les colonnes Kanban personnalisées pour les projets d'équipe

**Fichier impacté** : Migration SQL

```sql
ALTER TABLE team_projects 
ADD COLUMN kanban_columns JSONB DEFAULT NULL;
```

Cela permet de stocker les colonnes personnalisées comme pour les projets perso.

---

### Phase 2 : Factoriser les filtres/tri

**Nouveau fichier** : `src/hooks/useTaskFilters.ts`

Ce hook générique sera utilisé par `ProjectDetail` ET `TeamProjectDetail` :

```typescript
export interface UseTaskFiltersOptions<T> {
  tasks: T[];
  getTaskName: (task: T) => string;
  getSubCategory: (task: T) => SubTaskCategory | undefined;
  getEstimatedTime: (task: T) => number;
  getAssignedTo?: (task: T) => string | null; // Équipe uniquement
}

export const useTaskFilters = <T>(options: UseTaskFiltersOptions<T>) => {
  // Retourne: searchQuery, setSearchQuery, sortBy, setSortBy, etc.
  // + filterAndSortTasks(tasks: T[]): T[]
};
```

**Nouveau fichier** : `src/config/taskFilterOptions.ts`

```typescript
export const priorityOptions = [
  { value: 'all', label: 'Toutes les priorités' },
  { value: 'Le plus important', label: '🔴 Le plus important' },
  // ...
];

export const sortOptions = [
  { value: 'none', label: 'Aucun tri' },
  { value: 'priority-high', label: 'Priorité ↓ (haute → basse)' },
  // ...
];

export const teamSortOptions = [
  ...sortOptions,
  { value: 'assignee', label: 'Assignation' },
];
```

---

### Phase 3 : Enrichir TeamProjectDetail

**Fichier** : `src/components/team/TeamProjectDetail.tsx`

**Ajouts** :

1. **Gestionnaire de colonnes Kanban** :
   - Importer et utiliser `KanbanColumnManager`
   - Stocker les colonnes dans `team_projects.kanban_columns`
   - Bouton "⚙️" dans le header comme ProjectDetail

2. **Toggle sidebar** (optionnel pour équipe) :
   - Ajouter un champ `showInSidebar` dans les metadata du projet
   - Utiliser le même composant Switch que ProjectDetail

3. **Modal TaskModal complet** :
   - Remplacer l'input basique par `TaskModal`
   - Passer `taskType="team"` pour avoir les bonnes options (priorité, assignation)
   - Au clic sur une tâche, ouvrir le modal en mode édition

4. **Terminer le projet** :
   - Remplacer le toast placeholder par un vrai appel à `updateProject`
   - Mettre le status à `completed`

5. **Afficher les membres assignés dans le Kanban** :
   - Modifier `KanbanBoard` pour accepter une prop optionnelle `renderTaskExtra`
   - Afficher un avatar miniature si `assigned_to` est défini

---

### Phase 4 : Mettre à jour useTeamProjects

**Fichier** : `src/hooks/useTeamProjects.ts`

**Ajouts** :

1. Mapper le nouveau champ `kanban_columns` :
   ```typescript
   kanbanColumns: row.kanban_columns as KanbanColumnConfig[] | undefined,
   ```

2. Permettre la mise à jour des colonnes :
   ```typescript
   if (updates.kanbanColumns !== undefined) {
     dbUpdates.kanban_columns = updates.kanbanColumns;
   }
   ```

---

### Phase 5 : Mettre à jour useTeamProjectTasks

**Fichier** : `src/hooks/useTeamProjectTasks.ts`

**Changement majeur** : Support du champ `projectStatus` pour les colonnes intermédiaires

Actuellement, le hook utilise uniquement `isCompleted` (2 états). Pour supporter 3+ colonnes, il faut :

1. Utiliser le champ `metadata` pour stocker `projectStatus` (comme les projets perso)
2. Ou ajouter une colonne `status` à `team_tasks` (plus propre)

**Migration DB recommandée** :
```sql
ALTER TABLE team_tasks 
ADD COLUMN project_status TEXT DEFAULT 'todo';
```

Puis modifier le hook :
```typescript
const getTaskStatus = (task: TeamTask): string => {
  return task.projectStatus || (task.isCompleted ? 'done' : 'todo');
};
```

---

### Phase 6 : Enrichir KanbanBoard pour les équipes

**Fichier** : `src/components/projects/KanbanBoard.tsx`

**Ajout** : Prop optionnelle pour afficher les avatars d'assignation

```typescript
interface KanbanBoardProps {
  // ... props existantes
  renderTaskBadge?: (task: Task) => React.ReactNode; // Nouveau
}
```

Dans `TeamProjectDetail`, on passera :
```tsx
<KanbanBoard
  renderTaskBadge={(task) => {
    const teamTask = task as TeamTask;
    if (!teamTask.assigned_to) return null;
    return <AssignedAvatar userId={teamTask.assigned_to} members={teamMembers} />;
  }}
/>
```

---

### Phase 7 : Refactoriser ProjectDetail et TeamProjectDetail

Une fois les hooks et composants partagés créés, refactoriser :

1. **ProjectDetail.tsx** :
   - Utiliser `useTaskFilters` au lieu de la logique inline
   - Importer `priorityOptions`, `sortOptions` depuis `taskFilterOptions.ts`

2. **TeamProjectDetail.tsx** :
   - Utiliser `useTaskFilters` 
   - Importer `priorityOptions`, `teamSortOptions` depuis `taskFilterOptions.ts`
   - Ajouter les nouvelles fonctionnalités (colonnes, modal, terminer)

---

## Schéma des dépendances

```text
┌─────────────────────────────────────────────────────────────────┐
│                      Composants Partagés                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   KanbanBoard ◄────────────────────────────────────────────────│
│       │                                                         │
│       ├── renderTaskBadge? (nouveau)                           │
│       └── Utilisé par ProjectDetail ET TeamProjectDetail       │
│                                                                 │
│   KanbanColumnManager ◄────────────────────────────────────────│
│       │                                                         │
│       └── Utilisé par ProjectDetail ET TeamProjectDetail       │
│                                                                 │
│   TaskModal ◄──────────────────────────────────────────────────│
│       │                                                         │
│       ├── taskType="personal" (projets perso)                  │
│       └── taskType="team" (projets équipe)                     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                        Hooks Partagés                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   useTaskFilters ◄─────────────────────────────────────────────│
│       │                                                         │
│       └── Logique de filtrage/tri extraite                     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                        Config Partagée                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   taskFilterOptions.ts ◄───────────────────────────────────────│
│       │                                                         │
│       └── priorityOptions, sortOptions, teamSortOptions        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fichiers impactés (résumé)

| Action | Fichier |
|--------|---------|
| Migration | SQL : Ajouter `kanban_columns` à `team_projects` |
| Migration | SQL : Ajouter `project_status` à `team_tasks` |
| Créer | `src/hooks/useTaskFilters.ts` |
| Créer | `src/config/taskFilterOptions.ts` |
| Modifier | `src/hooks/useTeamProjects.ts` (kanban_columns) |
| Modifier | `src/hooks/useTeamProjectTasks.ts` (project_status) |
| Modifier | `src/components/projects/KanbanBoard.tsx` (renderTaskBadge) |
| Modifier | `src/components/team/TeamProjectDetail.tsx` (toutes les features) |
| Modifier | `src/components/projects/ProjectDetail.tsx` (utiliser hooks partagés) |

---

## Ordre d'exécution

| Étape | Description | Dépendances |
|-------|-------------|-------------|
| 1 | Migrations SQL (kanban_columns, project_status) | Aucune |
| 2 | Créer `useTaskFilters` hook | Aucune |
| 3 | Créer `taskFilterOptions.ts` | Aucune |
| 4 | Modifier `useTeamProjects` (kanban_columns) | Étape 1 |
| 5 | Modifier `useTeamProjectTasks` (project_status) | Étape 1 |
| 6 | Modifier `KanbanBoard` (renderTaskBadge) | Aucune |
| 7 | Enrichir `TeamProjectDetail` | Étapes 2-6 |
| 8 | Refactoriser `ProjectDetail` | Étapes 2-3 |
| 9 | Tests de bout en bout | Étapes 1-8 |

---

## Bénéfices

1. **Parité fonctionnelle** : Les projets d'équipe auront exactement les mêmes fonctionnalités que les projets perso
2. **Réduction de duplication** : ~150 lignes de code factorisées dans les hooks/config partagés
3. **Maintenabilité** : Un bug corrigé dans `useTaskFilters` = corrigé partout
4. **Évolutivité** : Facile d'ajouter de nouveaux filtres/tris à l'avenir
5. **UX cohérente** : L'utilisateur retrouve la même expérience quel que soit le contexte
