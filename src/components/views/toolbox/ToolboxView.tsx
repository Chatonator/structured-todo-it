import React, { useState, useCallback } from 'react';
import { ViewLayout } from '@/components/layout/view';
import { Wrench } from 'lucide-react';
import { toolRegistry, getToolById } from './tools';
import ToolCatalog from './components/ToolCatalog';
import ToolModal from './components/ToolModal';

interface ToolboxViewProps {
  className?: string;
}

const ToolboxView: React.FC<ToolboxViewProps> = ({ className }) => {
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  
  const selectedTool = selectedToolId ? getToolById(selectedToolId) : null;

  const handleSelectTool = useCallback((toolId: string) => {
    setSelectedToolId(toolId);
  }, []);

  const handleCloseTool = useCallback(() => {
    setSelectedToolId(null);
  }, []);

  return (
    <ViewLayout
      header={{
        title: "Boîte à outils",
        subtitle: "Méthodes de productivité",
        icon: <Wrench className="w-5 h-5" />
      }}
      className={className}
    >
      <div className="pb-20 md:pb-6">
        {/* Info banner */}
        <div className="mb-6 p-4 rounded-lg bg-muted/50 border">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Vos outils de productivité</h3>
              <p className="text-sm text-muted-foreground">
                Sélectionnez un outil pour organiser, prioriser et planifier vos tâches 
                selon des méthodes éprouvées.
              </p>
            </div>
          </div>
        </div>

        {/* Tool catalog */}
        <ToolCatalog
          tools={toolRegistry}
          onSelectTool={handleSelectTool}
          groupByCategory={toolRegistry.length > 4}
        />

        {/* Tool modal */}
        <ToolModal
          tool={selectedTool}
          open={selectedToolId !== null}
          onClose={handleCloseTool}
        />
      </div>
    </ViewLayout>
  );
};

export default ToolboxView;
