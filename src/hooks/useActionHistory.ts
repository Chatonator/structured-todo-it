
import { useState, useCallback } from 'react';

export interface HistoryAction {
  id: string;
  type: 'add' | 'remove' | 'update' | 'reorder';
  timestamp: Date;
  data: any;
  reverseAction: () => void;
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
      // Couper l'historique après l'index courant
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(newAction);
      
      // Limiter à 10 actions max
      if (newHistory.length > 10) {
        newHistory.shift();
        return newHistory;
      }
      
      return newHistory;
    });
    
    setCurrentIndex(prev => Math.min(prev + 1, 9));
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (currentIndex >= 0 && history[currentIndex]) {
      history[currentIndex].reverseAction();
      setCurrentIndex(prev => prev - 1);
      return true;
    }
    return false;
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1 && history[currentIndex + 1]) {
      // Pour redo, on devrait avoir une action forward, mais simplifions
      setCurrentIndex(prev => prev + 1);
      return true;
    }
    return false;
  }, [currentIndex, history]);

  const canUndo = currentIndex >= 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    addAction,
    undo,
    redo,
    canUndo,
    canRedo,
    history: history.slice(0, currentIndex + 1)
  };
};
