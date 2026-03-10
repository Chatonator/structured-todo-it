import { format, isPast, isToday } from 'date-fns';
import { TimeEvent, TimeBlock, TIME_BLOCKS } from '@/lib/time/types';
import { Task } from '@/types/task';

export interface TimeEventRow {
  id: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  starts_at: string;
  ends_at: string | null;
  duration: number;
  is_all_day?: boolean | null;
  title: string;
  description?: string | null;
  color?: string | null;
  status: string;
  time_block?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const formatTimelineDate = (date: Date): string => format(date, 'yyyy-MM-dd');

export const getBlockStartHour = (block: TimeBlock): number => TIME_BLOCKS[block].startHour;

export const buildClockTime = (hour: number, minute = 0): string => {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

export const withScheduledDuration = (task: Task, duration?: number): Task => {
  if (!duration) {
    return task;
  }

  return {
    ...task,
    duration,
    estimatedTime: duration,
  };
};

export const mapTimeEventRow = (row: TimeEventRow): TimeEvent => ({
  id: row.id,
  entityType: row.entity_type as TimeEvent['entityType'],
  entityId: row.entity_id,
  userId: row.user_id,
  startsAt: new Date(row.starts_at),
  endsAt: row.ends_at ? new Date(row.ends_at) : new Date(new Date(row.starts_at).getTime() + row.duration * 60 * 1000),
  duration: row.duration,
  isAllDay: row.is_all_day || false,
  title: row.title,
  description: row.description || undefined,
  color: row.color || undefined,
  status: row.status as TimeEvent['status'],
  timeBlock: (row.time_block as TimeBlock) || undefined,
  createdAt: new Date(row.created_at || ''),
  updatedAt: new Date(row.updated_at || ''),
});

export const isOverdueTaskEvent = (event: TimeEvent): boolean => {
  return isPast(event.startsAt)
    && !isToday(event.startsAt)
    && event.status !== 'completed'
    && event.status !== 'cancelled'
    && event.entityType === 'task';
};

export const buildEventRange = (date: Date, hour: number, minute: number, duration: number) => {
  const startsAt = new Date(date);
  startsAt.setHours(hour, minute, 0, 0);

  return {
    startsAt,
    endsAt: new Date(startsAt.getTime() + duration * 60 * 1000),
  };
};

export const buildBlockEventRange = (date: Date, block: TimeBlock, duration: number) => {
  const hour = getBlockStartHour(block);
  return buildEventRange(date, hour, 0, duration);
};

export const createConflictTestEvent = (
  userId: string,
  date: Date,
  hour: number,
  minute: number,
  duration: number
): TimeEvent => {
  const { startsAt, endsAt } = buildEventRange(date, hour, minute, duration);

  return {
    id: 'test',
    entityType: 'task',
    entityId: 'test',
    userId,
    startsAt,
    endsAt,
    duration,
    isAllDay: false,
    title: 'Test',
    status: 'scheduled',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};
