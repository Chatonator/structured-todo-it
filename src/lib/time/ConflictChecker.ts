/**
 * ConflictChecker - Detect scheduling conflicts
 */

import { DateCalculator } from './DateCalculator';
import { TimeEvent, ConflictResult, DateRange, TimeSlot } from './types';

export class ConflictChecker {
  /**
   * Check if a new event conflicts with existing events
   */
  static checkConflicts(newEvent: TimeEvent, existingEvents: TimeEvent[]): ConflictResult[] {
    const conflicts: ConflictResult[] = [];
    
    const newRange: DateRange = {
      start: newEvent.startsAt,
      end: newEvent.endsAt || DateCalculator.addMinutes(newEvent.startsAt, newEvent.duration)
    };

    for (const existing of existingEvents) {
      // Skip if same event
      if (existing.id === newEvent.id) continue;
      
      // Skip completed or cancelled events
      if (existing.status === 'completed' || existing.status === 'cancelled') continue;

      const existingRange: DateRange = {
        start: existing.startsAt,
        end: existing.endsAt || DateCalculator.addMinutes(existing.startsAt, existing.duration)
      };

      if (DateCalculator.rangesOverlap(newRange, existingRange)) {
        const overlapMinutes = DateCalculator.calculateOverlap(newRange, existingRange);
        conflicts.push({
          hasConflict: true,
          conflictingEvent: existing,
          overlapMinutes
        });
      }
    }

    return conflicts;
  }

  /**
   * Check if there's any conflict
   */
  static hasAnyConflict(newEvent: TimeEvent, existingEvents: TimeEvent[]): boolean {
    const conflicts = this.checkConflicts(newEvent, existingEvents);
    return conflicts.length > 0;
  }

  /**
   * Find free time slots in a date range
   */
  static findFreeSlots(
    range: DateRange,
    events: TimeEvent[],
    minDuration: number
  ): TimeSlot[] {
    const freeSlots: TimeSlot[] = [];

    // Sort events by start time
    const sortedEvents = events
      .filter(e => e.status !== 'cancelled')
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

    let currentTime = range.start;

    for (const event of sortedEvents) {
      const eventStart = event.startsAt;
      const eventEnd = event.endsAt || DateCalculator.addMinutes(event.startsAt, event.duration);

      // Skip events outside range
      if (eventEnd < range.start) continue;
      if (eventStart > range.end) break;

      // Check if there's a free slot before this event
      if (eventStart > currentTime) {
        const slotDuration = DateCalculator.getDuration(currentTime, eventStart);
        if (slotDuration >= minDuration) {
          freeSlots.push({
            start: currentTime,
            end: eventStart,
            duration: slotDuration
          });
        }
      }

      // Move current time to after this event
      if (eventEnd > currentTime) {
        currentTime = eventEnd;
      }
    }

    // Check if there's a free slot at the end
    if (currentTime < range.end) {
      const slotDuration = DateCalculator.getDuration(currentTime, range.end);
      if (slotDuration >= minDuration) {
        freeSlots.push({
          start: currentTime,
          end: range.end,
          duration: slotDuration
        });
      }
    }

    return freeSlots;
  }

  /**
   * Get total busy time in minutes for a date range
   */
  static getTotalBusyTime(range: DateRange, events: TimeEvent[]): number {
    let totalMinutes = 0;

    for (const event of events) {
      if (event.status === 'cancelled') continue;

      const eventRange: DateRange = {
        start: event.startsAt,
        end: event.endsAt || DateCalculator.addMinutes(event.startsAt, event.duration)
      };

      if (DateCalculator.rangesOverlap(range, eventRange)) {
        totalMinutes += DateCalculator.calculateOverlap(range, eventRange);
      }
    }

    return totalMinutes;
  }
}
