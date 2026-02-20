/**
 * Unified Time Management System
 * Export all public APIs
 */

export { TimeEngine } from './TimeEngine';
export { DateCalculator } from './DateCalculator';
export { RecurrenceResolver } from './RecurrenceResolver';
export { ConflictChecker } from './ConflictChecker';
export { EventRegistry } from './EventRegistry';
export { EventNormalizer } from './EventNormalizer';
export {
  shouldCreateBreak,
  calculateBreakDuration,
  getEffectiveWorkDuration,
  getSuggestionForDuration,
  buildBreakTitle,
  getCumulativeWorkWithoutBreak,
  RECOVERY_SUGGESTIONS,
  BREAK_THRESHOLDS,
  LONG_TASK_THRESHOLD,
  ACCUMULATION_THRESHOLD,
} from './RecoveryEngine';

export type {
  TimeEvent,
  TimeOccurrence,
  TimeEventType,
  RecurrenceFrequency,
  RecurrenceConfig,
  DateRange,
  ConflictResult,
  TimeSlot,
  TimeEventRow,
  TimeOccurrenceRow
} from './types';
