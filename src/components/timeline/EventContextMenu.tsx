import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  CheckCircle, 
  Calendar, 
  Pencil, 
  Trash2, 
  CalendarX,
  Clock,
  MoreVertical
} from 'lucide-react';
import { TimeEvent } from '@/lib/time/types';

interface EventContextMenuProps {
  event: TimeEvent;
  children: React.ReactNode;
  onComplete?: () => void;
  onUnschedule?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReschedule?: () => void;
}

export const EventContextMenu: React.FC<EventContextMenuProps> = ({
  event,
  children,
  onComplete,
  onUnschedule,
  onEdit,
  onDelete,
  onReschedule
}) => {
  const isCompleted = event.status === 'completed';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {!isCompleted && onComplete && (
          <DropdownMenuItem onClick={onComplete}>
            <CheckCircle className="w-4 h-4 mr-2 text-system-success" />
            Marquer terminé
          </DropdownMenuItem>
        )}
        
        {isCompleted && onComplete && (
          <DropdownMenuItem onClick={onComplete}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Marquer non terminé
          </DropdownMenuItem>
        )}

        {onReschedule && (
          <DropdownMenuItem onClick={onReschedule}>
            <Clock className="w-4 h-4 mr-2" />
            Replanifier
          </DropdownMenuItem>
        )}

        {onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="w-4 h-4 mr-2" />
            Modifier
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {onUnschedule && (
          <DropdownMenuItem onClick={onUnschedule} className="text-orange-500">
            <CalendarX className="w-4 h-4 mr-2" />
            Dé-planifier
          </DropdownMenuItem>
        )}

        {onDelete && (
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EventContextMenu;
