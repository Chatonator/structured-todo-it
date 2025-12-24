import React, { useState } from 'react';
import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Briefcase, FolderPlus } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useToast } from '@/hooks/use-toast';
import { useContextTransform } from '@/hooks/useContextTransform';
import { useAuth } from '@/hooks/useAuth';
import { taskToItem } from '@/adapters/itemAdapters';
import { ContextTransformModal } from '@/components/items/ContextTransformModal';

interface TaskProjectMenuProps {
  task: Task;
  onAssignToProject: (taskId: string, projectId: string) => Promise<boolean>;
}

const TaskProjectMenu: React.FC<TaskProjectMenuProps> = ({
  task,
  onAssignToProject
}) => {
  const { activeProjects } = useProjects();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const projects = activeProjects();

  // Hook de transformation de contexte - gère tout le processus
  const {
    isModalOpen,
    currentItem,
    targetContext,
    missingFields,
    currentMetadata,
    initiateTransform,
    confirmTransform,
    closeModal
  } = useContextTransform({
    onTransformComplete: (transformedItem) => {
      toast({
        title: "Transformation réussie",
        description: `"${task.name}" a été transformé en projet`,
      });
      // Le nouveau système gère la transformation via useItems
    },
    onError: (error) => {
      toast({
        title: "Erreur de transformation",
        description: error,
        variant: "destructive"
      });
    }
  });

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

  const handleTransformToProject = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!user) return;
    
    // Convertir la tâche en Item et initier la transformation via le nouveau système
    const item = taskToItem(task, user.id);
    initiateTransform(item, 'project');
    setIsOpen(false);
  };

  // Don't show if task is already in a project
  if (task.projectId) {
    return null;
  }

  return (
    <>
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
          
          {/* Option to transform task to new project */}
          <DropdownMenuItem onClick={handleTransformToProject}>
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

      {/* Modale de transformation de contexte */}
      {isModalOpen && currentItem && targetContext && (
        <ContextTransformModal
          isOpen={isModalOpen}
          onClose={closeModal}
          itemName={currentItem.name}
          fromContext={currentItem.contextType}
          toContext={targetContext}
          missingFields={missingFields}
          currentMetadata={currentMetadata}
          onConfirm={confirmTransform}
        />
      )}
    </>
  );
};

export default TaskProjectMenu;
