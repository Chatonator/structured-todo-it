import React, { useState, useCallback, useEffect } from 'react';
import { ViewLayout } from '@/components/layout/view';
import { Wrench } from 'lucide-react';
import { toolRegistry, getToolById } from './tools';
import ToolCatalog from './components/ToolCatalog';
import ToolModal, { ToolModalMode, getLaunchedTools } from './components/ToolModal';

interface ToolboxViewProps {
  className?: string;
}

const ToolboxView: React.FC<ToolboxViewProps> = ({ className }) => {
  const [modalState, setModalState] = useState<{
    toolId: string | null;
    mode: ToolModalMode;
  }>({ toolId: null, mode: 'detail' });

  const [launchedTools, setLaunchedTools] = useState<string[]>([]);

  // Load launched tools from localStorage on mount
  useEffect(() => {
    setLaunchedTools(getLaunchedTools());
  }, []);

  // Refresh launched tools when modal closes
  useEffect(() => {
    if (modalState.toolId === null) {
      setLaunchedTools(getLaunchedTools());
    }
  }, [modalState.toolId]);
  
  const selectedTool = modalState.toolId ? getToolById(modalState.toolId) : null;

  // Open in detail mode (default click on card)
  const handleSelectTool = useCallback((toolId: string) => {
    setModalState({ toolId, mode: 'detail' });
  }, []);

  // Open directly in tool mode (quick launch)
  const handleQuickLaunch = useCallback((toolId: string) => {
    setModalState({ toolId, mode: 'tool' });
  }, []);

  const handleCloseTool = useCallback(() => {
    setModalState({ toolId: null, mode: 'detail' });
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
      <div>
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
          onQuickLaunch={handleQuickLaunch}
          launchedTools={launchedTools}
          groupByCategory={toolRegistry.length > 4}
        />

        {/* Tool modal */}
        <ToolModal
          tool={selectedTool}
          open={modalState.toolId !== null}
          onClose={handleCloseTool}
          initialMode={modalState.mode}
        />
      </div>
    </ViewLayout>
  );
};

export default ToolboxView;
