/**
 * Options de filtrage et tri partagées entre ProjectDetail et TeamProjectDetail
 * Évite la duplication de ces configurations
 */

import { SubTaskCategory } from '@/types/task';

export type SortOption = 'none' | 'priority-high' | 'priority-low' | 'name' | 'time';
export type TeamSortOption = SortOption | 'assignee';
export type PriorityFilter = SubTaskCategory | 'all' | 'none';

export interface FilterOption<T> {
  value: T;
  label: string;
}

export const priorityOptions: FilterOption<PriorityFilter>[] = [
  { value: 'all', label: 'Toutes les priorités' },
  { value: 'Le plus important', label: '🔴 Le plus important' },
  { value: 'Important', label: '🟠 Important' },
  { value: 'Peut attendre', label: '🟡 Peut attendre' },
  { value: "Si j'ai le temps", label: "🟢 Si j'ai le temps" },
  { value: 'none', label: '⚪ Non définie' },
];

export const sortOptions: FilterOption<SortOption>[] = [
  { value: 'none', label: 'Aucun tri' },
  { value: 'priority-high', label: 'Priorité ↓ (haute → basse)' },
  { value: 'priority-low', label: 'Priorité ↑ (basse → haute)' },
  { value: 'name', label: 'Nom (A → Z)' },
  { value: 'time', label: 'Durée (longue → courte)' },
];

export const teamSortOptions: FilterOption<TeamSortOption>[] = [
  ...sortOptions,
  { value: 'assignee', label: 'Assignation' },
];
