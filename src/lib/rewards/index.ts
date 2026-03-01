export {
  computeTaskMinutes,
  computeTaskPoints, // deprecated alias
  checkMicroTaskCap,
  checkStreakDay,
  computeWeeklySummary,
  isStreakEligible,
  computeSkillLevel,
  clampToGauge,
  computeCompensationBonus,
} from './engine';

export type {
  TaskRewardInput,
  TaskRewardResult,
  WeeklyTaskEntry,
  WeeklySummary,
} from './engine';

export * from './constants';
