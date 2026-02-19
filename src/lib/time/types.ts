/**
 * Unified Time Management System - Type Definitions
 * Single source of truth for all temporal data types
 */

// Type of temporal event
export type TimeEventType = 'task' | 'habit' | 'challenge' | 'reminder' | 'external' | 'recovery';

// Time blocks for day planning
export type TimeBlock = 'morning' | 'afternoon' | 'evening';

// Time block configuration
export const TIME_BLOCKS = {
  morning: { label: 'Matin', icon: '🌅', startHour: 6, endHour: 12 },
  afternoon: { label: 'Après-midi', icon: '☀️', startHour: 12, endHour: 18 },
  evening: { label: 'Soir', icon: '🌙', startHour: 18, endHour: 22 }
} as const;

// Day planning configuration
export interface DayPlanningConfig {
  id: string;
  userId: string;
  date: Date;
  quotaMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

// Standardized recurrence frequencies
export type RecurrenceFrequency = 
  | 'once'           // One-time event
  | 'daily'          // Every day
  | 'weekly'         // Every week
  | 'bi-weekly'      // Every 2 weeks
  | 'monthly'        // Every month
  | 'yearly'         // Every year
  | 'custom';        // Custom pattern (RRULE)

// Recurrence configuration
export interface RecurrenceConfig {
  frequency: RecurrenceFrequency;
  interval: number;                  // e.g., every 2 days
  daysOfWeek?: number[];            // 0-6 for weekly (0 = Sunday)
  dayOfMonth?: number;              // 1-31 for monthly (single day)
  daysOfMonth?: number[];           // 1-31 for monthly (multiple days)
  endDate?: Date;
  maxOccurrences?: number;
  rrule?: string;                   // iCal format for custom
}

// Normalized temporal event
export interface TimeEvent {
  id: string;
  entityType: TimeEventType;
  entityId: string;                 // ID of source task/habit/challenge
  userId: string;
  
  // Timing
  startsAt: Date;
  endsAt?: Date;
  duration: number;                 // In minutes
  isAllDay: boolean;
  timezone?: string;
  
  // Recurrence
  recurrence?: RecurrenceConfig;
  
  // Metadata
  title: string;
  description?: string;
  color?: string;
  priority?: number;
  
  // Status
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'missed';
  completedAt?: Date;
  
  // Block-based planning
  timeBlock?: TimeBlock;
  
  // Tracking
  createdAt: Date;
  updatedAt: Date;
}

// Calculated occurrence (instance of a recurring event)
export interface TimeOccurrence {
  id: string;
  eventId: string;
  userId: string;
  startsAt: Date;
  endsAt: Date;
  status: 'pending' | 'completed' | 'skipped' | 'missed';
  completedAt?: Date;
  createdAt: Date;
}

// Date range for queries
export interface DateRange {
  start: Date;
  end: Date;
}

// Conflict detection result
export interface ConflictResult {
  hasConflict: boolean;
  conflictingEvent?: TimeEvent;
  overlapMinutes?: number;
}

// Free time slot
export interface TimeSlot {
  start: Date;
  end: Date;
  duration: number;  // In minutes
}

// Database row types (match Supabase schema)
export interface TimeEventRow {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  starts_at: string;
  ends_at: string | null;
  duration: number;
  is_all_day: boolean;
  timezone: string | null;
  recurrence: any | null;
  title: string;
  description: string | null;
  color: string | null;
  priority: number | null;
  status: string;
  completed_at: string | null;
  time_block: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimeOccurrenceRow {
  id: string;
  event_id: string;
  user_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  completed_at: string | null;
  created_at: string;
}
