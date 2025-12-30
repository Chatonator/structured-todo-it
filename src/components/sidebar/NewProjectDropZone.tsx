import React from 'react';
import { FolderPlus } from 'lucide-react';

interface NewProjectDropZoneProps {
  isDragOver: boolean;
  hasActiveDrag: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

/**
 * Zone de drop pour créer un nouveau projet à partir d'une tâche
 */
const NewProjectDropZone: React.FC<NewProjectDropZoneProps> = ({
  isDragOver,
  hasActiveDrag,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop
}) => {
  return (
    <div
      className={`
        mx-3 my-2 border-2 border-dashed rounded-lg p-3 flex items-center justify-center gap-2
        transition-all duration-200 min-h-[60px]
        ${isDragOver 
          ? 'border-primary bg-primary/10 scale-105' 
          : hasActiveDrag 
            ? 'border-primary/50 bg-accent/50' 
            : 'border-border bg-card/50'
        }
      `}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <FolderPlus className={`w-5 h-5 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
      <span className={`text-xs ${isDragOver ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
        {isDragOver ? 'Relâcher pour créer' : hasActiveDrag ? 'Déposer ici' : 'Glisser une tâche ici'}
      </span>
    </div>
  );
};

export default NewProjectDropZone;
