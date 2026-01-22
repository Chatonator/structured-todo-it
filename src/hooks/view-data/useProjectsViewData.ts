import { useMemo } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useAllProjectTasks } from '@/hooks/useAllProjectTasks';

/**
 * Hook spécialisé pour les données des projets
 * Extrait de useViewData pour améliorer la maintenabilité
 */
export const useProjectsViewData = () => {
  const { 
    projects, 
    loading,
    createProject,
    updateProject,
    deleteProject,
    completeProject,
    activeProjects
  } = useProjects();
  
  const { 
    projectTasks, 
    toggleProjectTaskCompletion
  } = useAllProjectTasks(projects);

  // Projects that should show their tasks in the sidebar
  const sidebarProjects = useMemo(() => 
    projects.filter(p => (p as any).showInSidebar === true),
    [projects]
  );

  // Tasks from projects that should show in sidebar
  const sidebarProjectTasks = useMemo(() => 
    projectTasks.filter(pt => 
      sidebarProjects.some(p => p.id === pt.task.projectId)
    ),
    [projectTasks, sidebarProjects]
  );

  return {
    // Données
    projects,
    projectTasks,
    loading,
    
    // Sidebar-specific
    sidebarProjects,
    sidebarProjectTasks,
    
    // Actions
    createProject,
    updateProject,
    deleteProject,
    completeProject,
    toggleProjectTaskCompletion,
    
    // Utilitaires
    activeProjects
  };
};

export type ProjectsViewDataReturn = ReturnType<typeof useProjectsViewData>;
