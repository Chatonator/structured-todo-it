import React from 'react';
import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';

interface TimeSlotProps {
  hour: number;
  minute: number;
  date: Date;
  isCurrentTime?: boolean;
  onClick?: () => void;
}

export const TimeSlot: React.FC<TimeSlotProps> = ({
  hour,
  minute,
  date,
  isCurrentTime = false,
  onClick
}) => {
  const slotId = `slot-${date.toISOString().split('T')[0]}-${hour}-${minute}`;
  
  const { isOver, setNodeRef } = useDroppable({
    id: slotId,
    data: {
      type: 'time-slot',
      date,
      hour,
      minute
    }
  });

  const isHourStart = minute === 0;

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        "h-4 border-b border-border/30 transition-colors cursor-pointer",
        isHourStart && "border-b-border",
        isOver && "bg-primary/20",
        isCurrentTime && "bg-accent/30",
        !isOver && !isCurrentTime && "hover:bg-muted/50"
      )}
    />
  );
};

export default TimeSlot;
