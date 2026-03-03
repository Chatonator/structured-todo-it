import React, { useState, useRef } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImagePlus, X, Loader2, Bug, Lightbulb, Upload } from 'lucide-react';
import { useSubmitBugReport } from '@/hooks/useBugReports';
import { cn } from '@/lib/utils';

interface BugReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Faible', color: 'text-green-600', bg: 'bg-green-500/10 border-green-500/30' },
  { value: 'medium', label: 'Moyen', color: 'text-yellow-600', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  { value: 'high', label: 'Élevé', color: 'text-orange-600', bg: 'bg-orange-500/10 border-orange-500/30' },
  { value: 'critical', label: 'Critique', color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30' },
];

const BugReportModal: React.FC<BugReportModalProps> = ({ open, onOpenChange }) => {
  const [type, setType] = useState<'bug' | 'feature_request'>('bug');
  const [severity, setSeverity] = useState('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { submitBugReport, isSubmitting } = useSubmitBugReport();

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    setScreenshot(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => handleFile(e.target.files?.[0]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;
    const success = await submitBugReport(title, description, type, severity, screenshot);
    if (success) {
      setTitle(''); setDescription(''); setType('bug'); setSeverity('medium');
      removeScreenshot();
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setTitle(''); setDescription(''); setType('bug'); setSeverity('medium');
    removeScreenshot();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Signaler un problème</DialogTitle>
          <DialogDescription>
            Décrivez votre problème ou idée. Le contexte de la page sera collecté automatiquement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Type selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Type de signalement</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('bug')}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-left',
                  type === 'bug'
                    ? 'border-destructive bg-destructive/5'
                    : 'border-border bg-muted/30 hover:bg-muted/60'
                )}
              >
                <Bug className={cn('w-6 h-6', type === 'bug' ? 'text-destructive' : 'text-muted-foreground')} />
                <div>
                  <div className={cn('font-semibold text-sm', type === 'bug' ? 'text-destructive' : 'text-foreground')}>🐛 Bug</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Quelque chose ne fonctionne pas</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setType('feature_request')}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-left',
                  type === 'feature_request'
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-muted/30 hover:bg-muted/60'
                )}
              >
                <Lightbulb className={cn('w-6 h-6', type === 'feature_request' ? 'text-primary' : 'text-muted-foreground')} />
                <div>
                  <div className={cn('font-semibold text-sm', type === 'feature_request' ? 'text-primary' : 'text-foreground')}>💡 Amélioration</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Une idée ou suggestion</div>
                </div>
              </button>
            </div>
          </div>

          {/* Severity (only for bugs) */}
          {type === 'bug' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sévérité</Label>
              <div className="flex gap-2 flex-wrap">
                {SEVERITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSeverity(opt.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                      severity === opt.value ? `${opt.bg} ${opt.color}` : 'border-border text-muted-foreground hover:border-muted-foreground'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bug-title" className="text-sm font-medium">
                {type === 'bug' ? 'Titre du bug' : 'Titre de l\'amélioration'} *
              </Label>
              <span className="text-xs text-muted-foreground">{title.length}/200</span>
            </div>
            <Input
              id="bug-title"
              placeholder={type === 'bug' ? 'Ex: Le bouton ne répond pas sur mobile...' : 'Ex: Ajouter un mode sombre...'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bug-desc" className="text-sm font-medium">
                {type === 'bug' ? 'Étapes pour reproduire' : 'Description de l\'idée'} *
              </Label>
              <span className="text-xs text-muted-foreground">{description.length}/2000</span>
            </div>
            <Textarea
              id="bug-desc"
              placeholder={type === 'bug'
                ? '1. Aller sur...\n2. Cliquer sur...\n3. Observer que...'
                : 'Décrivez votre idée, le problème qu\'elle résoudrait et comment vous l\'imaginez...'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={4}
            />
          </div>

          {/* Screenshot */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Capture d'écran <span className="text-muted-foreground font-normal">(optionnel)</span></Label>
            {preview ? (
              <div className="relative inline-block">
                <img src={preview} alt="Preview" className="max-h-36 rounded-lg border border-border" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80"
                  onClick={removeScreenshot}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
                  isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground hover:bg-muted/30'
                )}
              >
                <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Cliquer</span> ou glisser une image ici
                </p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF — max 5 Mo</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={handleClose}>Annuler</Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || !description.trim()}
            className={type === 'feature_request' ? '' : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {type === 'bug' ? '🐛 Signaler le bug' : '💡 Soumettre l\'idée'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BugReportModal;
