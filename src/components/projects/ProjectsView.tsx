import { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { Project } from '@/types/project';
import { ProjectCard } from './ProjectCard';
import { ProjectModal } from './ProjectModal';
import { ProjectDetail } from './ProjectDetail';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Briefcase } from 'lucide-react';

export const ProjectsView = () => {
  const { projects, loading, createProject, updateProject } = useProjects();
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [detailProject, setDetailProject] = useState<Project | null>(null);

  const handleCreateProject = async (data: any) => {
    await createProject(data.name, data.description, data.icon, data.color);
    setShowModal(false);
  };

  const handleUpdateProject = async (data: any) => {
    if (selectedProject) {
      await updateProject(selectedProject.id, data);
      setShowModal(false);
      setSelectedProject(null);
      if (detailProject && detailProject.id === selectedProject.id) {
        setDetailProject(null);
      }
    }
  };

  const handleCardClick = (project: Project) => {
    setDetailProject(project);
  };

  const handleEditFromDetail = () => {
    setSelectedProject(detailProject);
    setShowModal(true);
  };

  if (detailProject) {
    return (
      <>
        <ProjectDetail
          project={detailProject}
          onBack={() => setDetailProject(null)}
          onEdit={handleEditFromDetail}
          onDelete={() => setDetailProject(null)}
        />
        <ProjectModal
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedProject(null);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Briefcase className="w-8 h-8 text-project" />
          <div>
            <h1 className="text-3xl font-bold">Projets</h1>
            <p className="text-muted-foreground">
              Gérez vos projets complexes avec des tâches organisées
            </p>
          </div>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau projet
        </Button>
      </div>

      {/* Empty State */}
      {projects.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Aucun projet</h3>
          <p className="text-muted-foreground mb-6">
            Créez votre premier projet pour organiser vos tâches complexes
          </p>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Créer un projet
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="active">
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
      )}

      {/* Modal */}
      <ProjectModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedProject(null);
        }}
        onSave={selectedProject ? handleUpdateProject : handleCreateProject}
        project={selectedProject}
      />
    </div>
  );
};
