import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGamification } from '@/hooks/useGamification';
import { useAchievements } from '@/hooks/useAchievements';
import { useChallenges } from '@/hooks/useChallenges';
import ProgressOverview from './ProgressOverview';
import AchievementsList from './AchievementsList';
import ChallengesList from './ChallengesList';
import RecentActivity from './RecentActivity';
import LevelUpAnimation from './LevelUpAnimation';
import AchievementUnlockedAnimation from './AchievementUnlockedAnimation';

const RewardsView: React.FC = () => {
  const { progress, loading: progressLoading, levelUpAnimation, claimDailyBonus, getProgressPercentage } = useGamification();
  const { achievements, loading: achLoading, unlockedAnimation } = useAchievements();
  const { dailyChallenges, weeklyChallenges, loading: challengesLoading } = useChallenges();

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
      {unlockedAnimation && <AchievementUnlockedAnimation achievement={unlockedAnimation} />}

      <ProgressOverview 
        progress={progress}
        progressPercentage={getProgressPercentage()}
        onClaimDailyBonus={claimDailyBonus}
      />

      <Tabs defaultValue="achievements" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="challenges">Défis</TabsTrigger>
          <TabsTrigger value="activity">Activité</TabsTrigger>
        </TabsList>

        <TabsContent value="achievements" className="space-y-4">
          <AchievementsList achievements={achievements} loading={achLoading} />
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <ChallengesList 
            dailyChallenges={dailyChallenges}
            weeklyChallenges={weeklyChallenges}
            loading={challengesLoading}
          />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <RecentActivity userId={progress?.userId || ''} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RewardsView;
