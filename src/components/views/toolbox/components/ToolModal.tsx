import React, { Suspense, useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToolDefinition } from '../tools/types';
import ToolDetailView from './ToolDetailView';

// localStorage key for tracking launched tools
const LAUNCHED_TOOLS_KEY = 'toolbox_launched_tools';

function getLaunchedTools(): string[] {
  try {
    const stored = localStorage.getItem(LAUNCHED_TOOLS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function markToolLaunched(toolId: string): void {
  const current = getLaunchedTools();
  if (!current.includes(toolId)) {
    localStorage.setItem(LAUNCHED_TOOLS_KEY, JSON.stringify([...current, toolId]));
  }
}

export type ToolModalMode = 'detail' | 'tool';

interface ToolModalProps {
  tool: ToolDefinition | null;
  open: boolean;
  onClose: () => void;
  initialMode?: ToolModalMode;
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

const ToolModal: React.FC<ToolModalProps> = ({ 
  tool, 
  open, 
  onClose, 
  initialMode = 'detail' 
}) => {
  const [mode, setMode] = useState<ToolModalMode>(initialMode);

  // Reset mode when tool changes or modal opens
  useEffect(() => {
    if (open && tool) {
      setMode(initialMode);
    }
  }, [open, tool?.id, initialMode]);

  const handleLaunch = useCallback(() => {
    if (tool) {
      markToolLaunched(tool.id);
      setMode('tool');
    }
  }, [tool]);

  const handleBack = useCallback(() => {
    if (mode === 'tool') {
      setMode('detail');
    } else {
      onClose();
    }
  }, [mode, onClose]);

  if (!tool) return null;

  const Icon = tool.icon;
  const ToolComponent = tool.component;
  const isToolMode = mode === 'tool';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent 
        className={cn(
          "max-w-[95vw] w-full h-[95vh] max-h-[95vh] p-0 gap-0",
          "flex flex-col",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        )}
      >
        {/* Header */}
        <DialogHeader className="shrink-0 px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
              tool.bgColor
            )}>
              <Icon className={cn("w-5 h-5", tool.color)} />
            </div>
            
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold">
                {tool.name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground truncate">
                {isToolMode ? 'En cours d\'utilisation' : tool.description}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="shrink-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className={cn("p-6", !isToolMode && "p-0")}>
            {isToolMode ? (
              <Suspense fallback={<ToolLoadingFallback />}>
                <ToolComponent onClose={onClose} />
              </Suspense>
            ) : (
              <ToolDetailView tool={tool} onLaunch={handleLaunch} />
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ToolModal;
export { getLaunchedTools, markToolLaunched };
