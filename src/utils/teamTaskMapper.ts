/**
 * Centralised mapping between team_tasks DB columns (snake_case)
 * and the TeamTask / Task camelCase interface.
 */

import { normalizeTaskCategory } from '@/types/task';

/** DB row → camelCase TeamTask fields */
export const mapDbRowToTeamTask = (row: Record<string, any>) => ({
  ...row,
  category: normalizeTaskCategory(row.category),
  estimatedTime: row.estimatedtime,
  isCompleted: row.iscompleted,
  isExpanded: row.isexpanded,
  isRecurring: row.isrecurring,
  parentId: row.parentid,
  scheduledDate: row.scheduleddate ? new Date(row.scheduleddate) : undefined,
  startTime: row.starttime ? new Date(row.starttime) : undefined,
  lastCompletedAt: row.lastcompletedat ? new Date(row.lastcompletedat) : undefined,
  recurrenceInterval: row.recurrenceinterval,
  scheduledTime: row.scheduledtime,
  subCategory: row.subcategory,
  createdAt: new Date(row.created_at),
  project_id: row.project_id || null,
  projectStatus: row.project_status || undefined,
  is_blocked: row.is_blocked ?? false,
  blocked_reason: row.blocked_reason ?? null,
});

/** camelCase partial updates → snake_case DB columns */
export const mapCamelToSnake = (updates: Record<string, any>): Record<string, any> => {
  const mapped: Record<string, any> = {};

  const camelToSnakeMap: Record<string, string> = {
    estimatedTime: 'estimatedtime',
    isCompleted: 'iscompleted',
    isExpanded: 'isexpanded',
    isRecurring: 'isrecurring',
    parentId: 'parentid',
    subCategory: 'subcategory',
    recurrenceInterval: 'recurrenceinterval',
    scheduledTime: 'scheduledtime',
  };

  // Date fields need special serialisation
  const dateFields: Record<string, (v: any) => any> = {
    scheduledDate: (v: any) => v ? (v instanceof Date ? v.toISOString().split('T')[0] : v) : null,
    startTime: (v: any) => v ? (v instanceof Date ? v.toISOString() : v) : null,
    lastCompletedAt: (v: any) => v ? (v instanceof Date ? v.toISOString() : v) : null,
  };

  const dateSnakeMap: Record<string, string> = {
    scheduledDate: 'scheduleddate',
    startTime: 'starttime',
    lastCompletedAt: 'lastcompletedat',
  };

  // Pass-through fields (same name in both)
  const passthrough = ['name', 'category', 'context', 'duration', 'level', 'assigned_to', 'project_id', 'project_status'];

  for (const [key, value] of Object.entries(updates)) {
    if (camelToSnakeMap[key]) {
      mapped[camelToSnakeMap[key]] = value;
    } else if (dateFields[key]) {
      mapped[dateSnakeMap[key]] = dateFields[key](value);
    } else if (passthrough.includes(key)) {
      mapped[key] = key === 'category' ? normalizeTaskCategory(value) : value;
    }
  }

  return mapped;
};
