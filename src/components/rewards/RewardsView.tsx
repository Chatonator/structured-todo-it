import React from 'react';
import { useGamification } from '@/hooks/useGamification';
import ProgressOverview from './ProgressOverview';
import RecentActivity from './RecentActivity';
import LevelUpAnimation from './LevelUpAnimation';
import { ViewLayout } from '@/components/layout/view';
import { Trophy } from 'lucide-react';

const RewardsView: React.FC = () => {
  const { progress, loading: progressLoading, levelUpAnimation, getProgressPercentage } = useGamification();

  return (
    <ViewLayout
      header={{
        title: "Récompenses",
        subtitle: "Suivez votre progression et vos accomplissements",
        icon: <Trophy className="w-5 h-5" />
      }}
      state={progressLoading ? 'loading' : 'success'}
      loadingProps={{ variant: 'cards' }}
    >
      <div className="space-y-6 pb-20 md:pb-6">
        {levelUpAnimation && <LevelUpAnimation level={progress?.currentLevel || 1} />}

        <ProgressOverview 
          progress={progress}
          progressPercentage={getProgressPercentage()}
        />

        <RecentActivity userId={progress?.userId || ''} />
      </div>
    </ViewLayout>
  );
};

export default RewardsView;
