import { useState, useCallback } from 'react';
import { Item, ItemContextType, ItemMetadata } from '@/types/item';
import { transformItemContext, previewMissingFields, describeTransformation, ChildTransformation } from '@/services/contextTransformation';
import { getMissingRequiredFields } from '@/config/contextSchemas';

interface TransformState {
  isModalOpen: boolean;
  item: Item | null;
  targetContext: ItemContextType | null;
  missingFields: (keyof ItemMetadata)[];
  children: Item[];
}

interface UseContextTransformOptions {
  onTransformComplete?: (transformedItem: Item, childUpdates: ChildTransformation[]) => void;
  onError?: (error: string) => void;
}

export function useContextTransform(options: UseContextTransformOptions = {}) {
  const [state, setState] = useState<TransformState>({
    isModalOpen: false,
    item: null,
    targetContext: null,
    missingFields: [],
    children: []
  });

  const initiateTransform = useCallback((
    item: Item,
    targetContext: ItemContextType,
    children: Item[] = []
  ) => {
    // Vérifier les champs manquants
    const missingFields = getMissingRequiredFields(targetContext, item.metadata);
    
    if (missingFields.length > 0) {
      // Ouvrir la modale pour demander les champs manquants
      setState({
        isModalOpen: true,
        item,
        targetContext,
        missingFields,
        children
      });
    } else {
      // Transformation directe sans modale
      executeTransform(item, targetContext, {}, children);
    }
  }, []);

  const executeTransform = useCallback((
    item: Item,
    targetContext: ItemContextType,
    additionalMetadata: Partial<ItemMetadata>,
    children: Item[] = []
  ) => {
    const result = transformItemContext(item, targetContext, additionalMetadata, children);
    
    if (result.success && result.item) {
      options.onTransformComplete?.(result.item, result.childrenUpdates || []);
      closeModal();
    } else if (result.error) {
      options.onError?.(result.error);
    } else if (result.missingFields && result.missingFields.length > 0) {
      // Encore des champs manquants après soumission
      setState(prev => ({
        ...prev,
        missingFields: result.missingFields!
      }));
    }
  }, [options]);

  const confirmTransform = useCallback((additionalMetadata: Partial<ItemMetadata>) => {
    if (state.item && state.targetContext) {
      executeTransform(state.item, state.targetContext, additionalMetadata, state.children);
    }
  }, [state, executeTransform]);

  const closeModal = useCallback(() => {
    setState({
      isModalOpen: false,
      item: null,
      targetContext: null,
      missingFields: [],
      children: []
    });
  }, []);

  const getTransformDescription = useCallback((
    item: Item,
    targetContext: ItemContextType,
    children: Item[] = []
  ): string => {
    return describeTransformation(item, targetContext, children);
  }, []);

  const previewTransform = useCallback((
    item: Item,
    targetContext: ItemContextType
  ) => {
    return previewMissingFields(item, targetContext);
  }, []);

  return {
    // État
    isModalOpen: state.isModalOpen,
    currentItem: state.item,
    targetContext: state.targetContext,
    missingFields: state.missingFields,
    currentMetadata: state.item?.metadata || {},
    
    // Actions
    initiateTransform,
    confirmTransform,
    closeModal,
    
    // Utilitaires
    getTransformDescription,
    previewTransform
  };
}
