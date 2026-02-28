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
        subtitle: "Suivez votre progression et réclamez vos récompenses",
        icon: <Trophy className="w-5 h-5" />
      }}
      state={state.loading ? 'loading' : 'success'}
      loadingProps={{ variant: 'cards' }}
      className={className}
    >
      <div className="space-y-4 pb-20 md:pb-6">
        {/* Row 1: dynamic layout — rewards shrink to content, points can expand */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch">
          <div className="lg:w-[220px] lg:min-w-[180px] lg:shrink-0">
            <RefinementPanel
              tasks={data.unrefinedTasks}
              onRefine={actions.refinePoints}
              onReload={actions.reloadData}
            />
          </div>

          <div className="lg:w-[280px] lg:min-w-[240px] lg:shrink-0">
            <ProgressOverview
              progress={data.progress}
              streakInfo={data.streakInfo}
            />
          </div>

          <div className="lg:shrink-0 lg:w-fit lg:max-w-[560px]">
            <RewardsClaim
              rewards={data.rewards}
              pointsAvailable={data.pointsAvailable}
              onClaim={actions.claimReward}
              onCreate={actions.createReward}
              onDelete={actions.deleteReward}
              onReload={actions.reloadData}
            />
          </div>

          <div className="lg:w-[170px] lg:shrink-0">
            <SkillsPanel skills={data.skills} />
          </div>
        </div>

        {/* Row 2: Claim History full width */}
        <ClaimHistory claims={data.claimHistory} />
      </div>
    </ViewLayout>
  );
};

export default RewardsView;
