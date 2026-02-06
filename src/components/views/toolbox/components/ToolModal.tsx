import React, { Suspense } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { X, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToolDefinition } from '../tools/types';

interface ToolModalProps {
  tool: ToolDefinition | null;
  open: boolean;
  onClose: () => void;
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

const ToolModal: React.FC<ToolModalProps> = ({ tool, open, onClose }) => {
  if (!tool) return null;

  const Icon = tool.icon;
  const ToolComponent = tool.component;

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
              onClick={onClose}
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
                {tool.description}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            <Suspense fallback={<ToolLoadingFallback />}>
              <ToolComponent onClose={onClose} />
            </Suspense>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ToolModal;
