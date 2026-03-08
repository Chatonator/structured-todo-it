import React, { useState, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Loader2, Bug, Lightbulb, Upload, Check } from 'lucide-react';
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

  const isValid = title.trim().length > 0 && description.trim().length > 0;

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
          <div className="space-y-5">
            {/* ─── Title (borderless-bottom) ─── */}
            <Input
              type="text"
              placeholder={type === 'bug' ? 'Titre du bug *' : 'Titre de l\'amélioration *'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              autoFocus
              className={cn(
                'text-base h-11 font-medium placeholder:text-muted-foreground/60 border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary transition-colors',
                !title.trim() && 'border-destructive'
              )}
            />

            {/* Type selector */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Type de signalement</Label>
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
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Sévérité</Label>
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

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  {type === 'bug' ? 'Étapes pour reproduire' : 'Description de l\'idée'} *
                </Label>
                <span className="text-xs text-muted-foreground">{description.length}/2000</span>
              </div>
              <Textarea
                placeholder={type === 'bug'
                  ? '1. Aller sur...\n2. Cliquer sur...\n3. Observer que...'
                  : 'Décrivez votre idée, le problème qu\'elle résoudrait et comment vous l\'imaginez...'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Screenshot */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Capture d'écran <span className="font-normal">(optionnel)</span>
              </Label>
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
        </div>

        {/* ─── Sticky footer ─── */}
        <div className="border-t border-border p-4 bg-background">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !isValid}
            className={cn('w-full', type === 'bug' && 'bg-destructive hover:bg-destructive/90 text-destructive-foreground')}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            {type === 'bug' ? '🐛 Signaler le bug' : '💡 Soumettre l\'idée'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BugReportModal;
