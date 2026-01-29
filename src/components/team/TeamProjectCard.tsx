import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, ListTodo } from 'lucide-react';
import { TeamProject, TeamProjectStatus } from '@/hooks/useTeamProjects';

// Réutilise la même config de statut que les projets personnels
const STATUS_CONFIG: Record<TeamProjectStatus, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  'planning': {
    label: 'Planification',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  'in-progress': {
    label: 'En cours',
    color: 'text-project',
    bgColor: 'bg-project/10'
  },
  'on-hold': {
    label: 'En pause',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  'completed': {
    label: 'Terminé',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  'archived': {
    label: 'Archivé',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted'
  }
};

interface TeamProjectCardProps {
  project: TeamProject;
  onClick: () => void;
  taskCount?: number;
}

export const TeamProjectCard = ({ project, onClick, taskCount = 0 }: TeamProjectCardProps) => {
  const statusConfig = STATUS_CONFIG[project.status];
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all"
      onClick={onClick}
      style={{ borderLeftColor: project.color, borderLeftWidth: '4px' }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-2xl">{project.icon || '📁'}</span>
            <CardTitle className="text-lg">{project.name}</CardTitle>
          </div>
          <Badge className={statusConfig.bgColor + ' ' + statusConfig.color}>
            {statusConfig.label}
          </Badge>
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
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <ListTodo className="w-4 h-4" />
            <span>{taskCount} tâches</span>
          </div>
          
          {project.targetDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {project.targetDate.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short'
                })}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};