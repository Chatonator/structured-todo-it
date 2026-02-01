/**
 * Types unifiés pour projets personnels et d'équipe
 * Permet de partager les composants ProjectCard, ProjectModal, etc.
 */

import { Project, ProjectStatus } from './project';
import { TeamProject, TeamProjectStatus } from '@/hooks/useTeamProjects';
import { KanbanColumnConfig } from './item';

/**
 * Interface commune pour projets perso et équipe
 * Utilisée par les composants génériques (ProjectCard, ProjectModal)
 */
export interface UnifiedProject {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  status: ProjectStatus; // Même enum pour les deux
  targetDate?: Date;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  orderIndex: number;
  
  // Contexte - un seul est défini à la fois
  teamId?: string;   // Si présent = projet d'équipe
  userId?: string;   // Si présent = projet personnel
  createdBy?: string; // Pour les projets d'équipe
  kanbanColumns?: KanbanColumnConfig[]; // Colonnes Kanban personnalisées
  showInSidebar?: boolean; // Affichage dans la sidebar
}

/**
 * Convertit un Project (personnel) en UnifiedProject
 */
export function projectToUnified(project: Project): UnifiedProject {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    icon: project.icon || '📚',
    color: project.color,
    status: project.status,
    targetDate: project.targetDate,
    progress: project.progress,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    completedAt: project.completedAt,
    orderIndex: project.orderIndex,
    userId: project.userId,
  };
}

/**
 * Convertit un TeamProject en UnifiedProject
 */
export function teamProjectToUnified(project: TeamProject): UnifiedProject {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    icon: project.icon || '📁',
    color: project.color,
    status: project.status as ProjectStatus, // TeamProjectStatus est compatible
    targetDate: project.targetDate,
    progress: project.progress,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    completedAt: project.completedAt,
    orderIndex: project.orderIndex,
    teamId: project.teamId,
    createdBy: project.createdBy,
    kanbanColumns: project.kanbanColumns,
    showInSidebar: project.showInSidebar,
  };
}

/**
 * Vérifie si un projet unifié est un projet d'équipe
 */
export function isTeamProject(project: UnifiedProject): boolean {
  return !!project.teamId;
}

/**
 * Vérifie si un projet unifié est un projet personnel
 */
export function isPersonalProject(project: UnifiedProject): boolean {
  return !!project.userId;
}
