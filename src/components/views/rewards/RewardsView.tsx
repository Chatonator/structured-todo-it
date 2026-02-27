import React from 'react';
import { useRewardsViewData } from '@/hooks/view-data';
import ProgressOverview from '@/components/rewards/ProgressOverview';

import RewardsClaim from '@/components/rewards/RewardsClaim';
import SkillsPanel from '@/components/rewards/SkillsPanel';
import ClaimHistory from '@/components/rewards/ClaimHistory';
import { ViewLayout } from '@/components/layout/view';
import { Trophy } from 'lucide-react';

interface RewardsViewProps {
  className?: string;
}

const RewardsView: React.FC<RewardsViewProps> = ({ className }) => {
  const { data, state, actions } = useRewardsViewData();

  return (
    <ViewLayout
      header={{
        title: "Récompenses",
        subtitle: "Suivez votre progression et réclamez vos récompenses",
        icon: <Trophy className="w-5 h-5" />
      }}
      state={state.loading ? 'loading' : 'success'}
      loadingProps={{ variant: 'cards' }}
      className={className}
    >
      <div className="space-y-8 pb-20 md:pb-6">
        {/* 1. Points gauge + streak + weekly */}
        <ProgressOverview
          progress={data.progress}
          streakInfo={data.streakInfo}
        />

        {/* 2. Claim rewards */}
        <RewardsClaim
          rewards={data.rewards}
          pointsAvailable={data.pointsAvailable}
          onClaim={actions.claimReward}
          onCreate={actions.createReward}
          onDelete={actions.deleteReward}
          onReload={actions.reloadData}
        />

        {/* 3. Skills */}
        <SkillsPanel skills={data.skills} />

        {/* 4. Claim history */}
        <ClaimHistory claims={data.claimHistory} />
      </div>
    </ViewLayout>
  );
};

export default RewardsView;
