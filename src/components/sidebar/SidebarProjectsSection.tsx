import React, { useState } from 'react';
import { Task } from '@/types/task';
import { ChevronDown, ChevronUp, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SidebarListItem } from './SidebarListItem';

interface ProjectTaskForSidebar {
  task: Task;
  projectName: string;
  projectIcon?: string;
  projectColor?: string;
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
  
  // Filter only non-completed tasks (todo + in-progress)
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
        <div className="px-1 pb-2">
          {activeTasks.map(({ task, projectName, projectIcon, projectColor }) => (
            <SidebarListItem
              key={task.id}
              name={task.name}
              accentColor={projectColor || 'hsl(var(--project))'}
              isCompleted={task.isCompleted}
              onToggleComplete={() => onToggleComplete(task.id)}
              showCheckbox
              estimatedTime={task.estimatedTime}
              rightSlot={
                <Badge 
                  variant="outline" 
                  className="text-xs text-project border-project/30"
                  style={{ 
                    color: projectColor || undefined,
                    borderColor: projectColor ? `${projectColor}40` : undefined
                  }}
                >
                  {projectIcon && <span className="mr-1">{projectIcon}</span>}
                  {projectName}
                </Badge>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};
