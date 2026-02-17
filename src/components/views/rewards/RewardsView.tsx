import React from 'react';
import { useRewardsViewData } from '@/hooks/view-data';
import ProgressOverview from '@/components/rewards/ProgressOverview';
import RecentActivity from '@/components/rewards/RecentActivity';
import { ViewLayout } from '@/components/layout/view';
import { Trophy } from 'lucide-react';

interface RewardsViewProps {
  className?: string;
}

const RewardsView: React.FC<RewardsViewProps> = ({ className }) => {
  const { data, state } = useRewardsViewData();

  return (
    <ViewLayout
      header={{
        title: "Récompenses",
        subtitle: "Suivez votre progression et vos accomplissements",
        icon: <Trophy className="w-5 h-5" />
      }}
      state={state.loading ? 'loading' : 'success'}
      loadingProps={{ variant: 'cards' }}
      className={className}
    >
      <div className="space-y-6 pb-20 md:pb-6">
        <ProgressOverview 
          progress={data.progress}
          weeklySummary={data.weeklySummary}
          streakInfo={data.streakInfo}
          dailyMicroCount={data.dailyMicroCount}
        />

        <RecentActivity userId={data.userId || ''} />
      </div>
    </ViewLayout>
  );
};

export default RewardsView;
