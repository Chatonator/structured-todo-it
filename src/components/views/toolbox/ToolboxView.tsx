import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { ViewLayout } from '@/components/layout/view';
import { Wrench, ArrowLeft } from 'lucide-react';
import { toolRegistry, getToolById } from './tools';
import ToolCatalog from './components/ToolCatalog';
import ToolDetailView from './components/ToolDetailView';
import { getLaunchedTools, markToolLaunched } from './components/toolLaunchHelpers';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface ToolboxViewProps {
  className?: string;
}

const ToolLoadingFallback: React.FC = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-8 w-48" />
    <div className="grid grid-cols-2 gap-4">
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
    </div>
  </div>
);

const ToolboxView: React.FC<ToolboxViewProps> = ({ className }) => {
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [sheetToolId, setSheetToolId] = useState<string | null>(null);
  const [launchedTools, setLaunchedTools] = useState<string[]>([]);

  useEffect(() => {
    setLaunchedTools(getLaunchedTools());
  }, []);

  const activeTool = activeToolId ? getToolById(activeToolId) : null;
  const sheetTool = sheetToolId ? getToolById(sheetToolId) : null;

  // Click on card -> launch tool directly
  const handleSelectTool = useCallback((toolId: string) => {
    markToolLaunched(toolId);
    setLaunchedTools(getLaunchedTools());
    setActiveToolId(toolId);
  }, []);

  // Info button -> open Sheet with details
  const handleQuickLaunch = useCallback((toolId: string) => {
    setSheetToolId(toolId);
  }, []);

  // Launch from Sheet detail view
  const handleLaunchFromSheet = useCallback(() => {
    if (sheetToolId) {
      markToolLaunched(sheetToolId);
      setLaunchedTools(getLaunchedTools());
      setActiveToolId(sheetToolId);
      setSheetToolId(null);
    }
  }, [sheetToolId]);

  // Back to catalog
  const handleBackToCatalog = useCallback(() => {
    setActiveToolId(null);
  }, []);

  // Render active tool inline
  if (activeTool) {
    const ToolComponent = activeTool.component;
    const Icon = activeTool.icon;

    return (
      <ViewLayout
        header={{
          title: activeTool.name,
          subtitle: "En cours d'utilisation",
          icon: <Icon className={cn("w-5 h-5", activeTool.color)} />,
        }}
        className={className}
      >
        <div>
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToCatalog}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la boîte à outils
            </Button>
          </div>
          <Suspense fallback={<ToolLoadingFallback />}>
            <ToolComponent onClose={handleBackToCatalog} />
          </Suspense>
        </div>
      </ViewLayout>
    );
  }

  // Render catalog + Sheet
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
          groupByCategory={false}
        />

        {/* Detail Sheet */}
        <Sheet open={sheetToolId !== null} onOpenChange={(open) => !open && setSheetToolId(null)}>
          <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader className="sr-only">
              <SheetTitle>{sheetTool?.name ?? 'Détails'}</SheetTitle>
              <SheetDescription>{sheetTool?.description ?? ''}</SheetDescription>
            </SheetHeader>
            {sheetTool && (
              <ToolDetailView tool={sheetTool} onLaunch={handleLaunchFromSheet} />
            )}
          </SheetContent>
        </Sheet>
      </div>
    </ViewLayout>
  );
};

export default ToolboxView;

