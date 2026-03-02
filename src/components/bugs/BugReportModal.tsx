import React, { useState, useRef } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { useSubmitBugReport } from '@/hooks/useBugReports';

interface BugReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BugReportModal: React.FC<BugReportModalProps> = ({ open, onOpenChange }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { submitBugReport, isSubmitting } = useSubmitBugReport();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return; // 5MB max
    setScreenshot(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;
    const success = await submitBugReport(title, description, screenshot);
    if (success) {
      setTitle('');
      setDescription('');
      removeScreenshot();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Signaler un bug</DialogTitle>
          <DialogDescription>
            Décrivez le problème rencontré. Le contexte de la page sera collecté automatiquement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bug-title">Titre *</Label>
            <Input
              id="bug-title"
              placeholder="Résumé court du problème"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bug-desc">Description *</Label>
            <Textarea
              id="bug-desc"
              placeholder="Décrivez les étapes pour reproduire le bug..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Capture d'écran (optionnel)</Label>
            {preview ? (
              <div className="relative inline-block">
                <img src={preview} alt="Preview" className="max-h-32 rounded-md border border-border" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground"
                  onClick={removeScreenshot}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-2">
                <ImagePlus className="w-4 h-4" />
                Ajouter une image
              </Button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || !description.trim()}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BugReportModal;
