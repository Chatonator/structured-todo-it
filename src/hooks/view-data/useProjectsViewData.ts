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

  return {
    // Données
    projects,
    projectTasks,
    loading,
    
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
