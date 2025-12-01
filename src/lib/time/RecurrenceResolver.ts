/**
 * RecurrenceResolver - Calculate occurrences for recurring events
 */

import { DateCalculator } from './DateCalculator';
import { TimeEvent, TimeOccurrence, DateRange, RecurrenceFrequency } from './types';

export class RecurrenceResolver {
  /**
   * Calculate all occurrences of an event within a date range
   */
  static getOccurrences(event: TimeEvent, range: DateRange): TimeOccurrence[] {
    // Non-recurring event
    if (!event.recurrence || event.recurrence.frequency === 'once') {
      if (DateCalculator.isDateInRange(event.startsAt, range)) {
        return [this.createOccurrence(event, event.startsAt)];
      }
      return [];
    }

    // Recurring event
    return this.calculateRecurringOccurrences(event, range);
  }

  /**
   * Get the next occurrence after a given date
   */
  static getNextOccurrence(event: TimeEvent, after: Date = new Date()): Date | null {
    if (!event.recurrence || event.recurrence.frequency === 'once') {
      return event.startsAt > after ? event.startsAt : null;
    }

    const { frequency, interval, endDate, maxOccurrences, daysOfWeek, dayOfMonth } = event.recurrence;
    
    // Handle custom recurrence separately (not implemented yet)
    if (frequency === 'custom') {
      return null; // TODO: Implement RRULE parsing
    }

    let currentDate = event.startsAt;
    let occurrenceCount = 0;

    // Safety limit to prevent infinite loops
    const maxIterations = 1000;
    let iterations = 0;

    while (iterations < maxIterations) {
      iterations++;
      
      // Check if we've reached the end conditions
      if (endDate && currentDate > endDate) return null;
      if (maxOccurrences && occurrenceCount >= maxOccurrences) return null;

      // For weekly recurrence with specific days
      if (frequency === 'weekly' && daysOfWeek && daysOfWeek.length > 0) {
        currentDate = this.getNextWeeklyOccurrence(currentDate, daysOfWeek, interval);
      } 
      // For monthly recurrence with specific day
      else if (frequency === 'monthly' && dayOfMonth) {
        currentDate = DateCalculator.addInterval(currentDate, frequency, interval);
        currentDate = DateCalculator.setDayOfMonth(currentDate, dayOfMonth);
      }
      // For other standard frequencies (daily, bi-weekly, yearly)
      else if (frequency === 'daily' || frequency === 'bi-weekly' || frequency === 'yearly') {
        currentDate = DateCalculator.addInterval(currentDate, frequency, interval);
      }
      else {
        // Shouldn't reach here
        break;
      }

      occurrenceCount++;

      if (currentDate > after) {
        return currentDate;
      }
    }

    return null;
  }

  /**
   * Calculate recurring occurrences within a date range
   */
  private static calculateRecurringOccurrences(event: TimeEvent, range: DateRange): TimeOccurrence[] {
    const occurrences: TimeOccurrence[] = [];
    const { frequency, interval, endDate, maxOccurrences, daysOfWeek, dayOfMonth } = event.recurrence!;

    // Handle custom recurrence separately (not implemented yet)
    if (frequency === 'custom') {
      return occurrences; // TODO: Implement RRULE parsing
    }

    let currentDate = event.startsAt;
    let occurrenceCount = 0;

    // Safety limit
    const maxIterations = 1000;
    let iterations = 0;

    while (iterations < maxIterations) {
      iterations++;

      // Check end conditions
      if (currentDate > range.end) break;
      if (endDate && currentDate > endDate) break;
      if (maxOccurrences && occurrenceCount >= maxOccurrences) break;

      // Add occurrence if within range
      if (currentDate >= range.start && currentDate <= range.end) {
        occurrences.push(this.createOccurrence(event, currentDate));
      }

      // Calculate next occurrence
      if (frequency === 'weekly' && daysOfWeek && daysOfWeek.length > 0) {
        currentDate = this.getNextWeeklyOccurrence(currentDate, daysOfWeek, interval);
      } 
      else if (frequency === 'monthly' && dayOfMonth) {
        currentDate = DateCalculator.addInterval(currentDate, frequency, interval);
        currentDate = DateCalculator.setDayOfMonth(currentDate, dayOfMonth);
      }
      else if (frequency === 'daily' || frequency === 'bi-weekly' || frequency === 'yearly') {
        currentDate = DateCalculator.addInterval(currentDate, frequency, interval);
      }
      else {
        // Shouldn't reach here, but break to be safe
        break;
      }

      occurrenceCount++;
    }

    return occurrences;
  }

  /**
   * Get next weekly occurrence considering specific days of week
   */
  private static getNextWeeklyOccurrence(currentDate: Date, daysOfWeek: number[], interval: number): Date {
    const currentDay = currentDate.getDay();
    
    // Find next valid day in current week
    const nextDayInWeek = daysOfWeek
      .filter(day => day > currentDay)
      .sort((a, b) => a - b)[0];

    if (nextDayInWeek !== undefined) {
      return DateCalculator.setDayOfWeek(currentDate, nextDayInWeek);
    }

    // Move to next week interval and use first day of week
    const nextWeek = DateCalculator.addInterval(currentDate, 'weekly', interval);
    const firstDay = Math.min(...daysOfWeek);
    return DateCalculator.setDayOfWeek(nextWeek, firstDay);
  }

  /**
   * Create an occurrence from an event and a date
   */
  private static createOccurrence(event: TimeEvent, startsAt: Date): TimeOccurrence {
    const endsAt = event.endsAt 
      ? DateCalculator.addMinutes(startsAt, event.duration)
      : DateCalculator.addMinutes(startsAt, event.duration);

    return {
      id: `${event.id}-${startsAt.getTime()}`,
      eventId: event.id,
      userId: event.userId,
      startsAt,
      endsAt,
      status: 'pending',
      createdAt: new Date()
    };
  }
}
