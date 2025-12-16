import { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { Project } from '@/types/project';
import { ProjectCard } from './ProjectCard';
import { ProjectModal } from './ProjectModal';
import { ProjectDetail } from './ProjectDetail';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Briefcase, FolderPlus } from 'lucide-react';
import { useDragDrop } from '@/contexts/DragDropContext';

export const ProjectsView = () => {
  const { projects, loading, createProject, updateProject } = useProjects();
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [isDragOverNewProject, setIsDragOverNewProject] = useState(false);
  const [prefilledProjectName, setPrefilledProjectName] = useState<string>('');
  
  const { draggedTask, onConvertToProject } = useDragDrop();

  const handleCreateProject = async (data: any) => {
    await createProject(data.name, data.description, data.icon, data.color);
    setShowModal(false);
    setPrefilledProjectName('');
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

  // Handlers pour la zone de drop "nouveau projet"
  const handleNewProjectDragOver = (e: React.DragEvent) => {
    if (draggedTask) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleNewProjectDragEnter = (e: React.DragEvent) => {
    if (draggedTask) {
      e.preventDefault();
      setIsDragOverNewProject(true);
    }
  };

  const handleNewProjectDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverNewProject(false);
  };

  const handleNewProjectDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverNewProject(false);
    
    if (draggedTask && onConvertToProject) {
      onConvertToProject(draggedTask);
    }
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

  // Zone de drop pour créer un nouveau projet
  const NewProjectDropZone = () => (
    <div
      className={`
        border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-3
        transition-all duration-200 min-h-[200px]
        ${isDragOverNewProject 
          ? 'border-primary bg-primary/10 scale-105' 
          : draggedTask 
            ? 'border-primary/50 bg-accent/50' 
            : 'border-border bg-card hover:border-muted-foreground/50'
        }
        ${draggedTask ? 'cursor-copy' : 'cursor-pointer'}
      `}
      onClick={() => !draggedTask && setShowModal(true)}
      onDragOver={handleNewProjectDragOver}
      onDragEnter={handleNewProjectDragEnter}
      onDragLeave={handleNewProjectDragLeave}
      onDrop={handleNewProjectDrop}
    >
      <FolderPlus className={`w-10 h-10 ${isDragOverNewProject ? 'text-primary' : 'text-muted-foreground'}`} />
      {draggedTask ? (
        <div className="text-center">
          <p className="font-medium text-primary">
            {isDragOverNewProject ? 'Relâcher pour créer le projet' : 'Déposer ici'}
          </p>
          <p className="text-sm text-muted-foreground">
            "{draggedTask.name}" deviendra un nouveau projet
          </p>
        </div>
      ) : (
        <div className="text-center">
          <p className="font-medium">Nouveau projet</p>
          <p className="text-sm text-muted-foreground">
            Cliquez ou glissez une tâche ici
          </p>
        </div>
      )}
    </div>
  );

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
          <NewProjectDropZone />
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
              <NewProjectDropZone />
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
          setPrefilledProjectName('');
        }}
        onSave={selectedProject ? handleUpdateProject : handleCreateProject}
        project={selectedProject}
      />
    </div>
  );
};
