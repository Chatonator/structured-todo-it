import React from 'react';
import { RefreshCw } from 'lucide-react';
import { RecurrenceInterval } from '@/types/task';

interface RecurringTaskBadgeProps {
  recurrenceInterval: RecurrenceInterval;
  className?: string;
}

const INTERVAL_LABELS = {
  daily: 'Quotidien',
  weekly: 'Hebdo',
  'bi-monthly': 'Bi-mensuel',
  monthly: 'Mensuel'
};

export const RecurringTaskBadge: React.FC<RecurringTaskBadgeProps> = ({ 
  recurrenceInterval, 
  className = '' 
}) => {
  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 ${className}`}>
      <RefreshCw className="w-3 h-3" />
      <span>{INTERVAL_LABELS[recurrenceInterval] || recurrenceInterval}</span>
    </div>
  );
};