import { useState, useMemo } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { Project } from '@/types/project';
import { ProjectCard } from './ProjectCard';
import { ProjectModal } from './ProjectModal';
import { ProjectDetail } from './ProjectDetail';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Briefcase, FolderPlus } from 'lucide-react';
import { ViewLayout } from '@/components/layout/view';

export const ProjectsView = () => {
  const { projects, loading, createProject, updateProject } = useProjects();
  const [showModal, setShowModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [detailProjectId, setDetailProjectId] = useState<string | null>(null);

  // Retrouver les projets dynamiquement depuis la source de données
  // Cela garantit que les changements sont reflétés immédiatement
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
      // Ne pas fermer la vue détail - le projet sera mis à jour automatiquement
    }
  };

  const handleCardClick = (project: Project) => {
    setDetailProjectId(project.id);
  };

  const handleEditFromDetail = () => {
    if (detailProject) {
      setSelectedProjectId(detailProject.id);
      setShowModal(true);
    }
  };

  // Vue détail d'un projet
  if (detailProject) {
    return (
      <>
        <ProjectDetail
          project={detailProject}
          onBack={() => setDetailProjectId(null)}
          onEdit={handleEditFromDetail}
          onDelete={() => setDetailProjectId(null)}
        />
        <ProjectModal
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedProjectId(null);
          }}
          onSave={handleUpdateProject}
          project={selectedProject}
        />
      </>
    );
  }

  const activeProjects = projects.filter(p => p.status !== 'archived' && p.status !== 'completed');
  const completedProjects = projects.filter(p => p.status === 'completed');
  const archivedProjects = projects.filter(p => p.status === 'archived');

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
        title: "Projets",
        subtitle: "Gérez vos projets complexes avec des tâches organisées",
        icon: <Briefcase className="w-5 h-5" />,
        actions: (
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau projet
          </Button>
        )
      }}
      state={loading ? 'loading' : projects.length === 0 ? 'empty' : 'success'}
      loadingProps={{ variant: 'cards' }}
      emptyProps={{
        title: "Aucun projet",
        description: "Créez votre premier projet pour organiser vos tâches",
        icon: <FolderPlus className="w-12 h-12" />,
        action: {
          label: "Créer un projet",
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
      />
    </ViewLayout>
  );
};

export default ProjectsView;
