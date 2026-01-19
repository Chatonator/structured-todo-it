import React, { useState } from 'react';
import { Task } from '@/types/task';
import { CheckSquare } from 'lucide-react';
import TaskModal from '@/components/task/TaskModal';
import { ViewLayout, ViewStats, ViewSection } from '@/components/layout/view';
import { TaskList } from '@/components/primitives';
import { useViewDataContext } from '@/contexts/ViewDataContext';
import { formatDuration } from '@/lib/formatters';

interface TasksViewProps {
  className?: string;
}

/**
 * Vue Tâches - Affichage aéré et visuellement agréable de toutes les tâches
 * Utilise les nouvelles primitives UI et ViewLayout enrichi
 */
const TasksView: React.FC<TasksViewProps> = ({ className }) => {
  const { tasks, mainTasks, calculateTotalTime, updateTask } = useViewDataContext();
  
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Sécurisation des données
  const safeMainTasks = Array.isArray(mainTasks) ? mainTasks : [];

  const handleEditTask = (task: Task) => {
    if (!task || typeof task !== 'object') return;
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingTask(null);
    setIsEditModalOpen(false);
  };

  // Tâches actives et terminées
  const activeTasks = safeMainTasks.filter(task => task && !task.isCompleted);
  const completedTasks = safeMainTasks.filter(task => task && task.isCompleted);

  // Calcul du temps total
  const totalEstimatedTime = activeTasks.reduce((total, task) => {
    const taskTime = calculateTotalTime ? calculateTotalTime(task) : (Number(task.estimatedTime) || 0);
    return total + taskTime;
  }, 0);

  const isEmpty = activeTasks.length === 0 && completedTasks.length === 0;

  // Stats pour ViewStats
  const stats = [
    {
      id: 'active',
      label: 'Tâches actives',
      value: activeTasks.length,
    },
    {
      id: 'completed',
      label: 'Tâches terminées',
      value: completedTasks.length,
    },
    {
      id: 'time',
      label: 'Temps total estimé',
      value: formatDuration(totalEstimatedTime),
    },
  ];

  return (
    <>
      <ViewLayout
        header={{
          title: "Toutes les tâches",
          subtitle: "Vue d'ensemble de vos tâches avec un affichage détaillé et aéré",
          icon: <CheckSquare className="w-5 h-5" />
        }}
        variant="list"
        state={isEmpty ? 'empty' : 'success'}
        emptyProps={{
          title: "Aucune tâche pour le moment",
          message: "Commencez par créer votre première tâche !",
          icon: <CheckSquare className="w-12 h-12" />
        }}
        className={className}
      >
        <div className="space-y-8">
          {/* Statistiques rapides */}
          <ViewStats stats={stats} columns={3} />

          {/* Tâches actives */}
          {activeTasks.length > 0 && (
            <ViewSection
              title={`Tâches actives (${activeTasks.length})`}
              icon={<div className="w-1 h-6 bg-primary rounded" />}
            >
              <TaskList
                tasks={activeTasks}
                variant="default"
                layout="grid"
                columns={3}
                onTaskClick={handleEditTask}
                calculateTotalTime={calculateTotalTime}
              />
            </ViewSection>
          )}

          {/* Tâches terminées */}
          {completedTasks.length > 0 && (
            <ViewSection
              title={`Tâches terminées (${completedTasks.length})`}
              icon={<div className="w-1 h-6 bg-system-success rounded" />}
            >
              <TaskList
                tasks={completedTasks}
                variant="default"
                layout="grid"
                columns={3}
                onTaskClick={handleEditTask}
                calculateTotalTime={calculateTotalTime}
              />
            </ViewSection>
          )}
        </div>
      </ViewLayout>

      {/* Modal d'édition */}
      {isEditModalOpen && (
        <TaskModal
          key={editingTask?.id}
          isOpen
          onClose={handleCloseEditModal}
          onUpdateTask={updateTask}
          editingTask={editingTask}
        />
      )}
    </>
  );
};

export default TasksView;
