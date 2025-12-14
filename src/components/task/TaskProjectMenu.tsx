import React, { useState } from 'react';
import { Task } from '@/types/task';
import { Project } from '@/types/project';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Briefcase, Plus, FolderPlus } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useToast } from '@/hooks/use-toast';

interface TaskProjectMenuProps {
  task: Task;
  onAssignToProject: (taskId: string, projectId: string) => Promise<boolean>;
  onConvertToProject: (task: Task) => void;
}

const TaskProjectMenu: React.FC<TaskProjectMenuProps> = ({
  task,
  onAssignToProject,
  onConvertToProject
}) => {
  const { activeProjects } = useProjects();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const projects = activeProjects();

  // Empêcher la propagation pour éviter les re-renders du parent
  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const handleAssignToProject = async (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.stopPropagation();
    e.preventDefault();
    const success = await onAssignToProject(task.id, projectId);
    if (success) {
      toast({
        title: "Tâche ajoutée au projet",
        description: `"${task.name}" a été ajoutée à "${projectName}"`,
      });
    }
    setIsOpen(false);
  };

  const handleConvertToProject = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onConvertToProject(task);
    setIsOpen(false);
  };

  // Don't show if task is already in a project
  if (task.projectId) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DropdownMenuTrigger asChild onClick={handleTriggerClick}>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          title="Ajouter à un projet"
        >
          <Briefcase className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel>Ajouter à un projet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Option to convert task to new project */}
        <DropdownMenuItem onClick={handleConvertToProject}>
          <FolderPlus className="w-4 h-4 mr-2 text-primary" />
          <span className="font-medium">Transformer en projet</span>
        </DropdownMenuItem>
        
        {projects.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Projets existants
            </DropdownMenuLabel>
            {projects.map((project) => (
              <DropdownMenuItem 
                key={project.id}
                onClick={(e) => handleAssignToProject(e, project.id, project.name)}
              >
                <span className="mr-2">{project.icon || '📚'}</span>
                <span className="truncate">{project.name}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}
        
        {projects.length === 0 && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            Aucun projet actif
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TaskProjectMenu;
