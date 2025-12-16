import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Task } from '@/types/task';

interface DraggedTask {
  id: string;
  name: string;
  level: number;
}

interface DragDropContextType {
  draggedTask: DraggedTask | null;
  setDraggedTask: (task: DraggedTask | null) => void;
  onAssignToProject: ((taskId: string, projectId: string) => Promise<boolean>) | null;
  onConvertToProject: ((task: { id: string; name: string; level: number }) => void) | null;
  registerHandlers: (
    assignHandler: (taskId: string, projectId: string) => Promise<boolean>,
    convertHandler: (task: { id: string; name: string; level: number }) => void
  ) => void;
}

const DragDropContext = createContext<DragDropContextType | undefined>(undefined);

export const DragDropProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [draggedTask, setDraggedTask] = useState<DraggedTask | null>(null);
  const [assignHandler, setAssignHandler] = useState<((taskId: string, projectId: string) => Promise<boolean>) | null>(null);
  const [convertHandler, setConvertHandler] = useState<((task: { id: string; name: string; level: number }) => void) | null>(null);

  const registerHandlers = useCallback((
    assign: (taskId: string, projectId: string) => Promise<boolean>,
    convert: (task: { id: string; name: string; level: number }) => void
  ) => {
    setAssignHandler(() => assign);
    setConvertHandler(() => convert);
  }, []);

  return (
    <DragDropContext.Provider 
      value={{ 
        draggedTask, 
        setDraggedTask,
        onAssignToProject: assignHandler,
        onConvertToProject: convertHandler,
        registerHandlers
      }}
    >
      {children}
    </DragDropContext.Provider>
  );
};

export const useDragDrop = () => {
  const context = useContext(DragDropContext);
  if (context === undefined) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
};
