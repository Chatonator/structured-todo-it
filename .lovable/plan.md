

# Granularité des droits d'équipe

## Situation actuelle

3 rôles (owner, admin, member) avec des droits implicites dans le code :
- **Owner** : tout, y compris supprimer l'équipe et transférer ownership
- **Admin** : gérer membres, inviter, supprimer labels
- **Member** : tout le reste (créer tâches, assigner, commenter, labels, bloquer...)

Pas de panneau de gestion des droits visible. Les permissions sont codées en dur.

## Proposition

### 1. Système de permissions par rôle (frontend)

Créer un mapping de permissions configurable côté frontend, applicable par rôle. Permissions granulaires :

| Permission | Owner | Admin | Member (défaut) |
|---|---|---|---|
| `manage_members` (inviter, retirer, changer rôles) | ✓ | ✓ | ✗ |
| `manage_labels` (créer, supprimer labels) | ✓ | ✓ | ✗ |
| `create_tasks` | ✓ | ✓ | ✓ |
| `assign_tasks` (assigner à n'importe qui) | ✓ | ✓ | ✗ |
| `assign_self` (s'auto-attribuer) | ✓ | ✓ | ✓ |
| `complete_any_task` (compléter les tâches des autres) | ✓ | ✓ | ✗ |
| `complete_own_task` | ✓ | ✓ | ✓ |
| `block_tasks` | ✓ | ✓ | ✓ |
| `manage_projects` (créer/supprimer projets) | ✓ | ✓ | ✗ |
| `view_invite_code` | ✓ | ✓ | ✗ |
| `delete_comments` (supprimer les commentaires des autres) | ✓ | ✓ | ✗ |

### 2. Panneau de gestion des droits dans la vue équipe

Nouvelle section pliable "Gestion des droits" (visible uniquement pour owner/admin) dans `TeamTasksView.tsx` :
- Affiche un tableau rôle × permission avec des toggles
- Les permissions owner ne sont pas modifiables (toujours tout)
- Stocké dans la table `teams` via une colonne `permissions_config` (jsonb)

### 3. Changements

| Fichier | Action |
|---|---|
| Migration SQL | Ajouter colonne `permissions_config jsonb DEFAULT '{}'` à `teams` |
| `src/lib/teamPermissions.ts` (nouveau) | Helper `getPermission(role, config, permission) → boolean`, constantes par défaut |
| `src/hooks/useTeamPermissions.ts` (nouveau) | Hook qui expose `can(permission)` basé sur le rôle du user courant + config de l'équipe |
| `TeamTasksView.tsx` | Conditionner les boutons (inviter, créer tâche, labels) avec `can()`. Ajouter section "Gestion des droits" |
| `TeamTaskCard.tsx` | Conditionner assign, block, complete avec `can()` |
| `TeamMembersList.tsx` | Conditionner le menu rôle/retirer avec `can('manage_members')` |
| `useTeamViewData.ts` | Intégrer `useTeamPermissions`, exposer `can` dans les actions |

### 4. Section UI "Gestion des droits"

Composant `TeamPermissionsPanel.tsx` :
- Tableau 3 colonnes (Permission, Admin, Membre) avec des Switch pour chaque permission
- Owner a tout verrouillé (grisé)
- Sauvegarde auto dans `teams.permissions_config`
- Visible uniquement si `role === 'owner'` ou `role === 'admin'`

