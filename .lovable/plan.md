

## Audit de la gestion des equipes

### Architecture actuelle

```text
TeamContext (useTeams)
  ├─ useUnifiedTasks    → commute entre useTasks / useTeamTasks
  ├─ useUnifiedProjects → commute entre useProjects / useTeamProjects
  ├─ UnifiedContextSelector → bascule perso/pro/equipe
  └─ Vues
       ├─ TeamTasksView (dashboard admin)
       ├─ TeamManagement (page standalone /teams)
       └─ TeamProjectDetail (detail projet equipe + Kanban)
```

### Problemes identifies

**1. Duplication massive : TeamManagement vs TeamTasksView**
Les deux composants affichent les membres, les roles, le code d'invitation, avec du code quasi identique (RoleBadge, getInitials, getRoleBadge, handleCopyInviteCode). `TeamManagement` est une page standalone a `/teams` tandis que `TeamTasksView` est dans le viewRegistry. Double maintenance inutile.

**2. useTeamTasks charge TOUTES les taches a chaque hook**
`useTeamProjectTasks` appelle `useTeamTasks(teamId)` qui charge toutes les taches de l'equipe, puis filtre par `project_id`. Si `TeamProjectDetail` instancie aussi `useTeamTasks(teamId)` separement (ligne 76), on a **deux subscriptions Realtime** et **deux fetches** pour le meme `teamId`.

**3. useUnifiedTasks instancie toujours useTeamTasks**
Meme quand `currentTeam` est `null`, `useTeamTasks(null)` est appele. Ce n'est pas un bug (il short-circuite), mais `formattedTeamTasks` et `handleToggleTeamTask` sont recalcules inutilement.

**4. Mapping camelCase ↔ snake_case duplique**
Le mapping `estimatedtime → estimatedTime`, `iscompleted → isCompleted` etc. est fait dans `useTeamTasks.loadTasks()` ET dans `useUnifiedTasks.teamTasksAdapter.updateTask()` (en sens inverse). Fragile et non DRY.

**5. Pas de filtre par assignation dans la sidebar**
Les taches d'equipe dans la sidebar (`SidebarTeamTasksSection`) montrent toutes les taches sans filtrer par utilisateur courant. L'utilisateur voit les taches des autres sans pouvoir distinguer les siennes.

**6. Le bouton "Inviter" dans TeamTasksView ne fait rien**
Ligne 181-184 : le bouton n'a pas de `onClick`.

**7. Pas de temps reel sur les projets d'equipe**
`useTeamProjects` ne souscrit pas aux changements Realtime (contrairement a `useTeamTasks` qui le fait).

### Ameliorations proposees

#### Phase 1 : Nettoyage et factorisation
- **Extraire un composant `TeamMembersList`** reutilise par `TeamTasksView` et `TeamManagement` (badges de role, avatar, actions)
- **Extraire le mapping camelCase/snake_case** dans un utilitaire `teamTaskMapper.ts` pour eviter la duplication
- **Connecter le bouton "Inviter"** dans `TeamTasksView` : copier le code d'invitation + toast

#### Phase 2 : Performance
- **Eviter les doubles fetches** : `TeamProjectDetail` instancie `useTeamTasks` ET `useTeamProjectTasks` (qui lui-meme instancie `useTeamTasks`). Refactoriser pour que `TeamProjectDetail` n'utilise que `useTeamProjectTasks` qui expose deja `toggleComplete`, `createTask`, etc.
- **Ajouter le Realtime sur `useTeamProjects`** (subscription `postgres_changes` comme dans `useTeamTasks`)

#### Phase 3 : Qualite de vie
- **Filtrer les taches d'equipe par utilisateur dans la sidebar** : montrer "Mes taches d'equipe" plutot que toutes les taches
- **Indicateur "assigne a moi"** visible dans les cartes Kanban des projets d'equipe
- **Notification quand une tache m'est assignee** (via Realtime)
- **Vue "Mes taches assignees"** : un onglet dans le dashboard equipe qui liste uniquement les taches assignees a l'utilisateur courant, toutes equipes confondues

### Fichiers touches

| Fichier | Action |
|---------|--------|
| `src/components/team/TeamMembersList.tsx` | Nouveau composant partage |
| `src/utils/teamTaskMapper.ts` | Nouveau utilitaire de mapping |
| `src/components/views/teams/TeamTasksView.tsx` | Utiliser `TeamMembersList`, connecter bouton Inviter |
| `src/components/team/TeamManagement.tsx` | Utiliser `TeamMembersList` |
| `src/components/team/TeamProjectDetail.tsx` | Supprimer le double `useTeamTasks` |
| `src/hooks/useTeamProjectTasks.ts` | Exposer `createTask`, `deleteTask`, `toggleComplete` |
| `src/hooks/useTeamProjects.ts` | Ajouter Realtime |
| `src/hooks/useTeamTasks.ts` | Utiliser `teamTaskMapper` |
| `src/hooks/useUnifiedTasks.ts` | Utiliser `teamTaskMapper` |
| `src/components/sidebar/SidebarTeamTasksSection.tsx` | Filtrer par `assigned_to === currentUserId` |
| `src/contexts/SidebarContext.tsx` | Passer userId pour le filtre sidebar |

