import React from 'react';
import { useRewardsViewData } from '@/hooks/view-data';
import ProgressOverview from '@/components/rewards/ProgressOverview';
import RefinementPanel from '@/components/rewards/RefinementPanel';
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
        subtitle: "Suivez votre temps guilty-free et réclamez vos récompenses",
        icon: <Trophy className="w-5 h-5" />
      }}
      state={state.loading ? 'loading' : 'success'}
      loadingProps={{ variant: 'cards' }}
      className={className}
    >
      <div className="space-y-4 pb-20 md:pb-6">
        {/* Row 1: dynamic layout — rewards shrink to content, points can expand */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr_auto_170px] gap-4 items-stretch">
          <RefinementPanel
            tasks={data.unrefinedTasks}
            onRefine={actions.refinePoints}
            onReload={actions.reloadData}
          />
          <ProgressOverview
            progress={data.progress}
            streakInfo={data.streakInfo}
          />
          <RewardsClaim
            rewards={data.rewards}
            minutesAvailable={data.minutesAvailable}
            onClaim={actions.claimReward}
            onCreate={actions.createReward}
            onDelete={actions.deleteReward}
            onReload={actions.reloadData}
          />
          <SkillsPanel skills={data.skills} />
        </div>

        {/* Row 2: Claim History full width */}
        <ClaimHistory claims={data.claimHistory} />
      </div>
    </ViewLayout>
  );
};

export default RewardsView;
