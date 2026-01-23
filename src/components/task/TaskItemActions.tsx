import React, { useState } from 'react';
import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Divide, CheckSquare, X, Edit, Briefcase, FolderPlus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProjects } from '@/hooks/useProjects';
import { useToast } from '@/hooks/use-toast';

interface TaskItemActionsProps {
  task: Task;
  subTasks?: Task[];
  canHaveSubTasks: boolean;
  isVisible: boolean;
  onCreateSubTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onToggleCompletion: (taskId: string) => void;
  onRemoveTask: (taskId: string) => void;
  onAssignToProject?: (taskId: string, projectId: string) => Promise<boolean>;
}

const TaskItemActions: React.FC<TaskItemActionsProps> = ({
  task,
  subTasks = [],
  canHaveSubTasks,
  isVisible,
  onCreateSubTask,
  onEditTask,
  onToggleCompletion,
  onRemoveTask,
  onAssignToProject
}) => {
  const { activeProjects, createProjectFromTask } = useProjects();
  const { toast } = useToast();
  const projects = activeProjects();
  
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [projectName, setProjectName] = useState(task.name);
  const [projectDescription, setProjectDescription] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  const handleAssignToProject = async (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!onAssignToProject) return;
    
    const success = await onAssignToProject(task.id, projectId);
    if (success) {
      toast({
        title: "Tâche ajoutée au projet",
        description: `"${task.name}" a été ajoutée à "${projectName}"`,
      });
    }
  };

  const handleConvertToProject = async () => {
    if (!projectName.trim()) return;
    
    setIsConverting(true);
    try {
      // Pass full metadata from subtasks to preserve priority (subCategory)
      await createProjectFromTask(
        task.id,
        projectName,
        subTasks.map(st => ({ 
          id: st.id, 
          name: st.name,
          metadata: {
            category: st.category,
            subCategory: st.subCategory,
            context: st.context,
            estimatedTime: st.estimatedTime,
            duration: st.duration,
          }
        })),
        { description: projectDescription }
      );
      setShowConvertDialog(false);
    } finally {
      setIsConverting(false);
    }
  };

  const hasSubTasks = subTasks.length > 0;

  return (
    <>
      <div 
        className={`flex items-center gap-1 flex-shrink-0 transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        {/* Convert to project button - only for level 0 tasks with subtasks */}
        {task.level === 0 && hasSubTasks && !task.projectId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setProjectName(task.name);
              setShowConvertDialog(true);
            }}
            className="h-6 w-6 p-0 text-project hover:text-project/80"
            title="Convertir en projet"
          >
            <FolderPlus className="w-3 h-3" />
          </Button>
        )}

        {/* Menu projet - seulement pour les tâches principales sans projet */}
        {task.level === 0 && !task.projectId && onAssignToProject && projects.length > 0 && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
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
              {projects.map((project) => (
                <DropdownMenuItem 
                  key={project.id}
                  onClick={(e) => handleAssignToProject(e, project.id, project.name)}
                >
                  <span className="mr-2">{project.icon || '📚'}</span>
                  <span className="truncate">{project.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {canHaveSubTasks && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCreateSubTask(task)}
            className="h-6 w-6 p-0"
            title="Diviser"
          >
            <Divide className="w-3 h-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEditTask(task)}
          className="h-6 w-6 p-0"
          title="Modifier"
        >
          <Edit className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleCompletion(task.id)}
          className="h-6 w-6 p-0 text-system-success hover:text-system-success/80"
          title="Terminer"
        >
          <CheckSquare className="w-3 h-3" />
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onRemoveTask(task.id)}
          className="h-6 w-6 p-0"
          title="Supprimer"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      {/* Dialog for converting to project */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent className="sm:max-w-[425px]" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-project" />
              Convertir en projet
            </DialogTitle>
            <DialogDescription>
              Cette tâche et ses {subTasks.length} sous-tâche(s) seront converties en un nouveau projet.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="project-name">Nom du projet</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Nom du projet"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-description">Description (optionnel)</Label>
              <Input
                id="project-description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Description du projet"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConvertDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleConvertToProject} 
              disabled={!projectName.trim() || isConverting}
              className="bg-project hover:bg-project/90"
            >
              {isConverting ? 'Conversion...' : 'Créer le projet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskItemActions;
