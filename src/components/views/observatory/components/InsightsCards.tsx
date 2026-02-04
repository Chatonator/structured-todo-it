import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Ghost, 
  Zap, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { InsightsData, TabFilter } from '@/hooks/view-data/useObservatoryViewData';
import { formatDuration } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface InsightsCardsProps {
  insights: InsightsData;
  onFilterChange: (tab: TabFilter) => void;
}

interface InsightCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  icon: React.ReactNode;
  variant: 'danger' | 'success' | 'warning' | 'info';
  onClick?: () => void;
  clickable?: boolean;
}

const InsightCard: React.FC<InsightCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon,
  variant,
  onClick,
  clickable = false,
}) => {
  const variantStyles = {
    danger: 'border-destructive/30 bg-destructive/5',
    success: 'border-green-500/30 bg-green-500/5',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    info: 'border-primary/30 bg-primary/5',
  };

  const iconStyles = {
    danger: 'text-destructive',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    info: 'text-primary',
  };

  const TrendIcon = trend === undefined ? null : trend > 0 ? ArrowUp : trend < 0 ? ArrowDown : Minus;
  const trendColor = trend === undefined 
    ? '' 
    : trend > 0 
      ? 'text-green-500' 
      : trend < 0 
        ? 'text-destructive' 
        : 'text-muted-foreground';

  return (
    <Card 
      className={cn(
        'transition-all duration-200',
        variantStyles[variant],
        clickable && 'cursor-pointer hover:scale-[1.02] hover:shadow-md'
      )}
      onClick={clickable ? onClick : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
            {trend !== undefined && (
              <div className={cn('flex items-center gap-1 mt-2', trendColor)}>
                {TrendIcon && <TrendIcon className="w-3 h-3" />}
                <span className="text-xs font-medium">
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
                {trendLabel && (
                  <span className="text-xs text-muted-foreground ml-1">
                    {trendLabel}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className={cn('p-2 rounded-lg', `${variantStyles[variant]}`)}>
            <div className={iconStyles[variant]}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const InsightsCards: React.FC<InsightsCardsProps> = ({ insights, onFilterChange }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Zombie Tasks */}
      <InsightCard
        title="Tâches zombies"
        value={insights.zombieTasks.length}
        subtitle={insights.zombieTasks.length > 0 ? "Inactives > 7 jours" : "Tout va bien !"}
        icon={<Ghost className="w-5 h-5" />}
        variant={insights.zombieTasks.length > 5 ? 'danger' : insights.zombieTasks.length > 0 ? 'warning' : 'success'}
        onClick={() => onFilterChange('zombie')}
        clickable={insights.zombieTasks.length > 0}
      />

      {/* Velocity */}
      <InsightCard
        title="Vélocité"
        value={insights.velocityThisWeek}
        subtitle="Complétées cette semaine"
        trend={insights.velocityChange}
        trendLabel="vs sem. dernière"
        icon={<Zap className="w-5 h-5" />}
        variant={insights.velocityChange >= 0 ? 'success' : 'warning'}
      />

      {/* Time Recovered */}
      <InsightCard
        title="Temps récupéré"
        value={formatDuration(insights.timeRecovered)}
        subtitle="Total des tâches terminées"
        icon={<Clock className="w-5 h-5" />}
        variant="info"
      />

      {/* Health Ratio */}
      <InsightCard
        title="Ratio santé"
        value={`${insights.healthRatio}%`}
        subtitle={`${insights.completedThisWeek} complétées / ${insights.createdThisWeek} créées`}
        icon={insights.healthRatio >= 100 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
        variant={insights.healthRatio >= 100 ? 'success' : insights.healthRatio >= 50 ? 'warning' : 'danger'}
      />
    </div>
  );
};

export default InsightsCards;
