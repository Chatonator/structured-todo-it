import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { getDefaultMetadata, getMissingRequiredFields } from '@/config/contextSchemas';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Item, ItemContextType, ItemMetadata } from '@/types/item';
import { transformItemContext, TransformationResult } from '@/services/contextTransformation';
import {
  createInsertData,
  ItemRow,
  mergeMetadataUpdate,
  rowToItem,
  runSequentially,
  sortItemsByOrder,
} from './items/useItems.helpers';

export interface UseItemsOptions {
  userId?: string;
  contextTypes?: ItemContextType[];
  parentId?: string | null;
  includeCompleted?: boolean;
  enabled?: boolean;
}

export interface CreateItemData {
  name: string;
  contextType: ItemContextType;
  userId?: string;
  parentId?: string | null;
  metadata?: Partial<ItemMetadata>;
  orderIndex?: number;
}

export function useItems(options: UseItemsOptions = {}) {
  const { contextTypes, parentId, includeCompleted = true, enabled = true } = options;
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const userId = options.userId || user?.id;
  const itemsQueryRoot = useMemo(() => ['items', userId], [userId]);
  const queryKey = useMemo(
    () => ['items', userId, contextTypes, parentId, includeCompleted],
    [userId, contextTypes, parentId, includeCompleted]
  );

  const { data: allItems = [], isLoading: loading, error: queryError } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId) return [];

      let query = supabase
        .from('items')
        .select('*')
        .eq('user_id', userId);

      if (contextTypes && contextTypes.length > 0) {
        query = query.in('item_type', contextTypes);
      }

      if (parentId !== undefined) {
        query = parentId === null ? query.is('parent_id', null) : query.eq('parent_id', parentId);
      }

      if (!includeCompleted) {
        query = query.eq('is_completed', false);
      }

      const { data, error } = await query.order('order_index', { ascending: true });
      if (error) throw error;

      return (data as ItemRow[]).map(rowToItem);
    },
    enabled: enabled && !!userId,
  });

  const error = queryError ? (queryError as Error).message : null;
  const items = useMemo(() => sortItemsByOrder(allItems), [allItems]);

  const createItemMutation = useMutation({
    mutationFn: async (data: CreateItemData) => {
      const itemUserId = data.userId || userId;
      if (!itemUserId) throw new Error('User not authenticated');

      const defaultMeta = getDefaultMetadata(data.contextType);
      const cleanMetadata = data.metadata
        ? Object.fromEntries(Object.entries(data.metadata).filter(([, value]) => value !== undefined))
        : {};
      const mergedMetadata = { ...defaultMeta, ...cleanMetadata };

      const missingFields = getMissingRequiredFields(data.contextType, mergedMetadata);
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      const orderIndex = data.orderIndex ?? items.filter((item) => (
        item.contextType === data.contextType && item.parentId === (data.parentId ?? null)
      )).length;

      const insertData = createInsertData({
        userId: itemUserId,
        name: data.name,
        contextType: data.contextType,
        parentId: data.parentId,
        orderIndex,
        metadata: mergedMetadata,
      });

      const { data: result, error } = await supabase
        .from('items')
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;
      return rowToItem(result as ItemRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemsQueryRoot });
    },
    onError: (mutationError) => {
      toast({
        title: 'Erreur',
        description: `Impossible de créer l'élément: ${mutationError.message}`,
        variant: 'destructive',
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Item> }) => {
      const { data: currentItem, error: fetchError } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !currentItem) {
        throw new Error(`Item not found: ${id}`);
      }

      const currentRow = currentItem as ItemRow;
      const dbUpdates: Record<string, unknown> = {};

      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.contextType !== undefined) {
        const allowedTransitions: Record<string, string[]> = {
          task: ['project_task', 'subtask'],
          project_task: ['task'],
          subtask: ['task', 'project_task'],
          project: [],
          habit: [],
          deck: [],
        };
        const currentType = currentRow.item_type;
        const newType = updates.contextType;
        if (currentType !== newType && !allowedTransitions[currentType]?.includes(newType)) {
          throw new Error(`Invalid context type transition: ${currentType} -> ${newType}`);
        }
        dbUpdates.item_type = updates.contextType;
      }

      if (updates.parentId !== undefined) {
        if (currentRow.item_type === 'project_task' && updates.parentId === null && updates.contextType !== 'task') {
          throw new Error('Cannot remove project_task from project without changing type to task');
        }
        dbUpdates.parent_id = updates.parentId;
      }

      if (updates.orderIndex !== undefined) dbUpdates.order_index = updates.orderIndex;
      if (updates.isCompleted !== undefined) dbUpdates.is_completed = updates.isCompleted;
      if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
      if (updates.metadata !== undefined) {
        Object.assign(dbUpdates, mergeMetadataUpdate(currentRow, updates.metadata));
      }

      const { data, error } = await supabase
        .from('items')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return rowToItem(data as ItemRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemsQueryRoot });
    },
    onError: (mutationError) => {
      toast({
        title: 'Erreur',
        description: `Impossible de mettre à jour l'élément: ${mutationError.message}`,
        variant: 'destructive',
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemsQueryRoot });
    },
    onError: (mutationError) => {
      toast({
        title: 'Erreur',
        description: `Impossible de supprimer l'élément: ${mutationError.message}`,
        variant: 'destructive',
      });
    },
  });

  const transformItemMutation = useMutation({
    mutationFn: async ({
      id,
      newContextType,
      additionalMetadata,
    }: {
      id: string;
      newContextType: ItemContextType;
      additionalMetadata?: Partial<ItemMetadata>;
    }) => {
      const item = items.find((entry) => entry.id === id);
      if (!item) throw new Error('Item not found');

      const children = items.filter((entry) => entry.parentId === id);
      const result = transformItemContext(item, newContextType, additionalMetadata, children);

      if (!result.success || !result.item) {
        throw new Error(result.error || 'Transformation failed');
      }

      await supabase
        .from('items')
        .update({
          item_type: result.item.contextType,
          metadata: result.item.metadata as Json,
          parent_id: result.item.parentId,
          category: result.item.metadata.category,
          context: (result.item.metadata.context as string) || 'Perso',
          estimatedTime: (result.item.metadata.estimatedTime as number) || 30,
          is_important: !!result.item.metadata.isImportant,
          is_urgent: !!result.item.metadata.isUrgent,
        } as never)
        .eq('id', id);

      if (result.childrenUpdates && result.childrenUpdates.length > 0) {
        for (const transformation of result.childrenUpdates) {
          const child = children.find((entry) => entry.id === transformation.childId);
          if (!child) continue;

          const childResult = transformItemContext(
            { ...child, parentId: transformation.newParentId },
            transformation.newContextType
          );

          if (childResult.success && childResult.item) {
            await supabase
              .from('items')
              .update({
                item_type: childResult.item.contextType,
                metadata: childResult.item.metadata as Json,
                parent_id: childResult.item.parentId,
              } as never)
              .eq('id', childResult.item.id);
          }
        }
      }

      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: itemsQueryRoot });
      toast({
        title: 'Transformation réussie',
        description: `L'élément a été transformé en ${variables.newContextType}`,
      });
    },
    onError: (mutationError) => {
      toast({
        title: 'Erreur',
        description: `Impossible de transformer l'élément: ${mutationError.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleCreateItem = useCallback((data: CreateItemData): Promise<Item> => {
    return createItemMutation.mutateAsync(data);
  }, [createItemMutation]);

  const handleUpdateItem = useCallback((id: string, updates: Partial<Item>): Promise<Item> => {
    return updateItemMutation.mutateAsync({ id, updates });
  }, [updateItemMutation]);

  const handleDeleteItem = useCallback((id: string): Promise<void> => {
    return deleteItemMutation.mutateAsync(id);
  }, [deleteItemMutation]);

  const handleTransformContext = useCallback((
    id: string,
    newContextType: ItemContextType,
    additionalMetadata?: Partial<ItemMetadata>
  ): Promise<TransformationResult> => {
    return transformItemMutation.mutateAsync({ id, newContextType, additionalMetadata });
  }, [transformItemMutation]);

  const getItem = useCallback((id: string): Item | undefined => {
    return items.find((item) => item.id === id);
  }, [items]);

  const getChildren = useCallback((parentItemId: string): Item[] => {
    return sortItemsByOrder(items.filter((item) => item.parentId === parentItemId));
  }, [items]);

  const getByContext = useCallback((contextType: ItemContextType): Item[] => {
    return sortItemsByOrder(items.filter((item) => item.contextType === contextType));
  }, [items]);

  const getRootItems = useCallback((contextType?: ItemContextType): Item[] => {
    return sortItemsByOrder(items.filter((item) => item.parentId === null && (!contextType || item.contextType === contextType)));
  }, [items]);

  const updateItems = useCallback(async (updates: { id: string; updates: Partial<Item> }[]): Promise<boolean> => {
    const errors = await runSequentially(
      updates,
      async (update) => {
        await handleUpdateItem(update.id, update.updates);
      },
      (update) => update.id
    );

    if (errors.length > 0) {
      console.warn('Bulk update completed with errors', { errors });
    }

    return errors.length === 0;
  }, [handleUpdateItem]);

  const deleteItems = useCallback(async (ids: string[]): Promise<boolean> => {
    const errors = await runSequentially(
      ids,
      async (id) => {
        await handleDeleteItem(id);
      },
      (id) => id
    );

    if (errors.length > 0) {
      console.warn('Bulk delete completed with errors', { errors });
    }

    return errors.length === 0;
  }, [handleDeleteItem]);

  const reorderItems = useCallback(async (ids: string[], startIndex: number, endIndex: number): Promise<void> => {
    const reorderedIds = [...ids];
    const [removed] = reorderedIds.splice(startIndex, 1);
    reorderedIds.splice(endIndex, 0, removed);

    const updates = reorderedIds.map((id, index) => ({
      id,
      updates: { orderIndex: index },
    }));

    await updateItems(updates);
  }, [updateItems]);

  const toggleComplete = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { data: currentItem, error: fetchError } = await supabase
        .from('items')
        .select('is_completed, metadata')
        .eq('id', id)
        .single();

      if (fetchError || !currentItem) {
        console.error('toggleComplete: Item not found in DB', { id });
        return false;
      }

      const newCompletedState = !currentItem.is_completed;
      const currentMetadata = (currentItem.metadata as Record<string, unknown>) || {};

      await handleUpdateItem(id, {
        isCompleted: newCompletedState,
        metadata: {
          ...currentMetadata,
          completedAt: newCompletedState ? new Date() : undefined,
        },
      });
      return true;
    } catch (toggleError) {
      console.error('toggleComplete error:', toggleError);
      return false;
    }
  }, [handleUpdateItem]);

  const togglePin = useCallback(async (id: string): Promise<boolean> => {
    const item = items.find((entry) => entry.id === id);
    if (!item) return false;

    try {
      await handleUpdateItem(id, { isPinned: !item.isPinned });
      return true;
    } catch {
      return false;
    }
  }, [items, handleUpdateItem]);

  const getPinnedItems = useCallback((contextType?: ItemContextType): Item[] => {
    return sortItemsByOrder(items.filter((item) => item.isPinned && (!contextType || item.contextType === contextType)));
  }, [items]);

  const reload = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: itemsQueryRoot });
  }, [queryClient, itemsQueryRoot]);

  return {
    items,
    loading,
    error,
    createItem: handleCreateItem,
    updateItem: handleUpdateItem,
    deleteItem: handleDeleteItem,
    createItemMutation,
    updateItemMutation,
    deleteItemMutation,
    transformItemMutation,
    updateItems,
    deleteItems,
    transformContext: handleTransformContext,
    getItem,
    getChildren,
    getByContext,
    getRootItems,
    getPinnedItems,
    reorderItems,
    toggleComplete,
    togglePin,
    reload,
  };
}
