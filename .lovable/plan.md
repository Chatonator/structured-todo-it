
# Plan "Table Rase" : Refonte Complète des Équipes

## Analyse comparative

### Ce qui fonctionne bien (projets perso)
- Architecture unifiée `items` avec `useItems` → très élégant
- `ProjectsView` → navigation fluide grille/détail
- `ProjectDetail` → Kanban, filtres, recherche, colonnes personnalisables
- `ProjectCard` → progression dynamique via `useProjectProgress`
- `ProjectModal` → création/édition complète

### Ce qui ne fonctionne pas (équipes actuelles)
- Tables Supabase séparées (`team_tasks`, `team_projects`) → OK, nécessaire pour RLS multi-utilisateurs
- `TeamProjectCard` / `TeamProjectModal` → doublons simplistes sans les features
- **Pas de vue détail projet** → pas de Kanban, pas de gestion de tâches par projet
- Pas de `useTeamProjectTasks` → impossible de lier tâches et projets d'équipe

## Décision architecturale : Garder les tables séparées

Les tables `team_tasks` et `team_projects` dans Supabase sont **nécessaires** :
- RLS différente (accès par `team_id` au lieu de `user_id`)
- Champs spécifiques équipes (`assigned_to`, `created_by`)
- Pas de migration de données à faire

**L'approche table rase concerne les composants React, pas les tables Supabase.**

---

## Plan d'implémentation

### Phase 1 : Supprimer les doublons
**Fichiers à supprimer :**
- `src/components/team/TeamProjectCard.tsx`
- `src/components/team/TeamProjectModal.tsx`

Ces composants ne seront plus utilisés.

---

### Phase 2 : Créer un adaptateur de types
**Nouveau fichier** : `src/types/teamProject.ts`

Créer une interface `UnifiedProject` qui normalise les deux sources :

```typescript
// Interface commune pour projets perso et équipe
export interface UnifiedProject {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  status: ProjectStatus;
  targetDate?: Date;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  // Contexte
  teamId?: string;   // Si présent = projet d'équipe
  userId?: string;   // Si présent = projet personnel
}

// Adaptateurs
export function teamProjectToUnified(tp: TeamProject): UnifiedProject;
export function projectToUnified(p: Project): UnifiedProject;
```

---

### Phase 3 : Créer le hook manquant
**Nouveau fichier** : `src/hooks/useTeamProjectTasks.ts`

Ce hook est l'équivalent de `useProjectTasks` pour les équipes :

```typescript
export const useTeamProjectTasks = (teamId: string, projectId: string) => {
  // Filtre team_tasks par project_id
  // Fournit getTasksByColumns pour le Kanban
  // Fournit updateTaskStatus pour le drag & drop
  
  return {
    tasks,
    loading,
    getTasksByColumns,
    updateTaskStatus,
    reloadTasks
  };
};
```

---

### Phase 4 : Étendre ProjectCard
**Modifier** : `src/components/projects/ProjectCard.tsx`

Accepter `UnifiedProject` au lieu de `Project` :

```typescript
interface ProjectCardProps {
  project: UnifiedProject;
  onClick: () => void;
  taskCount?: number; // Pour équipes (progression non auto-calculée)
}
```

Le hook `useProjectProgress` ne fonctionne que pour les projets perso. Pour les équipes, passer `taskCount` explicitement.

---

### Phase 5 : Étendre ProjectModal
**Modifier** : `src/components/projects/ProjectModal.tsx`

Ajouter une prop `teamId` optionnelle :

```typescript
interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: ProjectFormData) => void;
  project?: UnifiedProject | null;
  teamId?: string; // Mode équipe
}
```

Le modal reste identique visuellement. La logique de sauvegarde est gérée par le parent.

---

### Phase 6 : Créer TeamProjectDetail (nouveau)
**Nouveau fichier** : `src/components/team/TeamProjectDetail.tsx`

Ce composant est une **copie adaptée** de `ProjectDetail` pour les équipes :

- Utilise `useTeamProjectTasks` au lieu de `useProjectTasks`
- Utilise `useTeamTasks.createTask` pour ajouter des tâches
- Affiche les membres assignés sur chaque tâche
- Permet d'assigner des tâches via dropdown

**Raison du nouveau fichier** : Plutôt que de surcharger `ProjectDetail` avec des conditions `if (teamId)` partout, un composant dédié sera plus maintenable. Les deux partagent le même `KanbanBoard`.

---

