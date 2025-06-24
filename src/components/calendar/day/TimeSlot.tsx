
import React from 'react';

interface TimeSlotProps {
  hour: number;
  isDropZone: boolean;
  onSlotClick: (hour: number) => void;
  onDragOver: (e: React.DragEvent, hour: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, hour: number) => void;
}

export const TimeSlot: React.FC<TimeSlotProps> = ({
  hour,
  isDropZone,
  onSlotClick,
  onDragOver,
  onDragLeave,
  onDrop
}) => {
  return (
    <div
      className={`
        h-20 border-b border-theme-border cursor-pointer transition-all duration-200 relative
        ${isDropZone 
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 shadow-inner' 
          : 'hover:bg-theme-accent hover:shadow-sm'
        }
      `}
      onClick={() => onSlotClick(hour)}
      onDragOver={(e) => onDragOver(e, hour)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, hour)}
    >
      {/* Indicateur de drop zone amélioré */}
      {isDropZone && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg animate-pulse flex items-center gap-2">
            <span className="text-lg">📅</span>
            <span>Planifier ici</span>
          </div>
        </div>
      )}
      
      {/* Ligne de demi-heure */}
      <div className="absolute inset-x-0 top-10 h-px bg-theme-border opacity-30" />
    </div>
  );
};
