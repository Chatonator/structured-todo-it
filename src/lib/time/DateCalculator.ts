/**
 * DateCalculator - Utility functions for date calculations
 */

import { 
  addDays, 
  addWeeks, 
  addMonths, 
  addYears,
  startOfDay,
  endOfDay,
  isWithinInterval,
  differenceInMinutes,
  setDay,
  setDate as setDayOfMonth,
  isSameDay,
  parseISO,
  formatISO
} from 'date-fns';
import { DateRange } from './types';

export class DateCalculator {
  /**
   * Check if two date ranges overlap
   */
  static rangesOverlap(range1: DateRange, range2: DateRange): boolean {
    return range1.start < range2.end && range1.end > range2.start;
  }

  /**
   * Calculate overlap duration in minutes
   */
  static calculateOverlap(range1: DateRange, range2: DateRange): number {
    if (!this.rangesOverlap(range1, range2)) return 0;
    
    const overlapStart = range1.start > range2.start ? range1.start : range2.start;
    const overlapEnd = range1.end < range2.end ? range1.end : range2.end;
    
    return differenceInMinutes(overlapEnd, overlapStart);
  }

  /**
   * Check if a date is within a range
   */
  static isDateInRange(date: Date, range: DateRange): boolean {
    return isWithinInterval(date, { start: range.start, end: range.end });
  }

  /**
   * Get the start and end of a day
   */
  static getDayBounds(date: Date): DateRange {
    return {
      start: startOfDay(date),
      end: endOfDay(date)
    };
  }

  /**
   * Add duration to a date based on frequency
   */
  static addInterval(
    date: Date,
    frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'yearly',
    interval: number = 1
  ): Date {
    switch (frequency) {
      case 'daily':
        return addDays(date, interval);
      case 'weekly':
        return addWeeks(date, interval);
      case 'bi-weekly':
        return addWeeks(date, interval * 2);
      case 'monthly':
        return addMonths(date, interval);
      case 'yearly':
        return addYears(date, interval);
      default:
        return date;
    }
  }

  /**
   * Set specific day of week (0 = Sunday, 6 = Saturday)
   */
  static setDayOfWeek(date: Date, dayOfWeek: number): Date {
    return setDay(date, dayOfWeek);
  }

  /**
   * Set specific day of month (1-31)
   */
  static setDayOfMonth(date: Date, dayOfMonth: number): Date {
    return setDayOfMonth(date, dayOfMonth);
  }

  /**
   * Check if two dates are on the same day
   */
  static isSameDay(date1: Date, date2: Date): boolean {
    return isSameDay(date1, date2);
  }

  /**
   * Parse ISO string to Date
   */
  static parseISOString(isoString: string): Date {
    return parseISO(isoString);
  }

  /**
   * Format Date to ISO string
   */
  static toISOString(date: Date): string {
    return formatISO(date);
  }

  /**
   * Add minutes to a date
   */
  static addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60000);
  }

  /**
   * Get duration in minutes between two dates
   */
  static getDuration(start: Date, end: Date): number {
    return differenceInMinutes(end, start);
  }
}
