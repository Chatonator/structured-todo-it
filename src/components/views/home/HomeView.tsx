import React from 'react';
import { Home, Settings, X } from 'lucide-react';
import { ViewLayout } from '@/components/layout/view';
import { useHomeViewData } from '@/hooks/view-data';
import { useWidgetLayout } from '@/hooks/useWidgetLayout';
import { Button } from '@/components/ui/button';
import WidgetGrid from './WidgetGrid';
import DashboardControls from './DashboardControls';

const HomeView: React.FC<{ className?: string }> = ({ className }) => {
  const { state } = useHomeViewData();
  const {
    allWidgets,
    isEditing,
    setIsEditing,
    reorderWidgets,
    toggleWidget,
    resetLayout,
  } = useWidgetLayout();

  return (
    <ViewLayout
      header={{
        title: 'Dashboard personnel',
        subtitle: 'Composez une home utile, modulaire et vraiment a votre main',
        icon: <Home className="w-5 h-5" />,
        actions: (
          <Button
            variant={isEditing ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="gap-1.5"
          >
            {isEditing ? (
              <>
                <X className="w-4 h-4" />
                Terminer
              </>
            ) : (
              <>
                <Settings className="w-4 h-4" />
                Personnaliser
              </>
            )}
          </Button>
        ),
      }}
      state={state.loading ? 'loading' : 'success'}
      className={className}
    >
      <div>
        {isEditing && (
          <DashboardControls widgets={allWidgets} onToggle={toggleWidget} onReset={resetLayout} />
        )}

        <WidgetGrid
          widgets={allWidgets}
          isEditing={isEditing}
          onReorder={reorderWidgets}
          onToggle={toggleWidget}
        />
      </div>
    </ViewLayout>
  );
};

export default HomeView;
