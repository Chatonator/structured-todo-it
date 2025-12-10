import React, { useState } from 'react';
import { Task } from '@/types/task';
import { ChevronDown, ChevronUp, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface ProjectTaskForSidebar {
  task: Task;
  projectName: string;
  projectIcon?: string;
}

interface SidebarProjectsSectionProps {
  projectTasks: ProjectTaskForSidebar[];
  onToggleComplete: (taskId: string) => void;
}

export const SidebarProjectsSection: React.FC<SidebarProjectsSectionProps> = ({
  projectTasks,
  onToggleComplete
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Filtrer uniquement les tâches non complétées (todo + in-progress)
  const activeTasks = projectTasks.filter(pt => !pt.task.isCompleted);

  if (activeTasks.length === 0) return null;

  return (
    <div className="border-b border-border">
      <Button
        variant="ghost"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full justify-between px-3 py-2 h-auto"
      >
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-project" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Tâches Projets ({activeTasks.length})
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
          {activeTasks.map(({ task, projectName, projectIcon }) => (
            <div
              key={task.id}
              className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors border-l-4 border-l-project"
            >
              <Checkbox
                checked={task.isCompleted}
                onCheckedChange={() => onToggleComplete(task.id)}
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm truncate block">
                  {task.name}
                </span>
                <Badge variant="outline" className="text-xs mt-0.5 text-project border-project/30">
                  {projectIcon && <span className="mr-1">{projectIcon}</span>}
                  {projectName}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {task.estimatedTime}min
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
