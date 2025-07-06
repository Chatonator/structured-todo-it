import React, { useState, useCallback } from 'react';
import { Task } from '@/types/task';
import { useTasks } from '@/hooks/useTasks';
import TasksView from '@/components/TasksView';
import TaskModal from '@/components/TaskModal';
import AppHeader from '@/components/layout/AppHeader';
import CalendarView from '@/components/CalendarView';

const Index = () => {
  const {
    tasks,
    mainTasks,
    pinnedTasks,
    addTask,
    removeTask,
    reorderTasks,
    sortTasks,
    toggleTaskExpansion,
    toggleTaskCompletion,
    togglePinTask,
    getSubTasks,
    calculateTotalTime,
    canHaveSubTasks,
    tasksCount,
    totalProjectTime,
    completedTasks,
    completionRate,
    undo,
    redo,
    canUndo,
    canRedo,
    scheduleTask,
    unscheduleTask,
    updateTaskDuration,
    restoreTask,
    scheduleTaskWithTime,
    updateTask,
    backups,
    saveBackup,
    loadBackup,
    deleteBackup,
    exportToCSV,
    importFromCSV,
    setTasks,
    setPinnedTasks
  } = useTasks();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParentTask, setSelectedParentTask] = useState<Task | undefined>(undefined);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isCalendarView, setIsCalendarView] = useState(false);

  const handleLoadTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    setPinnedTasks([]);
  };

  const handleTaskSelect = useCallback((taskId: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  }, []);

  const isTaskSelected = useCallback((taskId: string) => {
    return selectedTasks.includes(taskId);
  }, [selectedTasks]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        tasksCount={tasksCount}
        completedTasks={completedTasks}
        completionRate={completionRate}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onOpenModal={() => {
          setSelectedParentTask(undefined);
          setEditingTask(undefined);
          setIsModalOpen(true);
        }}
        onExportCSV={exportToCSV}
        onImportCSV={importFromCSV}
        onLoadTasks={handleLoadTasks}
      />

      <main className="container py-6">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsCalendarView(!isCalendarView)}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-md text-sm"
          >
            {isCalendarView ? 'Afficher les tâches' : 'Afficher le calendrier'}
          </button>
        </div>

        {isCalendarView ? (
          <CalendarView tasks={tasks} />
        ) : (
          <TasksView
            tasks={tasks}
            mainTasks={mainTasks}
            pinnedTasks={pinnedTasks}
            toggleTaskExpansion={toggleTaskExpansion}
            toggleTaskCompletion={toggleTaskCompletion}
            togglePinTask={togglePinTask}
            removeTask={removeTask}
            reorderTasks={reorderTasks}
            sortTasks={sortTasks}
            getSubTasks={getSubTasks}
            calculateTotalTime={calculateTotalTime}
            canHaveSubTasks={canHaveSubTasks}
            onOpenModal={(task) => {
              setSelectedParentTask(task);
              setEditingTask(undefined);
              setIsModalOpen(true);
            }}
            onEditTask={(task) => {
              setSelectedParentTask(undefined);
              setEditingTask(task);
              setIsModalOpen(true);
            }}
            selectedTasks={selectedTasks}
            onTaskSelect={handleTaskSelect}
            isTaskSelected={isTaskSelected}
            restoreTask={restoreTask}
            scheduleTask={scheduleTask}
            unscheduleTask={unscheduleTask}
            updateTaskDuration={updateTaskDuration}
          />
        )}
      </main>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTask={(task) => {
          addTask(task);
        }}
        onUpdateTask={updateTask}
        parentTask={selectedParentTask}
        editingTask={editingTask}
      />
    </div>
  );
};

export default Index;
