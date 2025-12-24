import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ItemContextType, ItemMetadata, CONTEXT_TYPE_LABELS } from '@/types/item';
import { getFieldConfigs, FieldConfig } from '@/config/contextSchemas';
import { ArrowRight } from 'lucide-react';

interface ContextTransformModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (metadata: Partial<ItemMetadata>) => void;
  itemName: string;
  fromContext: ItemContextType;
  toContext: ItemContextType;
  missingFields: (keyof ItemMetadata)[];
  currentMetadata: Partial<ItemMetadata>;
}

export function ContextTransformModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  fromContext,
  toContext,
  missingFields,
  currentMetadata
}: ContextTransformModalProps) {
  const [formData, setFormData] = useState<Partial<ItemMetadata>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Réinitialiser le formulaire quand la modale s'ouvre
  useEffect(() => {
    if (isOpen) {
      setFormData({});
      setErrors({});
    }
  }, [isOpen]);
  
  const fieldConfigs = getFieldConfigs(toContext).filter(
    config => missingFields.includes(config.key)
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    fieldConfigs.forEach(config => {
      if (config.required) {
        const value = formData[config.key];
        if (value === undefined || value === null || value === '') {
          newErrors[String(config.key)] = `${config.label} est requis`;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onConfirm(formData);
    }
  };

  const handleClose = () => {
    setFormData({});
    setErrors({});
    onClose();
  };

  const renderField = (config: FieldConfig) => {
    const value = formData[config.key] ?? currentMetadata[config.key] ?? '';
    const fieldKey = String(config.key);
    const hasError = !!errors[fieldKey];

    switch (config.type) {
      case 'select':
        return (
          <div className="space-y-1">
            <Select
              value={value ? String(value) : undefined}
              onValueChange={(val) => {
                setFormData(prev => ({ ...prev, [config.key]: val }));
                setErrors(prev => ({ ...prev, [fieldKey]: '' }));
              }}
            >
              <SelectTrigger className={hasError ? 'border-destructive' : ''}>
                <SelectValue placeholder={`Sélectionner ${config.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {config.options?.map(opt => (
                  <SelectItem key={String(opt.value)} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError && <p className="text-xs text-destructive">{errors[fieldKey]}</p>}
          </div>
        );
      
      case 'number':
        return (
          <div className="space-y-1">
            <Input
              type="number"
              value={value as number || ''}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, [config.key]: Number(e.target.value) }));
                setErrors(prev => ({ ...prev, [fieldKey]: '' }));
              }}
              placeholder={config.label}
              className={hasError ? 'border-destructive' : ''}
            />
            {hasError && <p className="text-xs text-destructive">{errors[fieldKey]}</p>}
          </div>
        );
      
      case 'color':
        return (
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={value as string || '#a78bfa'}
              onChange={(e) => setFormData(prev => ({ ...prev, [config.key]: e.target.value }))}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <span className="text-sm text-muted-foreground">{value as string || '#a78bfa'}</span>
          </div>
        );
      
      default:
        return (
          <div className="space-y-1">
            <Input
              type="text"
              value={value as string || ''}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, [config.key]: e.target.value }));
                setErrors(prev => ({ ...prev, [fieldKey]: '' }));
              }}
              placeholder={config.label}
              className={hasError ? 'border-destructive' : ''}
            />
            {hasError && <p className="text-xs text-destructive">{errors[fieldKey]}</p>}
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Transformer en {CONTEXT_TYPE_LABELS[toContext]}
          </DialogTitle>
          <DialogDescription>
            Complétez les informations requises pour finaliser la transformation.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Visualisation de la transformation */}
          <div className="flex items-center justify-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="text-center">
              <span className="text-xs text-muted-foreground">{CONTEXT_TYPE_LABELS[fromContext]}</span>
              <p className="font-medium truncate max-w-[120px]">{itemName}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="text-center">
              <span className="text-xs text-primary">{CONTEXT_TYPE_LABELS[toContext]}</span>
              <p className="font-medium truncate max-w-[120px]">{itemName}</p>
            </div>
          </div>
          
          {fieldConfigs.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Les champs suivants sont requis pour un {CONTEXT_TYPE_LABELS[toContext].toLowerCase()} :
              </p>
              
              {fieldConfigs.map(config => (
                <div key={String(config.key)} className="space-y-2">
                  <Label htmlFor={String(config.key)}>
                    {config.label} {config.required && <span className="text-destructive">*</span>}
                  </Label>
                  {renderField(config)}
                </div>
              ))}
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              Aucune information supplémentaire n'est requise.
            </p>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Annuler</Button>
          <Button onClick={handleSubmit}>Transformer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}