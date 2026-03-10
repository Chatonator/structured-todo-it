import { DAYS_OF_WEEK, Habit } from '@/types/habit';

export function getHabitFrequencyLabel(habit: Habit): string {
  switch (habit.frequency) {
    case 'daily':
      return 'Quotidien';
    case 'weekly':
      return 'Hebdo';
    case 'x-times-per-week':
      return `${habit.timesPerWeek}x/sem`;
    case 'monthly':
      if (habit.targetDays && habit.targetDays.length > 0) {
        if (habit.targetDays.length === 1) {
          return `Le ${habit.targetDays[0]}`;
        }
        return `${habit.targetDays.length} jours/mois`;
      }
      return 'Mensuel';
    case 'x-times-per-month':
      return `${habit.timesPerMonth || 1}x/mois`;
    case 'custom':
      if (habit.targetDays && habit.targetDays.length > 0) {
        if (habit.targetDays.length === 5 && !habit.targetDays.includes(5) && !habit.targetDays.includes(6)) {
          return 'Semaine';
        }
        if (habit.targetDays.length === 2 && habit.targetDays.includes(5) && habit.targetDays.includes(6)) {
          return 'Weekend';
        }
        return habit.targetDays.map(day => DAYS_OF_WEEK[day]?.short || '').join('');
      }
      return 'Personnalisé';
    default:
      return '';
  }
}
