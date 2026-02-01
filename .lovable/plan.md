
# Plan : Parité complète Tâches et Projets Équipe vs Personnel

## Analyse des écarts identifiés

### 1. TaskModal - Problèmes critiques

| Fonctionnalité | Projets Perso | Équipe | Problème |
|----------------|---------------|--------|----------|
| `taskType` prop | ✅ `taskType="project"` | ❌ Non passé | `TeamProjectDetail` ne passe pas `taskType="team"` |
| Assignation membre | ❌ N/A | ❌ Config existe mais non implémenté | `showAssignment: true` dans config mais aucun champ dans `TaskModal` |

### 2. TeamProjectDetail - Différences avec ProjectDetail

| Fonctionnalité | ProjectDetail | TeamProjectDetail | À corriger |
|----------------|---------------|-------------------|------------|
| taskType passé au modal | ✅ `taskType="project"` | ❌ Non passé | Passer `taskType="team"` |
| Toggle sidebar | ✅ Fonctionnel | ❌ Toast placeholder | Implémenter (champ `showInSidebar` existe déjà dans type) |
| Bouton Colonnes dans header Kanban | ✅ Dans header section | ❌ Seulement icône dans header principal | Aligner la présentation |

### 3. Nomenclature des priorités - Incohérence

Dans le code actuel, `PrioritySelector` utilise `SUB_CATEGORY_CONFIG` qui affiche :
- "Le plus important"
- "Important"
- "Peut attendre"  
- "Si j'ai le temps"

C'est **correct** - les projets n'utilisent PAS les catégories type "Cruciales/Envies" mais bien ces priorités. Pas de problème ici.

### 4. ProjectDetail - Refactoring nécessaire

| Élément | Actuel | Cible |
|---------|--------|-------|
| Options priorité/tri | Arrays inline (lignes 255-270) | Importer depuis `taskFilterOptions.ts` |
| Logique filtrage | Inline (lignes 69-129) | Utiliser `useTaskFilters` hook |

### 5. Assignation équipe - Manquante

La config `TASK_TYPE_CONFIGS.team.showAssignment = true` existe mais :
- Aucun champ `AssignmentSelector` n'existe
- `TaskModal` ignore cette config
- Aucune UI pour assigner un membre dans le modal

---

## Phase 1 : Corriger TeamProjectDetail

### Fichier : `src/components/team/TeamProjectDetail.tsx`

**Modifications :**

1. **Passer `taskType="team"` au TaskModal** (ligne 521)
   ```typescript
   <TaskModal
     isOpen={showTaskModal}
     // ... autres props
     taskType="team"  // AJOUT
   />
   ```

2. **Implémenter toggle sidebar** (remplacer toast placeholder)
   ```typescript
   const handleToggleSidebar = useCallback(async () => {
     const newValue = !(project as any).showInSidebar;
     const success = await updateProject(project.id, { showInSidebar: newValue });
     if (success) {
       toast({
         title: newValue ? "Affiché dans la sidebar" : "Masqué de la sidebar",
         description: newValue 
           ? "Les tâches de ce projet apparaissent dans la sidebar"
           : "Les tâches de ce projet sont masquées de la sidebar",
       });
     }
   }, [project, updateProject, toast]);
   ```

3. **Ajouter le bouton toggle sidebar dans le header** (après le bouton Settings2)
   ```tsx
   <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-card">
     <Switch
       id="show-in-sidebar"
       checked={(project as any).showInSidebar ?? false}
       onCheckedChange={handleToggleSidebar}
     />
     <Label htmlFor="show-in-sidebar" className="text-sm cursor-pointer flex items-center gap-1">
       {(project as any).showInSidebar ? (
         <><Eye className="w-4 h-4 text-project" /> Sidebar</>
       ) : (
         <><EyeOff className="w-4 h-4 text-muted-foreground" /> Sidebar</>
       )}
     </Label>
   </div>
   ```

---

## Phase 2 : Créer AssignmentSelector

### Nouveau fichier : `src/components/task/fields/AssignmentSelector.tsx`

Composant pour sélectionner un membre d'équipe lors de la création/édition de tâche :

```typescript
interface AssignmentSelectorProps {
  value: string | null;
  onChange: (userId: string | null) => void;
  members: TeamMember[];
  label?: string;
}
```

Affiche un dropdown avec les membres de l'équipe + option "Non assigné".

---

## Phase 3 : Étendre TaskModal pour l'assignation

### Fichier : `src/components/task/TaskModal.tsx`

**Modifications :**

1. **Ajouter prop `teamMembers`** pour passer les membres disponibles
   ```typescript
   interface TaskModalProps {
     // ... props existantes
     teamMembers?: TeamMember[];
   }
   ```

2. **Ajouter champ `assignedTo` dans `TaskDraft`**
   ```typescript
   interface TaskDraft {
     // ... champs existants
     assignedTo?: string | null;
   }
   ```

