import { FolderPlus } from 'lucide-react';

interface NewProjectZoneProps {
  onClick: () => void;
}

export const NewProjectZone = ({ onClick }: NewProjectZoneProps) => (
  <div
    className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-3
      transition-all duration-200 min-h-[200px]
      border-border bg-card hover:border-muted-foreground/50 cursor-pointer"
    onClick={onClick}
  >
    <FolderPlus className="w-10 h-10 text-muted-foreground" />
    <div className="text-center">
      <p className="font-medium">Nouveau projet</p>
      <p className="text-sm text-muted-foreground">
        Cliquez pour créer un projet
      </p>
    </div>
  </div>
);
