// ============= Item Adapters =============
// Convert between unified Item type and existing entity types
// This enables backward compatibility during migration

import { Item, ItemContextType, ItemMetadata, createItem } from '@/types/item';
import { Task, TaskCategory, TaskContext } from '@/types/task';
import { Project, ProjectStatus } from '@/types/project';
import { Habit, Deck, HabitFrequency } from '@/types/habit';

// ============= Task Adapters =============

export function taskToItem(task: Task, userId: string): Item {
  return createItem({
    id: task.id,
    userId,
    name: task.name,
    contextType: task.level === 0 ? 'task' : 'subtask',
    parentId: task.parentId || null,
    metadata: {
      category: task.category,
      subCategory: task.subCategory,
      context: task.context,
      estimatedTime: task.estimatedTime,
      duration: task.duration,
      level: task.level,
      isExpanded: task.isExpanded,
      projectId: task.projectId,
      projectStatus: task.projectStatus
    },
    orderIndex: 0,
    isCompleted: task.isCompleted,
    createdAt: task.createdAt,
    updatedAt: new Date()
  });
}

export function itemToTask(item: Item): Task {
  if (!['task', 'subtask', 'project_task', 'team_task'].includes(item.contextType)) {
    throw new Error(`Cannot convert ${item.contextType} to Task`);
  }
  
  const metadata = item.metadata;
  
  return {
    id: item.id,
    name: item.name,
    category: (metadata.category as TaskCategory) || 'Autres',
    subCategory: metadata.subCategory,
    context: (metadata.context as TaskContext) || 'Perso',
    estimatedTime: (metadata.estimatedTime as number) || 30,
    createdAt: item.createdAt,
    parentId: item.parentId || undefined,
    level: (metadata.level as 0 | 1 | 2) || 0,
    isExpanded: (metadata.isExpanded as boolean) ?? false,
    isCompleted: item.isCompleted,
    duration: metadata.duration as number | undefined,
    projectId: metadata.projectId as string | undefined,
    projectStatus: metadata.projectStatus
  };
}

// ============= Project Adapters =============

export function projectToItem(project: Project): Item {
  return createItem({
    id: project.id,
    userId: project.userId,
    name: project.name,
    contextType: 'project',
    parentId: null,
    metadata: {
      description: project.description,
      icon: project.icon,
      color: project.color,
      status: project.status,
      targetDate: project.targetDate,
      progress: project.progress,
      completedAt: project.completedAt
    },
    orderIndex: project.orderIndex,
    isCompleted: project.status === 'completed',
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  });
}

export function itemToProject(item: Item): Project {
  if (item.contextType !== 'project') {
    throw new Error(`Cannot convert ${item.contextType} to Project`);
  }
  
  const metadata = item.metadata;
  
  return {
    id: item.id,
    userId: item.userId,
    name: item.name,
    description: metadata.description as string | undefined,
    icon: metadata.icon as string | undefined,
    color: (metadata.color as string) || '#a78bfa',
    status: (metadata.status as ProjectStatus) || 'planning',
    targetDate: metadata.targetDate as Date | undefined,
    orderIndex: item.orderIndex,
    progress: (metadata.progress as number) || 0,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    completedAt: metadata.completedAt as Date | undefined
  };
}

// ============= Habit Adapters =============

export function habitToItem(habit: Habit, userId: string): Item {
  return createItem({
    id: habit.id,
    userId,
    name: habit.name,
    contextType: 'habit',
    parentId: habit.deckId,
    metadata: {
      description: habit.description,
      deckId: habit.deckId,
      frequency: habit.frequency,
      timesPerWeek: habit.timesPerWeek,
      timesPerMonth: habit.timesPerMonth,
      targetDays: habit.targetDays,
      isActive: habit.isActive,
      icon: habit.icon,
      color: habit.color,
      isChallenge: habit.isChallenge,
      challengeStartDate: habit.challengeStartDate,
      challengeEndDate: habit.challengeEndDate,
      challengeDurationDays: habit.challengeDurationDays,
      challengeEndAction: habit.challengeEndAction,
      isLocked: habit.isLocked,
      unlockCondition: habit.unlockCondition
    },
    orderIndex: habit.order,
    isCompleted: false,
    createdAt: habit.createdAt,
    updatedAt: new Date()
  });
}