### Phase 7 : Refondre TeamTasksView
**Modifier** : `src/components/views/teams/TeamTasksView.tsx`

Remplacer l'implémentation actuelle :

1. Importer les composants généralisés
2. Ajouter l'état `detailProjectId` (comme `ProjectsView`)
3. Afficher `TeamProjectDetail` quand un projet est sélectionné
4. Utiliser `ProjectCard` avec `UnifiedProject`
5. Utiliser `ProjectModal` avec `teamId`

---

## Schéma d'architecture cible

```text
┌──────────────────────────────────────────────────────────────────┐
│                        Composants Partagés                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│   ProjectCard      ◄── UnifiedProject (perso ou équipe)          │
│   ProjectModal     ◄── teamId? pour savoir quel hook appeler     │
│   KanbanBoard      ◄── Inchangé, déjà générique                  │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│                        Composants Perso                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│   ProjectsView     ──► ProjectCard ──► ProjectDetail              │
│        │                                    │                     │
│        └──► useProjects                     └──► useProjectTasks  │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│                        Composants Équipe                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│   TeamTasksView    ──► ProjectCard ──► TeamProjectDetail          │
│        │                                    │                     │
│        └──► useTeamProjects                 └──► useTeamProjectTasks
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Fichiers impactés (résumé)

| Action | Fichier |
|--------|---------|
| Supprimer | `src/components/team/TeamProjectCard.tsx` |
| Supprimer | `src/components/team/TeamProjectModal.tsx` |
| Créer | `src/types/teamProject.ts` |
| Créer | `src/hooks/useTeamProjectTasks.ts` |
| Créer | `src/components/team/TeamProjectDetail.tsx` |
| Modifier | `src/components/projects/ProjectCard.tsx` |
| Modifier | `src/components/projects/ProjectModal.tsx` |
| Modifier | `src/components/views/teams/TeamTasksView.tsx` |
| Modifier | `src/components/views/teams/index.ts` |

---

## Ordre d'exécution

| Étape | Description | Risque |
|-------|-------------|--------|
| 1 | Créer `src/types/teamProject.ts` | Aucun |
| 2 | Créer `src/hooks/useTeamProjectTasks.ts` | Faible |
| 3 | Modifier `ProjectCard.tsx` (UnifiedProject) | Faible |
| 4 | Modifier `ProjectModal.tsx` (teamId optionnel) | Faible |
| 5 | Créer `TeamProjectDetail.tsx` | Moyen |
| 6 | Modifier `TeamTasksView.tsx` | Moyen |
| 7 | Supprimer doublons | Aucun |
| 8 | Tester de bout en bout | - |

---

## Avantages de cette approche

1. **Pas de sur-ingénierie** : On ne fusionne pas tout dans un seul composant impossible à maintenir
2. **Réutilisation maximale** : `ProjectCard`, `ProjectModal`, `KanbanBoard` sont partagés
3. **Séparation claire** : `ProjectDetail` (perso) vs `TeamProjectDetail` (équipe) - même UX, hooks différents
4. **Évolutif** : Facile d'ajouter des features spécifiques équipes (mentions, commentaires, etc.)
5. **Suppression nette** : Les doublons `TeamProjectCard`/`TeamProjectModal` disparaissent

---

## Technical details

### useTeamProjectTasks implementation

Ce hook filtre les `team_tasks` par `project_id` :

```typescript
const useTeamProjectTasks = (teamId: string, projectId: string) => {
  const { tasks: allTasks, ...rest } = useTeamTasks(teamId);
  
  const projectTasks = useMemo(() => 
    allTasks.filter(t => t.project_id === projectId),
    [allTasks, projectId]
  );
  
  const getTasksByColumns = (columns) => {
    // Grouper par status (à faire, en cours, terminé)
    // Basé sur iscompleted et un champ status à ajouter si nécessaire
  };
  
  const updateTaskStatus = async (taskId, newStatus) => {
    // Appeler updateTask avec le nouveau status
  };
  
  return { tasks: projectTasks, getTasksByColumns, updateTaskStatus, ...rest };
};
```

### Schema consideration

La table `team_tasks` n'a pas de champ `status` pour le Kanban. Options :
1. Utiliser `iscompleted` : false = "À faire", true = "Terminé" (2 colonnes seulement)
2. Ajouter un champ `status` via migration SQL (recommandé pour 3+ colonnes)

Je recommande de commencer avec l'option 1 (simple) et d'évoluer vers l'option 2 si besoin.
