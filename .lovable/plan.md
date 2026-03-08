

# Ajout des rôles Superviseur et Invité

## Nouveaux rôles

Architecture : **Owner > Admin > Supervisor > Member > Guest**

| Permission | Owner | Admin | Supervisor | Member | Guest |
|---|---|---|---|---|---|
| `manage_members` | ✓ | ✓ | ✗ | ✗ | ✗ |
| `manage_labels` | ✓ | ✓ | ✓ | ✗ | ✗ |
| `create_tasks` | ✓ | ✓ | ✓ | ✓ | ✗ |
| `assign_tasks` | ✓ | ✓ | ✓ | ✗ | ✗ |
| `assign_self` | ✓ | ✓ | ✓ | ✓ | ✗ |
| `complete_any_task` | ✓ | ✓ | ✓ | ✗ | ✗ |
| `complete_own_task` | ✓ | ✓ | ✓ | ✓ | ✗ |
| `block_tasks` | ✓ | ✓ | ✓ | ✓ | ✗ |
| `manage_projects` | ✓ | ✓ | ✓ | ✗ | ✗ |
| `view_invite_code` | ✓ | ✓ | ✓ | ✗ | ✗ |
| `delete_comments` | ✓ | ✓ | ✗ | ✗ | ✗ |

**Supervisor** = chef d'équipe / lead : peut gérer les tâches et projets, assigner, compléter, mais ne gère pas les membres ni les droits.

**Guest** = lecture seule : peut voir les tâches, projets et commentaires mais ne peut rien modifier.

## Changements

### 1. Migration SQL
- `ALTER TYPE public.team_role ADD VALUE 'supervisor'` et `ADD VALUE 'guest'`
- Mettre à jour `is_team_admin` pour inclure `supervisor` dans les rôles autorisés à update les tâches (pas nécessaire car le RLS utilise `is_team_member` pour les updates — les permissions sont côté frontend)

### 2. `src/hooks/useTeams.ts`
- `TeamRole = 'owner' | 'admin' | 'supervisor' | 'member' | 'guest'`

### 3. `src/lib/teamPermissions.ts`
- Ajouter `supervisor` et `guest` dans `DEFAULT_PERMISSIONS`
- Mettre à jour `PermissionsConfig` pour inclure les 4 rôles configurables
- Guest : tout à `false` par défaut
- Supervisor : droits intermédiaires (voir tableau)

### 4. `src/components/team/TeamPermissionsPanel.tsx`
- 4 colonnes : Admin, Superviseur, Membre, Invité (avec toggles)

### 5. `src/components/team/TeamMembersList.tsx`
- `RoleBadge` : ajouter les badges Superviseur (vert) et Invité (gris clair)
- Menu dropdown : options pour promouvoir/rétrograder vers les 4 rôles non-owner

### 6. `supabase/functions/manage-team-member/index.ts`
- Ajouter `'supervisor'` et `'guest'` aux `validRoles`

### 7. `src/hooks/useTeamPermissions.ts`
- Pas de changement structurel (utilise déjà `hasPermission` qui gère dynamiquement)

