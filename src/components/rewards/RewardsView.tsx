import React from 'react';
import { useGamification } from '@/hooks/useGamification';
import ProgressOverview from './ProgressOverview';
import RecentActivity from './RecentActivity';
import LevelUpAnimation from './LevelUpAnimation';

const RewardsView: React.FC = () => {
  const { progress, loading: progressLoading, levelUpAnimation, getProgressPercentage } = useGamification();

  if (progressLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {levelUpAnimation && <LevelUpAnimation level={progress?.currentLevel || 1} />}

      <ProgressOverview 
        progress={progress}
        progressPercentage={getProgressPercentage()}
      />

      <RecentActivity userId={progress?.userId || ''} />
    </div>
  );
};

export default RewardsView;
