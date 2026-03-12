import React from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WidgetConfig, WidgetId } from '@/types/widget';
import { cn } from '@/lib/utils';

interface DashboardControlsProps {
  widgets: WidgetConfig[];
  onToggle: (id: WidgetId) => void;
  onReset: () => void;
}

const DashboardControls: React.FC<DashboardControlsProps> = ({ widgets, onToggle, onReset }) => {
  return (
    <Card className="mb-6 border-dashed">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Personnaliser le dashboard
            </CardTitle>
            <CardDescription className="mt-1">
              Activez, masquez et deplacez les blocs pour composer votre page d’accueil ideale.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={onReset}>
            <RotateCcw className="h-4 w-4" />
            Reinitialiser
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {widgets.map((widget) => (
            <Button
              key={widget.id}
              type="button"
              variant={widget.visible ? 'default' : 'outline'}
              size="sm"
              className={cn('gap-2 rounded-full', !widget.visible && 'text-muted-foreground')}
              onClick={() => onToggle(widget.id)}
            >
              <span>{widget.icon}</span>
              {widget.label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Astuce : gardez ce mode ouvert puis glissez les widgets pour changer leur ordre. Les blocs masques restent disponibles ici.
        </p>
      </CardContent>
    </Card>
  );
};

export default DashboardControls;
