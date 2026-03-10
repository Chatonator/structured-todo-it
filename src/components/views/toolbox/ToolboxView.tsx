import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { ViewLayout } from '@/components/layout/view';
import { Wrench, ArrowLeft, Sparkles, Play, Eye } from 'lucide-react';
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
  const highlightedTool = [...toolRegistry].reverse().find(tool => tool.isNew) ?? null;
  const HighlightedIcon = highlightedTool?.icon;

  // Click on card → open Sheet with details
  const handleSelectTool = useCallback((toolId: string) => {
    setSheetToolId(toolId);
  }, []);

  // Quick launch → go directly to inline tool
  const handleQuickLaunch = useCallback((toolId: string) => {
    markToolLaunched(toolId);
    setLaunchedTools(getLaunchedTools());
    setActiveToolId(toolId);
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

        {highlightedTool && HighlightedIcon && (
          <div className="mb-6 rounded-xl border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", highlightedTool.bgColor)}>
                  <HighlightedIcon className={cn("w-6 h-6", highlightedTool.color)} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
                      <Sparkles className="w-3 h-3" />
                      Nouvel outil
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg">{highlightedTool.name}</h3>
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    {highlightedTool.description}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleSelectTool(highlightedTool.id)} className="gap-2">
                  <Eye className="w-4 h-4" />
                  Voir
                </Button>
                <Button onClick={() => handleQuickLaunch(highlightedTool.id)} className="gap-2">
                  <Play className="w-4 h-4" />
                  Lancer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tool catalog */}
        <ToolCatalog
          tools={toolRegistry}
          onSelectTool={handleSelectTool}
          onQuickLaunch={handleQuickLaunch}
          launchedTools={launchedTools}
          groupByCategory={toolRegistry.length > 4}
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
