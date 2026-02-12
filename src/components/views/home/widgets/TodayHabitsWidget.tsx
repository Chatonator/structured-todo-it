import React from 'react';
import HomeHabitsSection from '../HomeHabitsSection';
import { useHomeViewData } from '@/hooks/view-data';
import { useApp } from '@/contexts/AppContext';

const TodayHabitsWidget: React.FC = () => {
  const { setCurrentView } = useApp();
  const { data, actions } = useHomeViewData();

  return (
    <HomeHabitsSection
      habits={data.todayHabits}
      completions={data.habitCompletions}
      streaks={data.habitStreaks}
      onToggle={(habitId) => actions.toggleHabitCompletion(habitId)}
      onViewAll={() => setCurrentView('habits')}
      loading={data.habitsLoading}
    />
  );
};

export default TodayHabitsWidget;
