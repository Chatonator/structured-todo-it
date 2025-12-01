/**
 * TimeEngine - Core temporal calculation engine
 * Single source of truth for all time-related operations
 */

import { DateCalculator } from './DateCalculator';
import { RecurrenceResolver } from './RecurrenceResolver';
import { ConflictChecker } from './ConflictChecker';
import { 
  TimeEvent, 
  TimeOccurrence, 
  DateRange, 
  ConflictResult, 
  TimeSlot,
  TimeEventType 
} from './types';

export class TimeEngine {
  private dateCalculator: DateCalculator;
  private recurrenceResolver: RecurrenceResolver;
  private conflictChecker: ConflictChecker;

  constructor() {
    this.dateCalculator = new DateCalculator();
    this.recurrenceResolver = new RecurrenceResolver();
    this.conflictChecker = new ConflictChecker();
  }

  /**
   * Calculate occurrences of an event within a date range
   */
  getOccurrences(event: TimeEvent, range: DateRange): TimeOccurrence[] {
    return RecurrenceResolver.getOccurrences(event, range);
  }

  /**
   * Calculate occurrences for multiple events
   */
  getMultipleOccurrences(events: TimeEvent[], range: DateRange): TimeOccurrence[] {
    const allOccurrences: TimeOccurrence[] = [];
    
    for (const event of events) {
      const occurrences = this.getOccurrences(event, range);
      allOccurrences.push(...occurrences);
    }

    // Sort by start time
    return allOccurrences.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  }

  /**
   * Get the next occurrence of an event
   */
  getNextOccurrence(event: TimeEvent, after?: Date): Date | null {
    return RecurrenceResolver.getNextOccurrence(event, after);
  }

  /**
   * Check for scheduling conflicts
   */
  checkConflicts(newEvent: TimeEvent, existingEvents: TimeEvent[]): ConflictResult[] {
    return ConflictChecker.checkConflicts(newEvent, existingEvents);
  }

  /**
   * Check if there's any conflict
   */
  hasAnyConflict(newEvent: TimeEvent, existingEvents: TimeEvent[]): boolean {
    return ConflictChecker.hasAnyConflict(newEvent, existingEvents);
  }

  /**
   * Find free time slots
   */
  findFreeSlots(range: DateRange, events: TimeEvent[], minDuration: number): TimeSlot[] {
    return ConflictChecker.findFreeSlots(range, events, minDuration);
  }

  /**
   * Get total busy time in a range
   */
  getTotalBusyTime(range: DateRange, events: TimeEvent[]): number {
    return ConflictChecker.getTotalBusyTime(range, events);
  }

  /**
   * Get total free time in a range
   */
  getTotalFreeTime(range: DateRange, events: TimeEvent[]): number {
    const totalTime = DateCalculator.getDuration(range.start, range.end);
    const busyTime = this.getTotalBusyTime(range, events);
    return totalTime - busyTime;
  }

  /**
   * Check if two date ranges overlap
   */
  rangesOverlap(range1: DateRange, range2: DateRange): boolean {
    return DateCalculator.rangesOverlap(range1, range2);
  }

  /**
   * Calculate overlap duration
   */
  calculateOverlap(range1: DateRange, range2: DateRange): number {
    return DateCalculator.calculateOverlap(range1, range2);
  }

  /**
   * Check if a date is within a range
   */
  isDateInRange(date: Date, range: DateRange): boolean {
    return DateCalculator.isDateInRange(date, range);
  }

  /**
   * Get day bounds (start and end of day)
   */
  getDayBounds(date: Date): DateRange {
    return DateCalculator.getDayBounds(date);
  }

  /**
   * Add minutes to a date
   */
  addMinutes(date: Date, minutes: number): Date {
    return DateCalculator.addMinutes(date, minutes);
  }

  /**
   * Get duration between two dates
   */
  getDuration(start: Date, end: Date): number {
    return DateCalculator.getDuration(start, end);
  }

  /**
   * Parse ISO string to Date
   */
  parseDate(isoString: string): Date {
    return DateCalculator.parseISOString(isoString);
  }

  /**
   * Format Date to ISO string
   */
  formatDate(date: Date): string {
    return DateCalculator.toISOString(date);
  }
}
