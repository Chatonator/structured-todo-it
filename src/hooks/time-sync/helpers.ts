/**
 * Time sync helper functions - Pure utilities for time event synchronization
 */

import { RecurrenceConfig, RecurrenceFrequency, TimeBlock } from '@/lib/time/types';
import { getPriorityLevel } from '@/lib/styling';
import { Habit } from '@/types/habit';
import { SubTaskCategory } from '@/types/task';

/** Format date as YYYY-MM-DD in local timezone (avoids UTC shift from toISOString) */
export const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Determine time block from HH:mm string */
export const getTimeBlockFromTime = (time: string): TimeBlock => {
  const hour = Number.parseInt(time.split(':')[0], 10);
  if (Number.isNaN(hour)) return 'morning';
  if (hour >= 18) return 'evening';
  if (hour >= 12) return 'afternoon';
  return 'morning';
};

/** Map task recurrence interval to TimeEvent RecurrenceConfig */
export const mapTaskRecurrence = (interval: string): RecurrenceConfig => {
  const frequencyMap: Record<string, RecurrenceFrequency> = {
    'daily': 'daily',
    'weekly': 'weekly',
    'bi-monthly': 'bi-weekly',
    'monthly': 'monthly'
  };
  return {
    frequency: frequencyMap[interval] || 'daily',
    interval: 1
  };
};

/** Map habit frequency to TimeEvent RecurrenceConfig */
export const mapHabitRecurrence = (habit: Habit): RecurrenceConfig => {
  switch (habit.frequency) {
    case 'daily':
      return { frequency: 'daily', interval: 1 };
    case 'weekly':
    case 'x-times-per-week':
      return {
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: habit.targetDays || undefined
      };
    case 'monthly':
      return {
        frequency: 'monthly',
        interval: 1,
        daysOfMonth: habit.targetDays || undefined
      };
    case 'x-times-per-month':
      return { frequency: 'monthly', interval: 1 };
    case 'custom':
      return {
        frequency: 'custom',
        interval: 1,
        daysOfWeek: habit.targetDays || undefined
      };
    default:
      return { frequency: 'daily', interval: 1 };
  }
};

/** Map subCategory to priority number */
export const getPriorityFromSubCategory = (subCategory: string): number => {
  const priorityMap: Record<string, number> = {
    'Le plus important': 4,
    'Important': 3,
    'Peut attendre': 2,
    "Si j'ai le temps": 1
  };
  return priorityMap[subCategory] || 0;
};

/** Schedule info interface shared across sync hooks */
export interface ScheduleInfo {
  date?: Date;
  time?: string;
  isRecurring?: boolean;
  recurrenceInterval?: string;
}
