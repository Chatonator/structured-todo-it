import { UnifiedProject } from '@/types/teamProject';
import { ProjectDetail } from './ProjectDetail';
import { TeamProjectDetail } from '@/components/team/TeamProjectDetail';
import { ProjectModal } from './ProjectModal';
import { TeamMember } from '@/hooks/useTeams';

interface ProjectDetailViewProps {
  project: UnifiedProject;
  isTeamMode: boolean;
  teamId: string | null;
  teamMembers: TeamMember[];
  showModal: boolean;
  selectedProject: UnifiedProject | null;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onModalClose: () => void;
  onModalSave: (data: any) => Promise<void>;
}

export const ProjectDetailView = ({
  project,
  isTeamMode,
  teamId,
  teamMembers,
  showModal,
  selectedProject,
  onBack,
  onEdit,
  onDelete,
  onModalClose,
  onModalSave,
}: ProjectDetailViewProps) => {
  // Vue détail pour projet d'équipe
  if (isTeamMode && teamId) {
    return (
      <>
        <TeamProjectDetail
          project={{
            id: project.id,
            name: project.name,
            description: project.description,
            icon: project.icon,
            color: project.color,
            status: project.status,
            targetDate: project.targetDate,
            progress: project.progress,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            completedAt: project.completedAt,
            orderIndex: project.orderIndex,
            teamId: teamId,
            createdBy: project.createdBy || '',
            kanbanColumns: project.kanbanColumns,
            showInSidebar: project.showInSidebar ?? false,
          }}
          teamId={teamId}
          teamMembers={teamMembers}
          onBack={onBack}
          onEdit={onEdit}
          onDelete={onDelete}
        />
        <ProjectModal
          open={showModal}
          onClose={onModalClose}
          onSave={onModalSave}
          project={selectedProject}
          teamId={teamId}
        />
      </>
    );
  }

  // Vue détail pour projet personnel
  return (
    <>
      <ProjectDetail
        project={project as any}
        onBack={onBack}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <ProjectModal
        open={showModal}
        onClose={onModalClose}
        onSave={onModalSave}
        project={selectedProject}
        teamId={teamId ?? undefined}
      />
    </>
  );
};
