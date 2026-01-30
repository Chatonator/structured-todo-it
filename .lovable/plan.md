
# Plan d'Unification Tâches & Projets (Personnel + Équipe)

## ✅ IMPLÉMENTÉ

L'unification a été réalisée selon le plan suivant :

---

## Architecture Finale

```text
┌─────────────────────────────────────────────────────────┐
│  ContextPills: [Toutes] [Perso] [Pro] [Équipe ▼]       │
│  → Sélection d'une équipe → currentTeam défini         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  ProjectsView / TasksView                               │
│  ─────────────────────────────────────────────────────  │
│  useUnifiedProjects / useUnifiedTasks                   │
│  Si currentTeam → team_projects/tasks                   │
│  Sinon → items (projets/tâches personnels)              │
└─────────────────────────────────────────────────────────┘
```

---

## Fichiers Créés/Modifiés

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/hooks/useUnifiedProjects.ts` | ✅ Créé | Hook unifié qui switch entre `useProjects` et `useTeamProjects` selon `currentTeam` |
| `src/components/projects/ProjectsView.tsx` | ✅ Modifié | Utilise `useUnifiedProjects`, affiche badge équipe, titre dynamique |
| `src/components/projects/ProjectModal.tsx` | ✅ Modifié | Supporte `teamId`, badge équipe, utilise `TeamContext` |
| `src/components/views/teams/TeamTasksView.tsx` | ✅ Simplifié | Tableau de bord équipe avec stats, membres, liens vers vues unifiées |
| `src/types/teamProject.ts` | ✅ Conservé | Types `UnifiedProject`, fonctions de conversion |
| `src/hooks/useUnifiedTasks.ts` | ✅ Existant | Déjà unifié, continue de fonctionner |

---

## Comment ça fonctionne

### 1. Sélection du contexte équipe
L'utilisateur sélectionne une équipe via `ContextPills` → `currentTeam` est défini dans `TeamContext`.

### 2. ProjectsView s'adapte automatiquement
- Si `currentTeam` est défini → `useUnifiedProjects` retourne les projets de `team_projects`
- Sinon → retourne les projets personnels de `items`
- Le bouton "Nouveau projet" crée un projet d'équipe si une équipe est active

### 3. TasksView fonctionne de même
- `useUnifiedTasks` switch entre tâches personnelles et tâches d'équipe
- Interface identique, données différentes

### 4. TeamTasksView devient un tableau de bord
- Affiche les stats de l'équipe (tâches, projets, membres)
- Liens rapides vers ProjectsView et TasksView filtrés
- Gestion des membres (rôles, invitation)
- Code d'invitation copiable

---

## Avantages

1. **Réutilisation maximale** : Mêmes composants (ProjectCard, ProjectModal) pour perso et équipe
2. **UX cohérente** : Navigation identique, seul le filtre change
3. **Pas de migration de données** : Tables séparées avec RLS différentes
4. **Code simplifié** : Suppression des composants dupliqués (TeamProjectCard, TeamProjectModal)

---

## Prochaines améliorations potentielles

- [ ] Ajouter option "Créer comme projet d'équipe" dans ProjectModal même hors mode équipe
- [ ] Synchronisation des tâches entre équipes
- [ ] Notifications temps réel pour les tâches assignées
