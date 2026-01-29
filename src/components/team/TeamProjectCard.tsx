import { TeamProject, TeamProjectStatus } from '@/hooks/useTeamProjects';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TeamProjectCardProps {
  project: TeamProject;
  onClick: () => void;
  taskCount?: number;
}

const STATUS_CONFIG: Record<TeamProjectStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  'planning': { label: 'Planification', variant: 'secondary' },
  'in-progress': { label: 'En cours', variant: 'default' },
  'on-hold': { label: 'En pause', variant: 'outline' },
  'completed': { label: 'Terminé', variant: 'default' },
  'archived': { label: 'Archivé', variant: 'outline' },
};

export const TeamProjectCard = ({ project, onClick, taskCount = 0 }: TeamProjectCardProps) => {
  const statusConfig = STATUS_CONFIG[project.status];
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span 
              className="text-2xl p-2 rounded-lg"
              style={{ backgroundColor: `${project.color}20` }}
            >
              {project.icon}
            </span>
            <div>
              <h3 className="font-semibold text-base">{project.name}</h3>
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {project.description}
                </p>
              )}
            </div>
          </div>
          <Badge variant={statusConfig.variant}>
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progression</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{taskCount} tâche{taskCount !== 1 ? 's' : ''}</span>
          </div>
          {project.targetDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{format(project.targetDate, 'dd MMM', { locale: fr })}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
