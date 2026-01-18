import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  /** Valeur principale à afficher */
  value: string | number;
  /** Label descriptif */
  label: string;
  /** Icône optionnelle */
  icon?: LucideIcon;
  /** Couleur de la valeur (utiliser les tokens du design system) */
  valueClassName?: string;
  /** Variante de layout */
  variant?: 'default' | 'compact' | 'horizontal';
  /** Trend/variation optionnelle */
  trend?: {
    value: number;
    label?: string;
  };
  /** Click handler optionnel */
  onClick?: () => void;
  className?: string;
}

/**
 * Carte de statistique réutilisable
 * Utilisée dans Home, Tasks, Projects pour afficher des métriques
 */
export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  icon: Icon,
  valueClassName,
  variant = 'default',
  trend,
  onClick,
  className
}) => {
  const isClickable = !!onClick;

  if (variant === 'compact') {
    return (
      <div 
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg bg-accent/50",
          isClickable && "cursor-pointer hover:bg-accent transition-colors",
          className
        )}
        onClick={onClick}
      >
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        <span className={cn("text-lg font-bold", valueClassName)}>{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <Card 
        className={cn(
          "bg-card border-border",
          isClickable && "cursor-pointer hover:shadow-md transition-shadow",
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-lg bg-accent">
                <Icon className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className={cn("text-xl font-bold", valueClassName)}>{value}</div>
            </div>
          </div>
          {trend && (
            <div className={cn(
              "text-xs font-medium",
              trend.value > 0 ? "text-system-success" : trend.value < 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              {trend.value > 0 ? '+' : ''}{trend.value}%
              {trend.label && <span className="text-muted-foreground ml-1">{trend.label}</span>}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default variant - vertical centered
  return (
    <Card 
      className={cn(
        "bg-card border-border",
        isClickable && "cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 text-center">
        {Icon && (
          <div className="flex justify-center mb-2">
            <Icon className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        <div className={cn("text-2xl font-bold", valueClassName)}>{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
        {trend && (
          <div className={cn(
            "text-xs font-medium mt-1",
            trend.value > 0 ? "text-system-success" : trend.value < 0 ? "text-destructive" : "text-muted-foreground"
          )}>
            {trend.value > 0 ? '↑' : trend.value < 0 ? '↓' : '→'} {Math.abs(trend.value)}%
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
