// ============= Unified Item Architecture =============
// All entities (tasks, projects, habits, etc.) are represented as Items
// with context-specific metadata stored in a flexible metadata object.

import { TaskCategory, SubTaskCategory, TaskContext, RecurrenceInterval, CATEGORY_CONFIG, CONTEXT_CONFIG, TIME_OPTIONS } from './task';
import { ProjectStatus, TaskProjectStatus } from './project';
import { HabitFrequency, UnlockCondition, ChallengeEndAction } from './habit';

// Re-export common types for unified access
export type ItemCategory = TaskCategory;
export type ItemContext = TaskContext;
export { CATEGORY_CONFIG, CONTEXT_CONFIG, TIME_OPTIONS };

// ============= Context Types =============
export type ItemContextType = 
  | 'task' 
  | 'subtask' 
  | 'project' 
  | 'project_task'
  | 'habit' 
  | 'deck' 
  | 'team_task';

// ============= Core Item Interface =============
export interface Item {
  id: string;
  userId: string;
  name: string;
  contextType: ItemContextType;
  parentId: string | null;
  metadata: ItemMetadata;
  orderIndex: number;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============= Unified Metadata Type =============
// All possible metadata fields across all context types
// Fields are optional because each context uses different subsets
export interface ItemMetadata {
  // === Task-specific ===
  category?: TaskCategory;
  subCategory?: SubTaskCategory;
  context?: TaskContext;
  estimatedTime?: number;
  duration?: number;
  level?: 0 | 1 | 2;
  isExpanded?: boolean;
  projectStatus?: TaskProjectStatus;
  projectId?: string;
  
  // === Project-specific ===
  description?: string;
  icon?: string;
  color?: string;
  status?: ProjectStatus;
  targetDate?: Date;
  progress?: number;
  completedAt?: Date;
  
  // === Habit-specific ===
  deckId?: string;
  frequency?: HabitFrequency;
  timesPerWeek?: number;
  timesPerMonth?: number;
  targetDays?: number[];
  isActive?: boolean;
  
  // Challenge mode
  isChallenge?: boolean;
  challengeStartDate?: Date;
  challengeEndDate?: Date;
  challengeDurationDays?: number;
  challengeEndAction?: ChallengeEndAction;
  
  // Unlock system
  isLocked?: boolean;
  unlockCondition?: UnlockCondition;
  
  // === Deck-specific ===
  isDefault?: boolean;
  isProgressionDeck?: boolean;
  
  // === Team task-specific ===
  teamId?: string;
  assignedTo?: string;
  
  // === Legacy/preserved fields ===
  // When transforming contexts, old fields are preserved here
  [key: string]: unknown;
}

// ============= Context-Specific Metadata Interfaces =============
// These define the expected shape for each context type

export interface TaskMetadata {
  category: TaskCategory;
  subCategory?: SubTaskCategory;
  context: TaskContext;
  estimatedTime: number;
  duration?: number;
  level: 0 | 1 | 2;
  isExpanded: boolean;
  projectStatus?: TaskProjectStatus;
  projectId?: string;
}

export interface SubtaskMetadata extends TaskMetadata {
  level: 1 | 2;
}

export interface ProjectMetadata {
  description?: string;
  icon?: string;
  color: string;
  status: ProjectStatus;
  targetDate?: Date;
  progress: number;
  completedAt?: Date;
}

export interface ProjectTaskMetadata {
  category: TaskCategory;
  subCategory?: SubTaskCategory;
  context: TaskContext;
  estimatedTime: number;
  duration?: number;
  projectStatus: TaskProjectStatus;
}

export interface HabitMetadata {
  description?: string;
  deckId: string;
  frequency: HabitFrequency;
  timesPerWeek?: number;
  timesPerMonth?: number;
  targetDays?: number[];
  isActive: boolean;
  icon?: string;
  color?: string;
  isChallenge?: boolean;
  challengeStartDate?: Date;
  challengeEndDate?: Date;
  challengeDurationDays?: number;
  challengeEndAction?: ChallengeEndAction;
  isLocked?: boolean;
  unlockCondition?: UnlockCondition;
}

export interface DeckMetadata {
  description?: string;
  color: string;
  icon?: string;
  isDefault: boolean;
  isProgressionDeck?: boolean;
}

export interface TeamTaskMetadata extends TaskMetadata {
  teamId: string;
  assignedTo?: string;
}

// ============= Type Guards =============
export function isTaskItem(item: Item): boolean {
  return item.contextType === 'task';
}

export function isSubtaskItem(item: Item): boolean {
  return item.contextType === 'subtask';
}

export function isProjectItem(item: Item): boolean {
  return item.contextType === 'project';
}

export function isProjectTaskItem(item: Item): boolean {
  return item.contextType === 'project_task';
}

export function isHabitItem(item: Item): boolean {
  return item.contextType === 'habit';
}

export function isDeckItem(item: Item): boolean {
  return item.contextType === 'deck';
}

export function isTeamTaskItem(item: Item): boolean {
  return item.contextType === 'team_task';
}

// ============= Hierarchy Levels =============
// Items at the same conceptual level
export const LEVEL_1_CONTEXTS: ItemContextType[] = ['task', 'project', 'deck'];
export const LEVEL_2_CONTEXTS: ItemContextType[] = ['subtask', 'project_task', 'habit'];
export const LEVEL_3_CONTEXTS: ItemContextType[] = []; // For future: sub-subtasks

// ============= Context Labels =============
export const CONTEXT_TYPE_LABELS: Record<ItemContextType, string> = {
  task: 'Tâche',
  subtask: 'Sous-tâche',
  project: 'Projet',
  project_task: 'Tâche de projet',
  habit: 'Habitude',
  deck: 'Deck',
  team_task: 'Tâche d\'équipe'
};

// ============= Helper to create a new Item =============
export function createItem(
  partial: Partial<Item> & { name: string; contextType: ItemContextType; userId: string }
): Item {
  return {
    id: partial.id || crypto.randomUUID(),
    userId: partial.userId,
    name: partial.name,
    contextType: partial.contextType,
    parentId: partial.parentId ?? null,
    metadata: partial.metadata ?? {},
    orderIndex: partial.orderIndex ?? 0,
    isCompleted: partial.isCompleted ?? false,
    createdAt: partial.createdAt ?? new Date(),
    updatedAt: partial.updatedAt ?? new Date()
  };
}

// ============= Base Item Interface for Harmonization =============
// Common interface for mandatory fields across all entities
export interface BaseItem {
  id: string;
  userId: string;
  name: string;
  category: ItemCategory;
  context: ItemContext;
  estimatedTime: number; // en minutes
  createdAt: Date;
  updatedAt: Date;
}

// Type pour les données de création d'un item (champs obligatoires)
export interface BaseItemInput {
  name: string;
  category: ItemCategory;
  context: ItemContext;
  estimatedTime: number;
}

// Helper pour formater le temps estimé
export const formatEstimatedTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h${remainingMinutes}`;
};
