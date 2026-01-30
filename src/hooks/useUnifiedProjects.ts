/**
 * useUnifiedProjects - Hook unifié pour projets personnels et d'équipe
 * 
 * Ce hook combine useProjects et useTeamProjects en fonction du contexte actif.
 * - Si currentTeam est défini → utilise useTeamProjects
 * - Sinon → utilise useProjects (projets personnels)
 * 
 * Retourne une interface commune UnifiedProject[]
 */

import { useCallback, useMemo } from 'react';
import { useProjects, ProjectWithKanban } from './useProjects';
import { useTeamProjects, TeamProject } from './useTeamProjects';
import { useTeamContext } from '@/contexts/TeamContext';
import { 
  UnifiedProject, 
  projectToUnified, 
  teamProjectToUnified,
  isTeamProject 
} from '@/types/teamProject';
import { ProjectStatus } from '@/types/project';

export interface UnifiedProjectsResult {
  // Données
  projects: UnifiedProject[];
  loading: boolean;
  
  // Mode
  isTeamMode: boolean;
  teamId: string | null;
  teamName: string | null;
  
  // Actions CRUD
  createProject: (
    name: string,
    description?: string,
    icon?: string,
    color?: string
  ) => Promise<UnifiedProject | null>;
  
  updateProject: (
    projectId: string,
    updates: Partial<Omit<UnifiedProject, 'id' | 'createdAt' | 'teamId' | 'userId'>>
  ) => Promise<boolean>;
  
  deleteProject: (projectId: string) => Promise<boolean>;
  
  completeProject: (projectId: string) => Promise<boolean>;
  
  // Helpers
  getActiveProjects: () => UnifiedProject[];
  getCompletedProjects: () => UnifiedProject[];
  getArchivedProjects: () => UnifiedProject[];
  
  // Reload
  reload: () => void;
}

export const useUnifiedProjects = (): UnifiedProjectsResult => {
  const { currentTeam } = useTeamContext();
  const teamId = currentTeam?.id ?? null;
  
  // Hooks des deux sources
  const personalProjects = useProjects();
  const teamProjects = useTeamProjects(teamId);
  
  const isTeamMode = !!teamId;

  // Projets unifiés
  const projects = useMemo<UnifiedProject[]>(() => {
    if (isTeamMode) {
      return teamProjects.projects.map(teamProjectToUnified);
    }
    return personalProjects.projects.map(projectToUnified);
  }, [isTeamMode, personalProjects.projects, teamProjects.projects]);

  const loading = isTeamMode ? teamProjects.loading : personalProjects.loading;

  // Création de projet
  const createProject = useCallback(async (
    name: string,
    description?: string,
    icon?: string,
    color?: string
  ): Promise<UnifiedProject | null> => {
    if (isTeamMode) {
      const project = await teamProjects.createProject(name, description, icon, color);
      return project ? teamProjectToUnified(project) : null;
    } else {
      const project = await personalProjects.createProject(name, description, icon, color);
      return project ? projectToUnified(project as ProjectWithKanban) : null;
    }
  }, [isTeamMode, teamProjects, personalProjects]);

  // Mise à jour de projet
  const updateProject = useCallback(async (
    projectId: string,
    updates: Partial<Omit<UnifiedProject, 'id' | 'createdAt' | 'teamId' | 'userId'>>
  ): Promise<boolean> => {
    if (isTeamMode) {
      return teamProjects.updateProject(projectId, {
        name: updates.name,
        description: updates.description,
        icon: updates.icon,
        color: updates.color,
        status: updates.status as any,
        targetDate: updates.targetDate,
        progress: updates.progress,
        orderIndex: updates.orderIndex,
      });
    } else {
      return personalProjects.updateProject(projectId, {
        name: updates.name,
        description: updates.description,
        icon: updates.icon,
        color: updates.color,
        status: updates.status,
        targetDate: updates.targetDate,
        progress: updates.progress,
        orderIndex: updates.orderIndex,
      });
    }
  }, [isTeamMode, teamProjects, personalProjects]);

  // Suppression de projet
  const deleteProject = useCallback(async (projectId: string): Promise<boolean> => {
    if (isTeamMode) {
      return teamProjects.deleteProject(projectId);
    } else {
      return personalProjects.deleteProject(projectId);
    }
  }, [isTeamMode, teamProjects, personalProjects]);

  // Compléter un projet
  const completeProject = useCallback(async (projectId: string): Promise<boolean> => {
    if (isTeamMode) {
      return teamProjects.updateProject(projectId, { status: 'completed' });
    } else {
      return personalProjects.completeProject(projectId);
    }
  }, [isTeamMode, teamProjects, personalProjects]);

  // Helpers pour filtrer
  const getActiveProjects = useCallback(() => {
    return projects.filter(p => p.status !== 'archived' && p.status !== 'completed');
  }, [projects]);

  const getCompletedProjects = useCallback(() => {
    return projects.filter(p => p.status === 'completed');
  }, [projects]);

  const getArchivedProjects = useCallback(() => {
    return projects.filter(p => p.status === 'archived');
  }, [projects]);

  // Reload
  const reload = useCallback(() => {
    if (isTeamMode) {
      teamProjects.refetch();
    } else {
      personalProjects.reloadProjects();
    }
  }, [isTeamMode, teamProjects, personalProjects]);

  return {
    projects,
    loading,
    isTeamMode,
    teamId,
    teamName: currentTeam?.name ?? null,
    createProject,
    updateProject,
    deleteProject,
    completeProject,
    getActiveProjects,
    getCompletedProjects,
    getArchivedProjects,
    reload,
  };
};
