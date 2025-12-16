import { useState } from 'react';
import { Project, PROJECT_STATUS_CONFIG } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar } from 'lucide-react';
import { useDragDrop } from '@/contexts/DragDropContext';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export const ProjectCard = ({ project, onClick }: ProjectCardProps) => {
  const statusConfig = PROJECT_STATUS_CONFIG[project.status];
  const { draggedTask, onAssignToProject } = useDragDrop();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    if (draggedTask) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    if (draggedTask) {
      e.preventDefault();
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (draggedTask && onAssignToProject) {
      await onAssignToProject(draggedTask.id, project.id);
    }
  };
  
  return (
    <Card 
      className={`cursor-pointer hover:shadow-lg transition-all ${
        isDragOver ? 'ring-2 ring-primary scale-105 shadow-xl bg-accent' : ''
      }`}
      onClick={onClick}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ borderLeftColor: project.color, borderLeftWidth: '4px' }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-2xl">{project.icon || '📚'}</span>
            <CardTitle className="text-lg">{project.name}</CardTitle>
          </div>
          <Badge className={statusConfig.bgColor + ' ' + statusConfig.color}>
            {statusConfig.label}
          </Badge>
        </div>
        {isDragOver && draggedTask && (
          <div className="text-xs text-primary font-medium mt-2 animate-pulse">
            Déposer "{draggedTask.name}" dans ce projet
          </div>
        )}
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
        
        {project.targetDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
      </CardContent>
    </Card>
  );
};
