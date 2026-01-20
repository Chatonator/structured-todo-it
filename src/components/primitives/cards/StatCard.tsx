import React, { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  /** Valeur principale à afficher */
  value: string | number;
  /** Label descriptif */
  label: string;
  /** Icône optionnelle - peut être un LucideIcon ou un ReactNode */
  icon?: ReactNode;
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
  /** Sous-titre optionnel */
  subtitle?: string;
}

/**
 * Carte de statistique réutilisable
 * Utilisée dans Home, Tasks, Projects pour afficher des métriques
 */
export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  icon,
  valueClassName,
  variant = 'default',
  trend,
  onClick,
  className,
  subtitle
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
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className={cn("text-lg font-bold", valueClassName)}>{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
        {subtitle && <span className="text-xs text-muted-foreground">({subtitle})</span>}
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
            {icon && (
              <div className="p-2 rounded-lg bg-accent">
                {icon}
              </div>
            )}
            <div>
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className={cn("text-xl font-bold", valueClassName)}>{value}</div>
              {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
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
        {icon && (
          <div className="flex justify-center mb-2">
            {icon}
          </div>
        )}
        <div className={cn("text-2xl font-bold", valueClassName)}>{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
        {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
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
