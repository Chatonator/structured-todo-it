import type { TeamRole } from '@/hooks/useTeams';

export type TeamPermission =
  | 'manage_members'
  | 'manage_labels'
  | 'create_tasks'
  | 'assign_tasks'
  | 'assign_self'
  | 'complete_any_task'
  | 'complete_own_task'
  | 'block_tasks'
  | 'manage_projects'
  | 'view_invite_code'
  | 'delete_comments';

export const PERMISSION_LABELS: Record<TeamPermission, string> = {
  manage_members: 'Gérer les membres',
  manage_labels: 'Gérer les labels',
  create_tasks: 'Créer des tâches',
  assign_tasks: 'Assigner à n\'importe qui',
  assign_self: 'S\'auto-attribuer',
  complete_any_task: 'Compléter toute tâche',
  complete_own_task: 'Compléter ses tâches',
  block_tasks: 'Signaler un blocage',
  manage_projects: 'Gérer les projets',
  view_invite_code: 'Voir le code d\'invitation',
  delete_comments: 'Supprimer les commentaires des autres',
};

export const ALL_PERMISSIONS: TeamPermission[] = Object.keys(PERMISSION_LABELS) as TeamPermission[];

/** Default permissions per role (owner always has everything) */
const DEFAULT_PERMISSIONS: Record<'admin' | 'member', Record<TeamPermission, boolean>> = {
  admin: {
    manage_members: true,
    manage_labels: true,
    create_tasks: true,
    assign_tasks: true,
    assign_self: true,
    complete_any_task: true,
    complete_own_task: true,
    block_tasks: true,
    manage_projects: true,
    view_invite_code: true,
    delete_comments: true,
  },
  member: {
    manage_members: false,
    manage_labels: false,
    create_tasks: true,
    assign_tasks: false,
    assign_self: true,
    complete_any_task: false,
    complete_own_task: true,
    block_tasks: true,
    manage_projects: false,
    view_invite_code: false,
    delete_comments: false,
  },
};

export type PermissionsConfig = Partial<Record<'admin' | 'member', Partial<Record<TeamPermission, boolean>>>>;

/**
 * Resolve whether a role has a given permission, considering team-level overrides.
 */
export function hasPermission(
  role: TeamRole,
  permission: TeamPermission,
  config: PermissionsConfig = {}
): boolean {
  // Owner always has all permissions
  if (role === 'owner') return true;

  const roleKey = role as 'admin' | 'member';
  const override = config[roleKey]?.[permission];
  if (typeof override === 'boolean') return override;

  return DEFAULT_PERMISSIONS[roleKey][permission];
}

export function getDefaultPermissions() {
  return DEFAULT_PERMISSIONS;
}
