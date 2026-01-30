import { Project, PROJECT_STATUS_CONFIG, ProjectStatus } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Users } from 'lucide-react';
import { useProjectProgress } from '@/hooks/useProjectProgress';
import { UnifiedProject, isTeamProject } from '@/types/teamProject';

interface ProjectCardProps {
  // Accepte Project, TeamProject (via UnifiedProject), ou UnifiedProject directement
  project: Project | UnifiedProject;
  onClick: () => void;
  // Pour les projets d'équipe, on peut passer le nombre de tâches explicitement
  taskCount?: number;
  // Pour les projets d'équipe, on peut passer la progression calculée
  overrideProgress?: number;
}

export const ProjectCard = ({ 
  project, 
  onClick, 
  taskCount,
  overrideProgress 
}: ProjectCardProps) => {
  const statusConfig = PROJECT_STATUS_CONFIG[project.status as ProjectStatus] || PROJECT_STATUS_CONFIG['planning'];
  
  // Pour les projets personnels, utiliser le hook de progression dynamique
  // Pour les équipes, utiliser overrideProgress ou project.progress
  const isTeam = isTeamProject(project as UnifiedProject);
  const dynamicProgress = useProjectProgress(isTeam ? null : project.id);
  const displayProgress = overrideProgress ?? (isTeam ? project.progress : dynamicProgress);
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all"
      onClick={onClick}
      style={{ borderLeftColor: project.color, borderLeftWidth: '4px' }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-2xl">{project.icon || '📚'}</span>
            <CardTitle className="text-lg">{project.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isTeam && (
              <Badge variant="outline" className="text-xs gap-1">
                <Users className="w-3 h-3" />
                Équipe
              </Badge>
            )}
            <Badge className={statusConfig.bgColor + ' ' + statusConfig.color}>
              {statusConfig.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>
        )}
        
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progression</span>
            <span className="font-medium">{displayProgress}%</span>
          </div>
          <Progress value={displayProgress} className="h-2" />
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          {project.targetDate && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(project.targetDate).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
          )}
          
          {taskCount !== undefined && (
            <span>{taskCount} tâches</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};