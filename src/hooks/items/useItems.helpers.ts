import type { Json } from '@/integrations/supabase/types';
import { Item, ItemContextType, ItemMetadata, categoryFromEisenhower, eisenhowerFromCategory } from '@/types/item';
import { normalizeTaskCategory, TaskCategory } from '@/types/task';

export interface ItemRow {
  id: string;
  user_id: string;
  name: string;
  item_type: string;
  category: string;
  context: string;
  estimatedTime: number;
  parent_id: string | null;
  order_index: number;
  is_completed: boolean;
  is_pinned: boolean;
  is_important: boolean;
  is_urgent: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export const sortItemsByOrder = (items: Item[]): Item[] => {
  return [...items].sort((a, b) => a.orderIndex - b.orderIndex);
};

export function rowToItem(row: ItemRow): Item {
  const derivedCategory = categoryFromEisenhower({
    isImportant: row.is_important,
    isUrgent: row.is_urgent,
  });

  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    contextType: row.item_type as ItemContextType,
    parentId: row.parent_id,
    metadata: {
      ...row.metadata,
      category: normalizeTaskCategory((row.metadata as Record<string, unknown>)?.category as string ?? row.category ?? derivedCategory),
      context: row.context,
      estimatedTime: row.estimatedTime,
      isImportant: row.is_important,
      isUrgent: row.is_urgent,
    } as ItemMetadata,
    orderIndex: row.order_index,
    isCompleted: row.is_completed,
    isPinned: row.is_pinned,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

interface CreateInsertDataParams {
  userId: string;
  name: string;
  contextType: ItemContextType;
  parentId?: string | null;
  orderIndex: number;
  metadata: Partial<ItemMetadata>;
}

export function createInsertData({ userId, name, contextType, parentId, orderIndex, metadata }: CreateInsertDataParams) {
  const eisenhower = (metadata.isImportant !== undefined && metadata.isUrgent !== undefined)
    ? { isImportant: !!metadata.isImportant, isUrgent: !!metadata.isUrgent }
    : eisenhowerFromCategory((metadata.category as TaskCategory) || 'low_priority');

  return {
    user_id: userId,
    name,
    item_type: contextType,
    category: categoryFromEisenhower(eisenhower),
    context: (metadata.context as string) || 'Perso',
    estimatedTime: (metadata.estimatedTime as number) || 30,
    parent_id: parentId ?? null,
    order_index: orderIndex,
    is_completed: false,
    is_pinned: false,
    is_important: eisenhower.isImportant,
    is_urgent: eisenhower.isUrgent,
    metadata: metadata as Json,
  };
}

export function mergeMetadataUpdate(currentItem: ItemRow, metadataUpdates: Partial<ItemMetadata>) {
  const mergedMetadata = { ...(currentItem.metadata as Record<string, unknown>), ...metadataUpdates };
  const dbUpdates: Record<string, unknown> = {
    metadata: mergedMetadata,
  };

  if (metadataUpdates.isImportant !== undefined || metadataUpdates.isUrgent !== undefined) {
    const newImportant = metadataUpdates.isImportant ?? currentItem.is_important ?? false;
    const newUrgent = metadataUpdates.isUrgent ?? currentItem.is_urgent ?? false;
    dbUpdates.is_important = newImportant;
    dbUpdates.is_urgent = newUrgent;
    dbUpdates.category = categoryFromEisenhower({ isImportant: !!newImportant, isUrgent: !!newUrgent });
  } else if (metadataUpdates.category) {
    const eisenhower = eisenhowerFromCategory(metadataUpdates.category as TaskCategory);
    dbUpdates.is_important = eisenhower.isImportant;
    dbUpdates.is_urgent = eisenhower.isUrgent;
    dbUpdates.category = normalizeTaskCategory(metadataUpdates.category as TaskCategory);
  }

  if (metadataUpdates.context) {
    dbUpdates.context = metadataUpdates.context;
  }

  if (metadataUpdates.estimatedTime) {
    dbUpdates.estimatedTime = metadataUpdates.estimatedTime;
  }

  return dbUpdates;
}

export async function runSequentially<T>(
  values: T[],
  runner: (value: T) => Promise<void>,
  getLabel: (value: T) => string
): Promise<string[]> {
  const errors: string[] = [];

  for (const value of values) {
    try {
      await runner(value);
    } catch (error: any) {
      const message = error?.message || 'Unknown error';
      errors.push(`${getLabel(value)}: ${message}`);
    }
  }

  return errors;
}
