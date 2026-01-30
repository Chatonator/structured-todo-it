
# Plan d'Unification Tâches & Projets (Personnel + Équipe)

## Problème Actuel

Vous avez raison : il existe **deux systèmes parallèles** qui ne communiquent pas :

| Système | Tables | Hooks | Vues |
|---------|--------|-------|------|
| Personnel | `items` (unifié) | `useItems`, `useTasks`, `useProjects` | `TasksView`, `ProjectsView` |
| Équipe | `team_tasks`, `team_projects` | `useTeamTasks`, `useTeamProjects` | `TeamTasksView` |

Cela crée de la duplication de code et une UX incohérente.

---

## Solution Proposée : Unification via Filtrage

L'idée est de **garder les vues existantes** (TasksView, ProjectsView) et d'y **intégrer les données d'équipe** via le système de filtrage déjà en place (`ContextPills` + `contextFilter`).

### Principe clé

```text
┌─────────────────────────────────────────────────────────┐
│  ContextPills: [Toutes] [Perso] [Pro] [Équipe ▼]       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  ProjectsView / TasksView                               │
│  ─────────────────────────────────────────────────────  │
│  Si contexte = "équipe" → affiche team_projects/tasks   │
│  Si contexte = "perso/pro/all" → affiche items          │
└─────────────────────────────────────────────────────────┘
```

---

## Modifications Prévues

### Phase 1 : Hooks unifiés

**1.1 Créer `useUnifiedProjects`**
- Combine `useProjects` et `useTeamProjects`
- Retourne des `UnifiedProject[]` (type déjà existant dans `teamProject.ts`)
- Accepte un paramètre `teamId?: string` pour switcher entre personnel et équipe

**1.2 Modifier `useUnifiedTasks`**
- Déjà partiellement unifié
- Ajouter le même pattern : si `teamId` présent → utiliser `team_tasks`

### Phase 2 : Adapter les vues existantes

**2.1 Modifier `ProjectsView`**
- Utiliser `useUnifiedProjects(currentTeam?.id)` au lieu de `useProjects`
- Les actions (création, édition, suppression) sont routées dynamiquement :
  - Si `currentTeam` → appeler les méthodes team
  - Sinon → appeler les méthodes personnelles
- Ajouter une option "Projet d'équipe" dans `ProjectModal` si une équipe est sélectionnée

**2.2 Adapter `TasksView` (si nécessaire)**
- Même logique : afficher tâches d'équipe si contexte équipe sélectionné

### Phase 3 : Améliorer le routage de création

**3.1 Modifier `TaskModal`**
- Ajouter un champ optionnel "Créer comme tâche d'équipe" (checkbox ou dropdown)
- Visible seulement si l'utilisateur appartient à des équipes
- Par défaut coché si contexte équipe actif

**3.2 Modifier `ProjectModal`**
- Ajouter le même champ "Projet d'équipe" avec sélection de l'équipe
- Permettre de créer un projet d'équipe depuis n'importe quel contexte

### Phase 4 : Supprimer la duplication

**4.1 Simplifier `TeamTasksView`**
- Supprimer la logique de liste des projets (déléguée à `ProjectsView`)
- Garder uniquement ce qui est spécifique aux équipes :
  - Gestion des membres
  - Assignation des tâches
  - Configuration de l'équipe

**4.2 Optionnel : Convertir `TeamTasksView` en vue "Tableau de bord d'équipe"**
- Résumé de l'activité
- Membres et leurs tâches assignées
- Lien vers les projets d'équipe (dans ProjectsView)

---

## Détail Technique

### 1. Hook `useUnifiedProjects`

Créer `src/hooks/useUnifiedProjects.ts` :

```text
useUnifiedProjects(teamId?: string)
├── Si teamId → appeler useTeamProjects(teamId)
├── Sinon → appeler useProjects()
└── Retourner: {
      projects: UnifiedProject[]
      loading: boolean
      createProject: (data) => dynamique
      updateProject: (id, data) => dynamique
      deleteProject: (id) => dynamique
    }
```

### 2. Modification de `ProjectsView`

```text
ProjectsView
├── Récupérer currentTeam de useTeamContext()
├── Utiliser useUnifiedProjects(currentTeam?.id)
├── Afficher indicateur "Mode équipe" si currentTeam
├── Actions routées dynamiquement
└── ProjectModal avec option teamId
```

### 3. Filtrage dans `ContextPills` (déjà en place)

Le système actuel avec `currentTeam` dans `TeamContext` est conservé. La différence est que les vues principales (TasksView, ProjectsView) **écoutent ce contexte** pour afficher les bonnes données.

---

## Fichiers à Modifier

| Fichier | Action |
|---------|--------|
| `src/hooks/useUnifiedProjects.ts` | **Créer** - Hook unifié projets |
| `src/components/projects/ProjectsView.tsx` | **Modifier** - Utiliser hook unifié |
| `src/components/projects/ProjectModal.tsx` | **Modifier** - Ajouter sélecteur d'équipe |
| `src/hooks/useUnifiedTasks.ts` | **Modifier** - Améliorer intégration équipe |
| `src/components/views/tasks/TasksView.tsx` | **Modifier** - Afficher tâches d'équipe |
| `src/components/task/TaskModal.tsx` | **Modifier** - Option création équipe |
| `src/components/views/teams/TeamTasksView.tsx` | **Simplifier** - Supprimer doublons |

---

## Avantages de cette approche

1. **Réutilisation maximale** : Les composants existants (ProjectCard, TaskItem, modales) sont conservés
2. **UX cohérente** : L'utilisateur navigue dans les mêmes vues, seul le filtre change
3. **Pas de migration de données** : Les tables `team_tasks` et `team_projects` restent séparées (RLS différentes)
4. **Extensible** : Facile d'ajouter d'autres contextes (personnel, pro, équipe A, équipe B...)

---

## Estimation

| Phase | Complexité | Estimation |
|-------|------------|------------|
| Phase 1 (hooks) | Moyenne | ~45 min |
| Phase 2 (vues) | Moyenne | ~45 min |
| Phase 3 (modales) | Faible | ~30 min |
| Phase 4 (cleanup) | Faible | ~15 min |

**Total : ~2h**
