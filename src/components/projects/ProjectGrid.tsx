import { UnifiedProject } from '@/types/teamProject';
import { ProjectCard } from './ProjectCard';
import { NewProjectZone } from './NewProjectZone';

interface ProjectGridProps {
  projects: UnifiedProject[];
  onProjectClick: (project: UnifiedProject) => void;
  showNewProjectZone?: boolean;
  onNewProjectClick?: () => void;
}

export const ProjectGrid = ({ 
  projects, 
  onProjectClick, 
  showNewProjectZone = false,
  onNewProjectClick 
}: ProjectGridProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {projects.map((project) => (
      <ProjectCard
        key={project.id}
        project={project}
        onClick={() => onProjectClick(project)}
      />
    ))}
    {showNewProjectZone && onNewProjectClick && (
      <NewProjectZone onClick={onNewProjectClick} />
    )}
  </div>
);
