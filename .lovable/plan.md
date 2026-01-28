
# Plan de réactivation des Groupes (Teams)

## Analyse de l'existant

### ✅ Ce qui fonctionne déjà
- **Infrastructure backend complète** :
  - Tables Supabase : `teams`, `team_members`, `team_tasks`
  - Edge Functions : `create-team`, `join-team`, `manage-team-member`
  - Politiques RLS correctement configurées
  - Fonctions helper : `is_team_member()`, `has_team_role()`, `is_team_admin()`

- **Hooks fonctionnels** :
  - `useTeams` : gestion CRUD des équipes
  - `useTeamTasks` : gestion des tâches d'équipe
  - `useUnifiedTasks` : abstraction qui unifie tâches personnelles et d'équipe

- **Contexte d'équipe** :
  - `TeamContext` et `TeamProvider` présents dans `App.tsx`
  - `useTeamContext` disponible partout dans l'application

- **Navigation vers les équipes** :
  - Route `/teams` avec `TeamManagement` accessible
  - Dropdown dans `UserProfileBlock` pour accéder aux équipes
  - `ContextPills` permet de sélectionner une équipe comme contexte

### ❌ Régressions identifiées

1. **Création de tâches en mode équipe impossible**
   - Quand une équipe est sélectionnée via `ContextPills`, le `TaskModal` utilise toujours `onAddTask` de `viewData` (tâches personnelles)
   - Le `useUnifiedTasks` détecte bien le mode équipe mais n'est pas connecté au flux de création principal

2. **Affichage des tâches d'équipe dans la vue principale**
   - `MainContent` affiche les vues standards mais pas de vue dédiée aux tâches d'équipe
   - Les tâches d'équipe ne s'affichent que dans la sidebar (section `SidebarTeamTasksSection`)

3. **Pas de UI pour créer des projets d'équipe**
   - La table `team_tasks` existe mais pas d'équivalent `team_projects`
   - Les projets restent uniquement personnels

---

## Plan d'implémentation minimaliste

### Phase 1 : Corriger la création de tâches d'équipe

**Fichiers à modifier :**
- `src/pages/Index.tsx`
- `src/components/layout/HeaderBar.tsx`

**Modifications :**
1. Dans `Index.tsx`, détecter si une équipe est sélectionnée via `useTeamContext`
2. Passer une fonction `onAddTask` dynamique au `TaskModal` :
   - Si `currentTeam` : utiliser `useTeamTasks(currentTeam.id).createTask`
   - Sinon : utiliser `viewData.addTask` (comportement actuel)
3. Ajouter un indicateur visuel dans le header quand on est en mode équipe

### Phase 2 : Afficher les tâches d'équipe dans la vue principale

**Fichiers à créer :**
- `src/components/views/teams/TeamTasksView.tsx`
- `src/components/views/teams/index.ts`

**Fichiers à modifier :**
- `src/components/routing/viewRegistry.ts`
- `src/contexts/AppContext.tsx`

**Modifications :**
1. Créer une vue `TeamTasksView` qui affiche les tâches d'une équipe
2. Enregistrer cette vue dans le `viewRegistry`
3. Basculer automatiquement vers cette vue quand une équipe est sélectionnée
4. Permettre les actions : toggle completion, édition, suppression

### Phase 3 : Améliorer l'UX de sélection d'équipe

**Fichiers à modifier :**
- `src/components/layout/ContextPills.tsx`
- `src/components/layout/HeaderBar.tsx`

**Modifications :**
1. Améliorer l'indicateur visuel du mode équipe actif
2. Ajouter un lien direct vers `/teams` pour gérer l'équipe

---

## Détail technique

### Phase 1 - Création de tâches

```text
Index.tsx
┌────────────────────────────────────────┐
│  useTeamContext() → currentTeam       │
│  useTeamTasks(currentTeam?.id)        │
│                                        │
│  onAddTask = currentTeam               │
│    ? teamTasks.createTask              │
│    : viewData.addTask                  │
│                                        │
│  <TaskModal onAddTask={onAddTask} />  │
└────────────────────────────────────────┘
```

### Phase 2 - Vue des tâches d'équipe

```text
TeamTasksView.tsx
┌────────────────────────────────────────┐
│  Props: teamId                         │
│                                        │
│  useTeamTasks(teamId) → tasks         │
│  useTeamContext() → teamMembers       │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Header: Nom équipe + Stats     │ │
│  ├──────────────────────────────────┤ │
│  │  Liste des tâches               │ │
│  │  - Toggle completion            │ │
│  │  - Assignation membre           │ │
│  │  - Édition / Suppression       │ │
│  └──────────────────────────────────┘ │
└────────────────────────────────────────┘
```

### Phase 3 - Navigation automatique

```text
AppContext.tsx
┌────────────────────────────────────────┐
│  Ajouter 'team' aux navigationItems   │
│  (conditionnel si équipe sélectionnée)│
│                                        │
│  useEffect: currentTeam change         │
│    → setCurrentView('team')           │
└────────────────────────────────────────┘
```

---

## Estimation

| Phase | Effort | Priorité |
|-------|--------|----------|
| Phase 1 | ~30 min | Critique |
| Phase 2 | ~45 min | Haute |
| Phase 3 | ~15 min | Moyenne |

**Total estimé : ~1h30**

---

## Hors scope (pour version ultérieure)

- Projets d'équipe (nécessite table `team_projects`)
- Notifications temps réel
- Historique d'activité d'équipe
- Permissions granulaires par tâche
