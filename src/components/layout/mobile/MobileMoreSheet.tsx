import React, { useState } from 'react';
import { Settings, ArrowRight } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SettingsModal from '@/components/settings/SettingsModal';
import { getMobileMoreViews } from '@/components/routing/viewRegistry';
import { cn } from '@/lib/utils';

interface MobileMoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentView: string;
  onViewChange: (viewId: string) => void;
}

export const MobileMoreSheet: React.FC<MobileMoreSheetProps> = ({
  open,
  onOpenChange,
  currentView,
  onViewChange,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const moreViews = getMobileMoreViews();

  const handleSelectView = (viewId: string) => {
    onViewChange(viewId);
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[85dvh] rounded-t-[28px] px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-5">
          <SheetHeader className="mb-4 text-left">
            <SheetTitle>Plus de vues</SheetTitle>
          </SheetHeader>

          <div className="space-y-3">
            {moreViews.map((view) => {
              const Icon = view.icon;
              const isActive = currentView === view.id;

              return (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => handleSelectView(view.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4 text-left transition-colors',
                    isActive && 'border-primary/30 bg-primary/5'
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{view.title}</span>
                      {isActive && <Badge variant="secondary">Actuelle</Badge>}
                    </div>
                    {view.subtitle && <p className="mt-1 text-sm text-muted-foreground">{view.subtitle}</p>}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            })}

            <Button
              variant="outline"
              className="mt-4 h-12 w-full justify-start rounded-2xl"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};

export default MobileMoreSheet;