3. **Afficher `AssignmentSelector` si `config.showAssignment`**
   ```tsx
   {config.showAssignment && teamMembers && (
     <AssignmentSelector
       value={draft.assignedTo || null}
       onChange={(userId) => updateTaskDraft(index, 'assignedTo', userId)}
       members={teamMembers}
     />
   )}
   ```

4. **Inclure `assigned_to` dans les données envoyées**
   ```typescript
   const taskData = {
     // ... autres champs
     assigned_to: draft.assignedTo || null,
   };
   ```

---

## Phase 4 : Mettre à jour TaskDraft et validation

### Fichier : `src/utils/taskValidationByType.ts`

1. **Ajouter `assignedTo` dans `TaskDraft`**
   ```typescript
   export interface TaskDraft {
     // ... champs existants
     assignedTo?: string | null;
   }
   ```

### Fichier : `src/components/task/fields/index.ts`

Ajouter l'export :
```typescript
export { AssignmentSelector } from './AssignmentSelector';
```

---

## Phase 5 : Passer les membres dans TeamProjectDetail

### Fichier : `src/components/team/TeamProjectDetail.tsx`

Passer `teamMembers` au `TaskModal` :
```tsx
<TaskModal
  isOpen={showTaskModal}
  onClose={handleCloseModal}
  editingTask={...}
  taskType="team"
  teamMembers={teamMembers}  // AJOUT
  // ... autres props
/>
```

---

## Phase 6 : Refactoriser ProjectDetail

### Fichier : `src/components/projects/ProjectDetail.tsx`

**Modifications :**

1. **Importer les options depuis config partagée**
   ```typescript
   import { priorityOptions, sortOptions } from '@/config/taskFilterOptions';
   ```

2. **Supprimer les arrays inline** (lignes 255-270)

3. **Utiliser le hook `useTaskFilters`**
   ```typescript
   const {
     searchQuery,
     setSearchQuery,
     sortBy,
     setSortBy,
     priorityFilter,
     setPriorityFilter,
     hasActiveFilters,
     clearFilters,
     filterAndSortTasks,
   } = useTaskFilters<Task>({
     tasks: Object.values(getTasksByColumns(columns)).flat(),
     getTaskName: (t) => t.name,
     getSubCategory: (t) => t.subCategory,
     getEstimatedTime: (t) => t.estimatedTime || 0,
   });
   ```

4. **Supprimer la logique de filtrage inline** (lignes 69-129)

---

## Phase 7 : Mettre à jour useTeamProjects pour showInSidebar

### Fichier : `src/hooks/useTeamProjects.ts`

Ajouter le mapping du champ `showInSidebar` si absent :

```typescript
// Dans updateProject
if (updates.showInSidebar !== undefined) {
  // Stocker dans metadata ou ajouter colonne DB si nécessaire
  dbUpdates.show_in_sidebar = updates.showInSidebar;
}
```

**Note :** La colonne `show_in_sidebar` n'existe pas dans `team_projects`. Options :
1. Ajouter une migration DB (recommandé)
2. Ou stocker dans un champ JSON existant si disponible

---

## Résumé des fichiers impactés

| Action | Fichier |
|--------|---------|
| Créer | `src/components/task/fields/AssignmentSelector.tsx` |
| Modifier | `src/components/team/TeamProjectDetail.tsx` |
| Modifier | `src/components/task/TaskModal.tsx` |
| Modifier | `src/utils/taskValidationByType.ts` |
| Modifier | `src/components/task/fields/index.ts` |
| Modifier | `src/components/projects/ProjectDetail.tsx` |
| (Optionnel) | Migration SQL pour `show_in_sidebar` dans `team_projects` |

---

## Ordre d'exécution

| Étape | Description | Complexité |
|-------|-------------|------------|
| 1 | Créer `AssignmentSelector.tsx` | Faible |
| 2 | Mettre à jour `TaskDraft` avec `assignedTo` | Faible |
| 3 | Étendre `TaskModal` pour assignation | Moyenne |
| 4 | Corriger `TeamProjectDetail` (taskType + sidebar toggle + members) | Moyenne |
| 5 | Refactoriser `ProjectDetail` avec `useTaskFilters` | Moyenne |
| 6 | (Optionnel) Migration DB pour `show_in_sidebar` | Faible |

---

## Bénéfices

1. **Parité fonctionnelle** : Les tâches d'équipe auront l'assignation dans le modal
2. **Moins de code dupliqué** : `ProjectDetail` utilisera les mêmes hooks/configs que `TeamProjectDetail`
3. **Cohérence UX** : Toggle sidebar identique entre perso et équipe
4. **Maintenance simplifiée** : Options de tri/filtre centralisées dans `taskFilterOptions.ts`
