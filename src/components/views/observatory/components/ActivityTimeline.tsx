import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Activity, 
  Plus, 
  CheckCircle2, 
  RotateCcw,
  Clock
} from 'lucide-react';
import { ActivityItem } from '@/hooks/view-data/useObservatoryViewData';
import { formatRelativeTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface ActivityTimelineProps {
  activities: ActivityItem[];
}

const getActivityConfig = (type: ActivityItem['type']) => {
  switch (type) {
    case 'created':
      return {
        icon: Plus,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        label: 'Créée',
      };
    case 'completed':
      return {
        icon: CheckCircle2,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        label: 'Terminée',
      };
    case 'restored':
      return {
        icon: RotateCcw,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        label: 'Restaurée',
      };
    default:
      return {
        icon: Activity,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
        label: 'Modifiée',
      };
  }
};

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities }) => {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Activité récente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune activité récente</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Activité récente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {activities.slice(0, 15).map((activity, index) => {
            const config = getActivityConfig(activity.type);
            const Icon = config.icon;
            
            return (
              <div 
                key={activity.id} 
                className="flex items-start gap-3 group"
              >
                {/* Icon */}
                <div className={cn(
                  "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
                  config.bgColor
                )}>
                  <Icon className={cn("w-3.5 h-3.5", config.color)} />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-medium", config.color)}>
                      {config.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm truncate mt-0.5">
                    {activity.taskName}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        
        {activities.length > 15 && (
          <div className="mt-4 pt-3 border-t text-center">
            <span className="text-xs text-muted-foreground">
              +{activities.length - 15} autres activités
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityTimeline;
