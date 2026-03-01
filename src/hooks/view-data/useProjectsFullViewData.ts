import { useState, useMemo, useCallback } from 'react';
import { useUnifiedProjects } from '@/hooks/useUnifiedProjects';
import { useTeamContext } from '@/contexts/TeamContext';
import { UnifiedProject } from '@/types/teamProject';
import type { ViewState } from '@/components/layout/view/ViewLayout';

/**
 * Hook complet pour la vue Projets
 * Suit le pattern { data, state, actions }
 */
export const useProjectsFullViewData = () => {
  const {
    projects, loading, isTeamMode, teamName, teamId,
    createProject, updateProject, deleteProject,
    getActiveProjects, getCompletedProjects, getArchivedProjects
  } = useUnifiedProjects();

  const { teamMembers } = useTeamContext();

  const [showModal, setShowModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [detailProjectId, setDetailProjectId] = useState<string | null>(null);

  const selectedProject = useMemo(() =>
    selectedProjectId ? projects.find(p => p.id === selectedProjectId) ?? null : null,
    [projects, selectedProjectId]
  );

  const detailProject = useMemo(() =>
    detailProjectId ? projects.find(p => p.id === detailProjectId) ?? null : null,
    [projects, detailProjectId]
  );

  const activeProjects = getActiveProjects();
  const completedProjects = getCompletedProjects();
  const archivedProjects = getArchivedProjects();

  const viewState: ViewState = loading ? 'loading' : projects.length === 0 ? 'empty' : 'success';

  const viewTitle = isTeamMode ? `Projets de ${teamName}` : "Projets";
  const viewSubtitle = isTeamMode
    ? "Gérez les projets de votre équipe"
    : "Gérez vos projets complexes avec des tâches organisées";

  const handleCreateProject = useCallback(async (data: any) => {
    await createProject(data.name, data.description, data.icon, data.color);
    setShowModal(false);
  }, [createProject]);

  const handleUpdateProject = useCallback(async (data: any) => {
    if (selectedProject) {
      await updateProject(selectedProject.id, data);
      setShowModal(false);
      setSelectedProjectId(null);
    }
  }, [selectedProject, updateProject]);

  const handleCardClick = useCallback((project: UnifiedProject) => {
    setDetailProjectId(project.id);
  }, []);

  const handleEditFromDetail = useCallback(() => {
    if (detailProject) {
      setSelectedProjectId(detailProject.id);
      setShowModal(true);
    }
  }, [detailProject]);

  const handleDeleteProject = useCallback(async () => {
    if (detailProject) {
      await deleteProject(detailProject.id);
      setDetailProjectId(null);
    }
  }, [detailProject, deleteProject]);

  const handleModalClose = useCallback(() => {
    setShowModal(false);
    setSelectedProjectId(null);
  }, []);

  const handleBack = useCallback(() => {
    setDetailProjectId(null);
  }, []);

  return {
    data: {
      projects,
      activeProjects,
      completedProjects,
      archivedProjects,
      selectedProject,
      detailProject,
      teamMembers,
      teamId,
      viewTitle,
      viewSubtitle,
    },
    state: {
      viewState,
      loading,
      isTeamMode,
      showModal,
    },
    actions: {
      setShowModal,
      handleCreateProject,
      handleUpdateProject,
      handleCardClick,
      handleEditFromDetail,
      handleDeleteProject,
      handleModalClose,
      handleBack,
    },
  };
};

export type ProjectsFullViewDataReturn = ReturnType<typeof useProjectsFullViewData>;
