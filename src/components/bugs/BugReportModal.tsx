import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import BugReportForm from './BugReportForm';

interface BugReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BugReportModal: React.FC<BugReportModalProps> = ({ open, onOpenChange }) => {
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => { if (!nextOpen) handleClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col gap-0 overflow-hidden">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
          <SheetTitle className="text-base font-semibold">Signaler un problème</SheetTitle>
          <SheetDescription className="text-sm">
            Décrivez votre problème ou idée. Le contexte de la page sera collecté automatiquement.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <BugReportForm variant="sheet" onSuccess={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BugReportModal;