export function itemToHabit(item: Item): Habit {
  if (item.contextType !== 'habit') {
    throw new Error(`Cannot convert ${item.contextType} to Habit`);
  }
  
  const metadata = item.metadata;
  
  return {
    id: item.id,
    userId: item.userId,
    name: item.name,
    category: (metadata.category as Habit['category']) || 'Quotidien',
    context: (metadata.context as Habit['context']) || 'Perso',
    estimatedTime: (metadata.estimatedTime as number) || 15,
    description: metadata.description as string | undefined,
    deckId: (metadata.deckId as string) || '',
    frequency: (metadata.frequency as HabitFrequency) || 'daily',
    timesPerWeek: metadata.timesPerWeek as number | undefined,
    timesPerMonth: metadata.timesPerMonth as number | undefined,
    targetDays: metadata.targetDays as number[] | undefined,
    isActive: (metadata.isActive as boolean) ?? true,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    order: item.orderIndex,
    icon: metadata.icon as string | undefined,
    color: metadata.color as string | undefined,
    isChallenge: metadata.isChallenge as boolean | undefined,
    challengeStartDate: metadata.challengeStartDate as Date | undefined,
    challengeEndDate: metadata.challengeEndDate as Date | undefined,
    challengeDurationDays: metadata.challengeDurationDays as number | undefined,
    challengeEndAction: metadata.challengeEndAction,
    isLocked: metadata.isLocked as boolean | undefined,
    unlockCondition: metadata.unlockCondition
  };
}

// ============= Deck Adapters =============

export function deckToItem(deck: Deck): Item {
  return createItem({
    id: deck.id,
    userId: deck.userId,
    name: deck.name,
    contextType: 'deck',
    parentId: null,
    metadata: {
      description: deck.description,
      color: deck.color,
      icon: deck.icon,
      isDefault: deck.isDefault,
      isProgressionDeck: deck.isProgressionDeck
    },
    orderIndex: deck.order,
    isCompleted: false,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt
  });
}

export function itemToDeck(item: Item): Deck {
  if (item.contextType !== 'deck') {
    throw new Error(`Cannot convert ${item.contextType} to Deck`);
  }
  
  const metadata = item.metadata;
  
  return {
    id: item.id,
    userId: item.userId,
    name: item.name,
    category: (metadata.category as Deck['category']) || 'Quotidien',
    context: (metadata.context as Deck['context']) || 'Perso',
    estimatedTime: (metadata.estimatedTime as number) || 30,
    description: metadata.description as string | undefined,
    color: (metadata.color as string) || '#10b981',
    icon: metadata.icon as string | undefined,
    isDefault: (metadata.isDefault as boolean) ?? false,
    order: item.orderIndex,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    isProgressionDeck: metadata.isProgressionDeck as boolean | undefined
  };
}

// ============= Generic Adapter =============

export function entityToItem(
  entity: Task | Project | Habit | Deck,
  entityType: 'task' | 'project' | 'habit' | 'deck',
  userId?: string
): Item {
  switch (entityType) {
    case 'task':
      return taskToItem(entity as Task, userId!);
    case 'project':
      return projectToItem(entity as Project);
    case 'habit':
      return habitToItem(entity as Habit, userId!);
    case 'deck':
      return deckToItem(entity as Deck);
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

export function itemToEntity<T extends Task | Project | Habit | Deck>(
  item: Item,
  entityType: 'task' | 'project' | 'habit' | 'deck'
): T {
  switch (entityType) {
    case 'task':
      return itemToTask(item) as T;
    case 'project':
      return itemToProject(item) as T;
    case 'habit':
      return itemToHabit(item) as T;
    case 'deck':
      return itemToDeck(item) as T;
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

// ============= Batch Adapters =============

export function tasksToItems(tasks: Task[], userId: string): Item[] {
  return tasks.map(task => taskToItem(task, userId));
}

export function itemsToTasks(items: Item[]): Task[] {
  return items
    .filter(item => ['task', 'subtask', 'project_task', 'team_task'].includes(item.contextType))
    .map(item => itemToTask(item));
}

export function projectsToItems(projects: Project[]): Item[] {
  return projects.map(project => projectToItem(project));
}

export function itemsToProjects(items: Item[]): Project[] {
  return items
    .filter(item => item.contextType === 'project')
    .map(item => itemToProject(item));
}

export function habitsToItems(habits: Habit[], userId: string): Item[] {
  return habits.map(habit => habitToItem(habit, userId));
}

export function itemsToHabits(items: Item[]): Habit[] {
  return items
    .filter(item => item.contextType === 'habit')
    .map(item => itemToHabit(item));
}

export function decksToItems(decks: Deck[]): Item[] {
  return decks.map(deck => deckToItem(deck));
}

export function itemsToDecks(items: Item[]): Deck[] {
  return items
    .filter(item => item.contextType === 'deck')
    .map(item => itemToDeck(item));
}
