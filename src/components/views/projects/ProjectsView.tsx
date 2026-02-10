import { useState, useMemo } from 'react';
import { useUnifiedProjects } from '@/hooks/useUnifiedProjects';
import { useTeamContext } from '@/contexts/TeamContext';
import { UnifiedProject } from '@/types/teamProject';
import { ProjectModal } from '@/components/projects/ProjectModal';
import { ProjectDetailView } from '@/components/projects/ProjectDetailView';
import { ProjectGrid } from '@/components/projects/ProjectGrid';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Briefcase, FolderPlus, Users } from 'lucide-react';
import { ViewLayout } from '@/components/layout/view';

export const ProjectsView = () => {
  const { 
    projects, 
    loading, 
    isTeamMode,
    teamName,
    teamId,
    createProject, 
    updateProject,
    deleteProject,
    getActiveProjects,
    getCompletedProjects,
    getArchivedProjects
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

  const handleCreateProject = async (data: any) => {
    await createProject(data.name, data.description, data.icon, data.color);
    setShowModal(false);
  };

  const handleUpdateProject = async (data: any) => {
    if (selectedProject) {
      await updateProject(selectedProject.id, data);
      setShowModal(false);
      setSelectedProjectId(null);
    }
  };

  const handleCardClick = (project: UnifiedProject) => {
    setDetailProjectId(project.id);
  };

  const handleEditFromDetail = () => {
    if (detailProject) {
      setSelectedProjectId(detailProject.id);
      setShowModal(true);
    }
  };

  const handleDeleteProject = async () => {
    if (detailProject) {
      await deleteProject(detailProject.id);
      setDetailProjectId(null);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedProjectId(null);
  };

  const viewTitle = isTeamMode ? `Projets de ${teamName}` : "Projets";
  const viewSubtitle = isTeamMode 
    ? "Gérez les projets de votre équipe" 
    : "Gérez vos projets complexes avec des tâches organisées";

  const activeProjects = getActiveProjects();
  const completedProjects = getCompletedProjects();
  const archivedProjects = getArchivedProjects();

  if (detailProject) {
    return (
      <ProjectDetailView
        project={detailProject}
        isTeamMode={isTeamMode}
        teamId={teamId}
        teamMembers={teamMembers}
        showModal={showModal}
        selectedProject={selectedProject}
        onBack={() => setDetailProjectId(null)}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteProject}
        onModalClose={handleModalClose}
        onModalSave={handleUpdateProject}
      />
    );
  }

  return (
    <>
      <ViewLayout
        header={{
          title: viewTitle,
          subtitle: viewSubtitle,
          icon: isTeamMode ? <Users className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />,
          actions: (
            <div className="flex items-center gap-2">
              {isTeamMode && (
                <Badge variant="secondary" className="gap-1">
                  <Users className="w-3 h-3" />
                  Équipe
                </Badge>
              )}
              <Button onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {isTeamMode ? "Nouveau projet d'équipe" : "Nouveau projet"}
              </Button>
            </div>
          )
        }}
        state={loading ? 'loading' : projects.length === 0 ? 'empty' : 'success'}
        loadingProps={{ variant: 'cards' }}
        emptyProps={{
          title: isTeamMode ? "Aucun projet d'équipe" : "Aucun projet",
          description: isTeamMode 
            ? "Créez le premier projet pour votre équipe"
            : "Créez votre premier projet pour organiser vos tâches",
          icon: <FolderPlus className="w-12 h-12" />,
          action: {
            label: isTeamMode ? "Créer un projet d'équipe" : "Créer un projet",
            onClick: () => setShowModal(true)
          }
        }}
      >
        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active">
              Actifs ({activeProjects.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Terminés ({completedProjects.length})
            </TabsTrigger>
            {archivedProjects.length > 0 && (
              <TabsTrigger value="archived">
                Archivés ({archivedProjects.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="active" className="mt-6">
            <ProjectGrid
              projects={activeProjects}
              onProjectClick={handleCardClick}
              showNewProjectZone
              onNewProjectClick={() => setShowModal(true)}
            />
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <ProjectGrid
              projects={completedProjects}
              onProjectClick={handleCardClick}
            />
          </TabsContent>

          {archivedProjects.length > 0 && (
            <TabsContent value="archived" className="mt-6">
              <ProjectGrid
                projects={archivedProjects}
                onProjectClick={handleCardClick}
              />
            </TabsContent>
          )}
        </Tabs>
      </ViewLayout>

      <ProjectModal
        open={showModal}
        onClose={handleModalClose}
        onSave={selectedProject ? handleUpdateProject : handleCreateProject}
        project={selectedProject}
        teamId={teamId ?? undefined}
      />
    </>
  );
};

export default ProjectsView;
