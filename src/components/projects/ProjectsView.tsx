import { useState, useMemo } from 'react';
import { useUnifiedProjects } from '@/hooks/useUnifiedProjects';
import { UnifiedProject, isTeamProject } from '@/types/teamProject';
import { ProjectCard } from './ProjectCard';
import { ProjectModal } from './ProjectModal';
import { ProjectDetail } from './ProjectDetail';
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
    getActiveProjects,
    getCompletedProjects,
    getArchivedProjects
  } = useUnifiedProjects();
  
  const [showModal, setShowModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [detailProjectId, setDetailProjectId] = useState<string | null>(null);

  // Retrouver les projets dynamiquement depuis la source de données
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

  // Titre dynamique selon le mode
  const viewTitle = isTeamMode ? `Projets de ${teamName}` : "Projets";
  const viewSubtitle = isTeamMode 
    ? "Gérez les projets de votre équipe" 
    : "Gérez vos projets complexes avec des tâches organisées";

  // Listes filtrées
  const activeProjects = getActiveProjects();
  const completedProjects = getCompletedProjects();
  const archivedProjects = getArchivedProjects();

  // Zone pour créer un nouveau projet
  const NewProjectZone = () => (
    <div
      className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-3
        transition-all duration-200 min-h-[200px]
        border-border bg-card hover:border-muted-foreground/50 cursor-pointer"
      onClick={() => setShowModal(true)}
    >
      <FolderPlus className="w-10 h-10 text-muted-foreground" />
      <div className="text-center">
        <p className="font-medium">Nouveau projet</p>
        <p className="text-sm text-muted-foreground">
          Cliquez pour créer un projet
        </p>
      </div>
    </div>
  );

  return (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => handleCardClick(project)}
              />
            ))}
            <NewProjectZone />
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => handleCardClick(project)}
              />
            ))}
          </div>
        </TabsContent>

        {archivedProjects.length > 0 && (
          <TabsContent value="archived" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => handleCardClick(project)}
                />
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Modal */}
      <ProjectModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedProjectId(null);
        }}
        onSave={selectedProject ? handleUpdateProject : handleCreateProject}
        project={selectedProject}
        teamId={teamId ?? undefined}
      />
    </ViewLayout>
  );
};

export default ProjectsView;
