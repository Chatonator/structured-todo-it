import React from 'react';
import { CheckSquare } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { TaskBacklogSurface } from '@/components/backlog/TaskBacklogSurface';

interface MobileTaskHubSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MobileTaskHubSheet: React.FC<MobileTaskHubSheetProps> = ({ open, onOpenChange }) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex h-[92dvh] flex-col rounded-t-[32px] px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-5"
      >
        <SheetHeader className="mb-4 text-left">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CheckSquare className="h-4 w-4" />
            </span>
            Tâches essentielles
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Une vue pensée téléphone pour capturer, filtrer et traiter vos tâches rapidement.
          </p>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <TaskBacklogSurface variant="mobile" />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileTaskHubSheet;
