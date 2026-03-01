import { ProjectModal } from '@/components/projects/ProjectModal';
import { ProjectDetailView } from '@/components/projects/ProjectDetailView';
import { ProjectGrid } from '@/components/projects/ProjectGrid';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Briefcase, FolderPlus, Users } from 'lucide-react';
import { ViewLayout } from '@/components/layout/view';
import { useProjectsFullViewData } from '@/hooks/view-data';

export const ProjectsView = () => {
  const { data, state, actions } = useProjectsFullViewData();

  if (data.detailProject) {
    return (
      <ProjectDetailView
        project={data.detailProject}
        isTeamMode={state.isTeamMode}
        teamId={data.teamId}
        teamMembers={data.teamMembers}
        showModal={state.showModal}
        selectedProject={data.selectedProject}
        onBack={actions.handleBack}
        onEdit={actions.handleEditFromDetail}
        onDelete={actions.handleDeleteProject}
        onModalClose={actions.handleModalClose}
        onModalSave={actions.handleUpdateProject}
      />
    );
  }

  return (
    <>
      <ViewLayout
        header={{
          title: data.viewTitle,
          subtitle: data.viewSubtitle,
          icon: state.isTeamMode ? <Users className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />,
          actions: (
            <div className="flex items-center gap-2">
              {state.isTeamMode && (
                <Badge variant="secondary" className="gap-1">
                  <Users className="w-3 h-3" />
                  Équipe
                </Badge>
              )}
              <Button onClick={() => actions.setShowModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {state.isTeamMode ? "Nouveau projet d'équipe" : "Nouveau projet"}
              </Button>
            </div>
          )
        }}
        state={state.viewState}
        loadingProps={{ variant: 'cards' }}
        emptyProps={{
          title: state.isTeamMode ? "Aucun projet d'équipe" : "Aucun projet",
          description: state.isTeamMode
            ? "Créez le premier projet pour votre équipe"
            : "Créez votre premier projet pour organiser vos tâches",
          icon: <FolderPlus className="w-12 h-12" />,
          action: {
            label: state.isTeamMode ? "Créer un projet d'équipe" : "Créer un projet",
            onClick: () => actions.setShowModal(true)
          }
        }}
      >
        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active">
              Actifs ({data.activeProjects.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Terminés ({data.completedProjects.length})
            </TabsTrigger>
            {data.archivedProjects.length > 0 && (
              <TabsTrigger value="archived">
                Archivés ({data.archivedProjects.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="active" className="mt-6">
            <ProjectGrid
              projects={data.activeProjects}
              onProjectClick={actions.handleCardClick}
              showNewProjectZone
              onNewProjectClick={() => actions.setShowModal(true)}
            />
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <ProjectGrid
              projects={data.completedProjects}
              onProjectClick={actions.handleCardClick}
            />
          </TabsContent>

          {data.archivedProjects.length > 0 && (
            <TabsContent value="archived" className="mt-6">
              <ProjectGrid
                projects={data.archivedProjects}
                onProjectClick={actions.handleCardClick}
              />
            </TabsContent>
          )}
        </Tabs>
      </ViewLayout>

      <ProjectModal
        open={state.showModal}
        onClose={actions.handleModalClose}
        onSave={data.selectedProject ? actions.handleUpdateProject : actions.handleCreateProject}
        project={data.selectedProject}
        teamId={data.teamId ?? undefined}
      />
    </>
  );
};

export default ProjectsView;
