import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Users } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

interface TeamTask {
  id: string;
  name: string;
  isCompleted: boolean;
  category: string;
  estimatedTime: number;
}

interface SidebarTeamTasksSectionProps {
  tasks: TeamTask[];
  onToggleComplete: (taskId: string) => void;
}

export const SidebarTeamTasksSection: React.FC<SidebarTeamTasksSectionProps> = ({
  tasks,
  onToggleComplete
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Filtrer uniquement les tâches non complétées
  const activeTasks = tasks.filter(t => !t.isCompleted);
  const completedCount = tasks.filter(t => t.isCompleted).length;

  if (tasks.length === 0) return null;

  return (
    <div className="border-b border-border">
      <Button
        variant="ghost"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full justify-between px-3 py-2 h-auto"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Tâches d'équipe ({activeTasks.length})
          </span>
        </div>
        {isCollapsed ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        )}
      </Button>

      {!isCollapsed && (
        <div className="px-3 pb-3 space-y-1">
          {activeTasks.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              Toutes les tâches sont terminées
            </p>
          ) : (
            activeTasks.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors border-l-4 border-l-primary"
              >
                <Checkbox
                  checked={task.isCompleted}
                  onCheckedChange={() => onToggleComplete(task.id)}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm truncate block">
                    {task.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {task.estimatedTime}min
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
