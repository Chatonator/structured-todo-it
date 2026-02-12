import React from 'react';
import { Briefcase } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ViewSection } from '@/components/layout/view';
import { useHomeViewData } from '@/hooks/view-data';
import { useApp } from '@/contexts/AppContext';

const ActiveProjectWidget: React.FC = () => {
  const { setCurrentView } = useApp();
  const { data } = useHomeViewData();
  const { activeProject } = data;

  return (
    <ViewSection
      title="Projet en cours"
      icon={<Briefcase className="w-5 h-5 text-project" />}
      variant="card"
      showViewAll
      viewAllLabel="Tous les projets"
      onViewAll={() => setCurrentView('projects')}
    >
      {!activeProject ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Aucun projet actif
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: activeProject.color + '20' }}
            >
              {activeProject.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">{activeProject.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{activeProject.description}</p>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-semibold text-project">{activeProject.progress || 0}%</span>
            </div>
            <Progress value={activeProject.progress || 0} className="h-2" />
          </div>
        </div>
      )}
    </ViewSection>
  );
};

export default ActiveProjectWidget;
