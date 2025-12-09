import React, { useState } from 'react';
import { Project } from '@/types/project';
import { ChevronDown, ChevronUp, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface SidebarProjectsSectionProps {
  projects: Project[];
}

export const SidebarProjectsSection: React.FC<SidebarProjectsSectionProps> = ({
  projects
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Filtrer uniquement les projets actifs (non archivés/complétés)
  const activeProjects = projects.filter(p => p.status !== 'archived' && p.status !== 'completed');

  if (activeProjects.length === 0) return null;

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
            Projets ({activeProjects.length})
          </span>
        </div>
        {isCollapsed ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        )}
      </Button>

      {!isCollapsed && (
        <div className="px-3 pb-3 space-y-2">
          {activeProjects.map(project => (
            <div
              key={project.id}
              className="p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                {project.icon && <span className="text-sm">{project.icon}</span>}
                <span className="text-sm font-medium truncate flex-1">
                  {project.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {project.progress || 0}%
                </span>
              </div>
              <Progress 
                value={project.progress || 0} 
                className="h-1.5"
                style={{
                  ['--progress-background' as any]: project.color || 'hsl(var(--project))'
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
