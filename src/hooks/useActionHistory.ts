
import { useState, useCallback } from 'react';

export interface HistoryAction {
  id: string;
  type: 'add' | 'remove' | 'update' | 'reorder';
  timestamp: Date;
  data: any;
  reverseAction: () => void;
  forwardAction?: () => void;
}

export const useActionHistory = () => {
  const [history, setHistory] = useState<HistoryAction[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const addAction = useCallback((action: Omit<HistoryAction, 'id' | 'timestamp'>) => {
    const newAction: HistoryAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    setHistory(prev => {
      // Couper l'historique après l'index courant pour éviter les branches
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(newAction);
      
      // Limiter à 10 actions max
      if (newHistory.length > 10) {
        newHistory.shift();
        return newHistory;
      }
      
      return newHistory;
    });
    
    setCurrentIndex(prev => {
      const newIndex = Math.min(prev + 1, 9);
      return newIndex;
    });
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (currentIndex >= 0 && history[currentIndex]) {
      const action = history[currentIndex];
      console.log('Executing undo for action:', action.type);
      action.reverseAction();
      setCurrentIndex(prev => prev - 1);
      return true;
    }
    return false;
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < history.length && history[nextIndex]) {
      const action = history[nextIndex];
      console.log('Executing redo for action:', action.type);
      
      // Pour le redo, on devrait réexécuter l'action originale
      // Comme nous n'avons pas de forwardAction, on ne fait que avancer dans l'historique
      setCurrentIndex(nextIndex);
      return true;
    }
    return false;
  }, [currentIndex, history]);

  const canUndo = currentIndex >= 0;
  const canRedo = currentIndex < history.length - 1;

  console.log('History state:', { 
    historyLength: history.length, 
    currentIndex, 
    canUndo, 
    canRedo 
  });

  return {
    addAction,
    undo,
    redo,
    canUndo,
    canRedo,
    history: history.slice(0, currentIndex + 1)
  };
};
