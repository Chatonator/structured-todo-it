import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ItemContextType, ItemMetadata, CONTEXT_TYPE_LABELS } from '@/types/item';
import { getFieldConfigs, FieldConfig } from '@/config/contextSchemas';

interface ContextTransformModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (metadata: Partial<ItemMetadata>) => void;
  itemName: string;
  fromContext: ItemContextType;
  toContext: ItemContextType;
  missingFields: (keyof ItemMetadata)[];
  currentMetadata: ItemMetadata;
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
  
  const fieldConfigs = getFieldConfigs(toContext).filter(
    config => missingFields.includes(config.key)
  );

  const handleSubmit = () => {
    onConfirm(formData);
    setFormData({});
  };

  const renderField = (config: FieldConfig) => {
    const value = formData[config.key] ?? currentMetadata[config.key] ?? '';

    switch (config.type) {
      case 'select':
        return (
          <Select
            value={String(value)}
            onValueChange={(val) => setFormData(prev => ({ ...prev, [config.key]: val }))}
          >
            <SelectTrigger>
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
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value as number || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, [config.key]: Number(e.target.value) }))}
            placeholder={config.label}
          />
        );
      
      case 'color':
        return (
          <Input
            type="color"
            value={value as string || '#a78bfa'}
            onChange={(e) => setFormData(prev => ({ ...prev, [config.key]: e.target.value }))}
          />
        );
      
      default:
        return (
          <Input
            type="text"
            value={value as string || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, [config.key]: e.target.value }))}
            placeholder={config.label}
          />
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Transformer en {CONTEXT_TYPE_LABELS[toContext]}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Pour transformer "<strong>{itemName}</strong>" de {CONTEXT_TYPE_LABELS[fromContext]} en {CONTEXT_TYPE_LABELS[toContext]}, 
            veuillez compléter les champs suivants :
          </p>
          
          {fieldConfigs.map(config => (
            <div key={String(config.key)} className="space-y-2">
              <Label htmlFor={String(config.key)}>
                {config.label} {config.required && <span className="text-destructive">*</span>}
              </Label>
              {renderField(config)}
            </div>
          ))}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit}>Transformer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
