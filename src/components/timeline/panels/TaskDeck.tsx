import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Task } from '@/types/task';
import { TaskDeckItem } from './TaskDeckItem';
import { formatDuration } from '@/lib/formatters';

export interface TaskDeckData {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  tasks: Task[];
  totalTime: number;
}

interface TaskDeckProps {
  deck: TaskDeckData;
  onTaskClick?: (task: Task) => void;
  defaultOpen?: boolean;
}

/**
 * Un deck collapsible de tâches
 * Affiche un groupe de tâches avec header résumé
 */
export const TaskDeck: React.FC<TaskDeckProps> = ({
  deck,
  onTaskClick,
  defaultOpen = true
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (deck.tasks.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "w-full flex items-center gap-2 p-2.5 rounded-lg transition-colors",
            "hover:bg-accent/50 text-left",
            deck.color
          )}
        >
          {/* Expand/collapse icon */}
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          )}

          {/* Deck icon */}
          <span className="shrink-0">{deck.icon}</span>

          {/* Deck name */}
          <span className="flex-1 font-medium text-sm truncate">
            {deck.name}
          </span>

          {/* Task count */}
          <span className="text-xs bg-muted/60 px-1.5 py-0.5 rounded-full text-muted-foreground">
            {deck.tasks.length}
          </span>

          {/* Total time */}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {formatDuration(deck.totalTime)}
          </span>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="pl-4 pr-1 pb-2 space-y-1.5 mt-1">
          {deck.tasks.map(task => (
            <TaskDeckItem
              key={task.id}
              task={task}
              onClick={() => onTaskClick?.(task)}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default TaskDeck;
