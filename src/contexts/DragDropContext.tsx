import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

interface DraggedTask {
  id: string;
  name: string;
  level: number;
}

interface DragDropContextType {
  draggedTask: DraggedTask | null;
  setDraggedTask: (task: DraggedTask | null) => void;
  onAssignToProject: (taskId: string, projectId: string) => Promise<boolean>;
  onConvertToProject: (task: { id: string; name: string; level: number }) => void;
  registerHandlers: (
    assignHandler: (taskId: string, projectId: string) => Promise<boolean>,
    convertHandler: (task: { id: string; name: string; level: number }) => void
  ) => void;
}

const DragDropContext = createContext<DragDropContextType | undefined>(undefined);

export const DragDropProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [draggedTask, setDraggedTask] = useState<DraggedTask | null>(null);
  
  // Utiliser des refs pour toujours avoir les dernières versions des handlers
  const assignHandlerRef = useRef<((taskId: string, projectId: string) => Promise<boolean>) | null>(null);
  const convertHandlerRef = useRef<((task: { id: string; name: string; level: number }) => void) | null>(null);

  const registerHandlers = useCallback((
    assign: (taskId: string, projectId: string) => Promise<boolean>,
    convert: (task: { id: string; name: string; level: number }) => void
  ) => {
    assignHandlerRef.current = assign;
    convertHandlerRef.current = convert;
  }, []);

  // Wrappers stables qui utilisent les refs
  const onAssignToProject = useCallback(async (taskId: string, projectId: string): Promise<boolean> => {
    if (assignHandlerRef.current) {
      return await assignHandlerRef.current(taskId, projectId);
    }
    console.warn('Assign handler not registered');
    return false;
  }, []);

  const onConvertToProject = useCallback((task: { id: string; name: string; level: number }) => {
    if (convertHandlerRef.current) {
      convertHandlerRef.current(task);
    } else {
      console.warn('Convert handler not registered');
    }
  }, []);

  return (
    <DragDropContext.Provider 
      value={{ 
        draggedTask, 
        setDraggedTask,
        onAssignToProject,
        onConvertToProject,
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
