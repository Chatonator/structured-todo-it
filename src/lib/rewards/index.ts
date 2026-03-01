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

export { computeAllSkills } from './skillsEngine';
export type { SkillsEngineInput, SkillsEngineResult, RawSkillItem } from './skillsEngine';

export * from './constants';
