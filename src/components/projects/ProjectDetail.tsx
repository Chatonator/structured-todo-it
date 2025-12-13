import { useState } from 'react';
import { Project, PROJECT_STATUS_CONFIG } from '@/types/project';
import { useProjectTasks } from '@/hooks/useProjectTasks';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { KanbanBoard } from './KanbanBoard';
import TaskModal from '@/components/TaskModal';
import { ArrowLeft, Edit, Plus, Calendar, Target, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Task } from '@/types/task';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  onEdit: () => void;
  onDelete?: () => void;
}

export const ProjectDetail = ({ project, onBack, onEdit, onDelete }: ProjectDetailProps) => {
  const { tasksByStatus, updateTaskStatus, reloadTasks } = useProjectTasks(project.id);
  const { toggleTaskCompletion, addTask, updateTask } = useTasks();
  const { deleteProject } = useProjects();
  const { toast } = useToast();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const statusConfig = PROJECT_STATUS_CONFIG[project.status];

  const handleDelete = async () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.name}" ? Cette action est irréversible.`)) {
      const success = await deleteProject(project.id);
      if (success && onDelete) {
        onDelete();
      }
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleToggleComplete = async (taskId: string) => {
    await toggleTaskCompletion(taskId);
    reloadTasks();
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setShowTaskModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{project.icon || '📚'}</span>
              <div>
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <Badge className={`${statusConfig.bgColor} ${statusConfig.color} mt-1`}>
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
            
            {project.description && (
              <p className="text-muted-foreground max-w-2xl">
                {project.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
          <Button onClick={handleCreateTask}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle tâche
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Progression</p>
              <p className="text-2xl font-bold">{project.progress}%</p>
            </div>
            <Target className="w-8 h-8 text-project" />
          </div>
          <Progress value={project.progress} className="mt-2" />
        </div>

        {project.targetDate && (
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Date cible</p>
                <p className="text-lg font-semibold">
                  {new Date(project.targetDate).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long'
                  })}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        )}

        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tâches totales</p>
              <p className="text-2xl font-bold">
                {tasksByStatus().todo.length + tasksByStatus().inProgress.length + tasksByStatus().done.length}
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              {tasksByStatus().done.length} terminées
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Tableau Kanban</h2>
        <KanbanBoard
          tasks={tasksByStatus()}
          onStatusChange={updateTaskStatus}
          onTaskClick={handleTaskClick}
          onToggleComplete={handleToggleComplete}
        />
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          isOpen={showTaskModal}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
            reloadTasks();
          }}
          editingTask={selectedTask || undefined}
          projectId={project.id}
          taskType="project"
          onAddTask={async (taskData) => {
            await addTask(taskData);
            reloadTasks();
          }}
          onUpdateTask={async (taskId, updates) => {
            await updateTask(taskId, updates);
            reloadTasks();
          }}
        />
      )}
    </div>
  );
};
