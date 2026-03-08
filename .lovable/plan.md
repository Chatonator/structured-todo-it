

## Plan : Intégration complète des équipes dans la navigation et les contextes de création

### Problèmes identifiés

1. **Vue Équipe cachée** : elle n'est pas dans `allNavigationItems` (AppContext), pas dans `iconMap` (ViewNavigation), et n'apparaît que quand on sélectionne une équipe depuis ContextPills
2. **Auto-switch forcé** : quand on sélectionne une équipe, on est redirigé automatiquement sur la vue "team" sans pouvoir naviguer librement
3. **Pas de contexte équipe dans les modales de création** : `ContextPillSelector` n'affiche que Pro/Perso, impossible de créer directement une tâche d'équipe depuis les modales

### Changements

#### 1. `AppContext.tsx` — Ajouter "Équipe" dans la navigation
- Ajouter `{ key: 'team', title: 'Équipe', icon: '👥' }` à `allNavigationItems`
- La vue sera visible dans la barre de navigation comme toutes les autres

#### 2. `ViewNavigation.tsx` — Ajouter l'icône Users
- Ajouter `team: Users` dans `iconMap` pour que l'icône s'affiche dans la navigation

#### 3. `BottomNavigation.tsx` — Ajouter l'icône Users pour mobile
- Ajouter `team: <Users />` dans `iconMap`

#### 4. `Index.tsx` — Supprimer l'auto-switch forcé
- Retirer les deux `useEffect` qui forcent la navigation vers 'team' quand une équipe est sélectionnée et vers 'home' quand elle est désélectionnée
- L'utilisateur peut naviguer librement entre les vues même avec une équipe active ; le contenu sera filtré par le contexte équipe

#### 5. `ContextPillSelector.tsx` — Ajouter les équipes comme option
- Accepter une prop optionnelle `teams` et `currentTeam`
- Afficher les équipes comme troisième option après Pro/Perso (avec icône Users et couleur spécifique)
- Quand une équipe est sélectionnée, appeler un callback `onTeamSelect`

#### 6. `TaskDraftForm.tsx` — Connecter le sélecteur de contexte équipe
- Passer les teams au `ContextPillSelector` pour que la création de tâches puisse cibler une équipe

#### 7. `HeaderBar.tsx` — Nettoyer le badge équipe redondant
- Le badge indicateur d'équipe peut rester comme indicateur visuel rapide

### Fichiers modifiés
- `src/contexts/AppContext.tsx`
- `src/components/layout/ViewNavigation.tsx`
- `src/components/layout/BottomNavigation.tsx`
- `src/pages/Index.tsx`
- `src/components/common/ContextPillSelector.tsx`
- `src/components/task/TaskDraftForm.tsx`

### Ce qui ne change pas
- `TeamTasksView` : le contenu de la vue reste identique, c'est un dashboard d'administration d'équipe
- `ContextPills` (header) : conserve son fonctionnement actuel de filtre global
- Les flux Supabase : pas de changement de schéma

