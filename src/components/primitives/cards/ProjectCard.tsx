import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, ChevronRight } from 'lucide-react';
import { Project, PROJECT_STATUS_CONFIG } from '@/types/project';
import { formatDate } from '@/lib/formatters';

export interface ProjectCardProps {
  project: Project;
  progress?: number;
  variant?: 'default' | 'compact' | 'minimal';
  showDescription?: boolean;
  showProgress?: boolean;
  showDate?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * ProjectCard - Carte projet réutilisable avec variantes
 * 
 * @example
 * <ProjectCard
 *   project={project}
 *   progress={75}
 *   variant="compact"
 *   onClick={() => handleClick(project.id)}
 * />
 */
export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  progress,
  variant = 'default',
  showDescription = true,
  showProgress = true,
  showDate = true,
  onClick,
  className,
}) => {
  const statusConfig = PROJECT_STATUS_CONFIG[project.status];
  const displayProgress = progress ?? project.progress ?? 0;

  if (variant === 'minimal') {
    return (
      <div
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors",
          onClick && "cursor-pointer",
          className
        )}
        style={{ borderLeftColor: project.color, borderLeftWidth: '3px' }}
      >
        <span className="text-xl flex-shrink-0">{project.icon || '📚'}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{project.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Progress value={displayProgress} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground">{displayProgress}%</span>
          </div>
        </div>
        {onClick && <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card
        onClick={onClick}
        className={cn(
          "transition-all hover:shadow-md",
          onClick && "cursor-pointer",
          className
        )}
        style={{ borderLeftColor: project.color, borderLeftWidth: '4px' }}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl flex-shrink-0">{project.icon || '📚'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-foreground truncate">{project.name}</h3>
                <Badge className={cn("text-xs flex-shrink-0", statusConfig.bgColor, statusConfig.color)}>
                  {statusConfig.label}
                </Badge>
              </div>
              {showProgress && (
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={displayProgress} className="h-2 flex-1" />
                  <span className="text-sm font-medium text-muted-foreground">{displayProgress}%</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card
      onClick={onClick}
      className={cn(
        "transition-all hover:shadow-lg",
        onClick && "cursor-pointer",
        className
      )}
      style={{ borderLeftColor: project.color, borderLeftWidth: '4px' }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-2xl flex-shrink-0">{project.icon || '📚'}</span>
            <CardTitle className="text-lg truncate">{project.name}</CardTitle>
          </div>
          <Badge className={cn("flex-shrink-0", statusConfig.bgColor, statusConfig.color)}>
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {showDescription && project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>
        )}

        {showProgress && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{displayProgress}%</span>
            </div>
            <Progress value={displayProgress} className="h-2" />
          </div>
        )}

        {showDate && project.targetDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              {formatDate(project.targetDate, 'd MMMM yyyy')}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
