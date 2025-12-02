/**
 * EventNormalizer - Convert different entity types to TimeEvents
 */

import { TimeEvent, TimeEventRow, RecurrenceConfig, RecurrenceFrequency } from './types';
import { Task, RecurrenceInterval } from '@/types/task';
import { Habit } from '@/types/habit';
import { CATEGORY_CONFIG } from '@/types/task';

export class EventNormalizer {
  /**
   * Convert Task to TimeEvent
   */
  static taskToTimeEvent(task: Task, userId: string): TimeEvent | null {
    // Skip tasks without schedule
    if (!task.scheduledDate && !task.startTime) return null;

    const startsAt = task.startTime || task.scheduledDate;
    if (!startsAt) return null;

    const duration = task.duration || task.estimatedTime || 30;
    const endsAt = new Date(startsAt.getTime() + duration * 60000);

    // Map recurrence
    let recurrence: RecurrenceConfig | undefined;
    if (task.isRecurring && task.recurrenceInterval) {
      recurrence = this.mapTaskRecurrence(task.recurrenceInterval);
    }

    return {
      id: `task-${task.id}`,
      entityType: 'task',
      entityId: task.id,
      userId,
      startsAt: new Date(startsAt),
      endsAt,
      duration,
      isAllDay: !task.scheduledTime,
      recurrence,
      title: task.name,
      color: CATEGORY_CONFIG[task.category]?.borderPattern || undefined,
      priority: task.subCategory ? this.mapPriority(task.subCategory) : undefined,
      status: task.isCompleted ? 'completed' : 'scheduled',
      completedAt: task.lastCompletedAt ? new Date(task.lastCompletedAt) : undefined,
      createdAt: task.createdAt,
      updatedAt: task.createdAt
    };
  }

  /**
   * Convert Habit to TimeEvent
   */
  static habitToTimeEvent(habit: Habit, userId: string): TimeEvent {
    // Habits are recurring events starting today
    const today = new Date();
    today.setHours(8, 0, 0, 0); // Default 8am

    return {
      id: `habit-${habit.id}`,
      entityType: 'habit',
      entityId: habit.id,
      userId,
      startsAt: today,
      duration: 15, // Default 15min for habits
      isAllDay: true,
      recurrence: this.mapHabitRecurrence(habit),
      title: habit.name,
      description: habit.description,
      color: habit.color || undefined,
      status: 'scheduled',
      createdAt: habit.createdAt,
      updatedAt: habit.createdAt
    };
  }

  /**
   * Convert database row to TimeEvent
   */
  static rowToTimeEvent(row: TimeEventRow): TimeEvent {
    return {
      id: row.id,
      entityType: row.entity_type as TimeEvent['entityType'],
      entityId: row.entity_id,
      userId: row.user_id,
      startsAt: new Date(row.starts_at),
      endsAt: row.ends_at ? new Date(row.ends_at) : undefined,
      duration: row.duration,
      isAllDay: row.is_all_day,
      timezone: row.timezone || undefined,
      recurrence: row.recurrence as RecurrenceConfig | undefined,
      title: row.title,
      description: row.description || undefined,
      color: row.color || undefined,
      priority: row.priority || undefined,
      status: row.status as TimeEvent['status'],
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  /**
   * Convert TimeEvent to database row
   */
  static timeEventToRow(event: TimeEvent): Partial<TimeEventRow> {
    return {
      id: event.id,
      user_id: event.userId,
      entity_type: event.entityType,
      entity_id: event.entityId,
      starts_at: event.startsAt.toISOString(),
      ends_at: event.endsAt?.toISOString() || null,
      duration: event.duration,
      is_all_day: event.isAllDay,
      timezone: event.timezone || null,
      recurrence: event.recurrence as any,
      title: event.title,
      description: event.description || null,
      color: event.color || null,
      priority: event.priority || null,
      status: event.status,
      completed_at: event.completedAt?.toISOString() || null
    };
  }

  // Helper methods

  private static mapTaskRecurrence(interval: RecurrenceInterval): RecurrenceConfig {
    const frequencyMap: Record<RecurrenceInterval, RecurrenceFrequency> = {
      'daily': 'daily',
      'weekly': 'weekly',
      'bi-monthly': 'bi-weekly',
      'monthly': 'monthly'
    };

    return {
      frequency: frequencyMap[interval] || 'daily',
      interval: 1
    };
  }

  private static mapHabitRecurrence(habit: Habit): RecurrenceConfig {
    switch (habit.frequency) {
      case 'daily':
        return { frequency: 'daily', interval: 1 };
      
      case 'weekly':
        return {
          frequency: 'weekly',
          interval: 1,
          daysOfWeek: habit.targetDays
        };
      
      case 'x-times-per-week':
        return {
          frequency: 'weekly',
          interval: 1,
          daysOfWeek: habit.targetDays
        };
      
      case 'custom':
        return {
          frequency: 'custom',
          interval: 1,
          daysOfWeek: habit.targetDays
        };
      
      default:
        return { frequency: 'daily', interval: 1 };
    }
  }

  private static mapPriority(subCategory: string): number {
    const priorityMap: Record<string, number> = {
      'Le plus important': 4,
      'Important': 3,
      'Peut attendre': 2,
      'Si j\'ai le temps': 1
    };
    return priorityMap[subCategory] || 2;
  }
}
