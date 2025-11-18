import React from 'react';
import { Card } from '@/components/ui/card';
import { UserAchievement, ACHIEVEMENT_TIERS } from '@/types/gamification';
import { Trophy, Lock } from 'lucide-react';

interface AchievementsListProps {
  achievements: UserAchievement[];
  loading: boolean;
}

const AchievementsList: React.FC<AchievementsListProps> = ({ achievements, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  const unlockedAchievements = achievements.filter(a => a.isUnlocked);
  const lockedAchievements = achievements.filter(a => !a.isUnlocked);

  return (
    <div className="space-y-6">
      {unlockedAchievements.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Débloqués ({unlockedAchievements.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {unlockedAchievements.map(achievement => (
              <Card 
                key={achievement.id}
                className="p-4 text-center space-y-2 bg-gradient-to-br from-reward-light to-white"
              >
                <div className="text-4xl">{achievement.achievement?.icon || '🏆'}</div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">{achievement.achievement?.name}</h4>
                  <p className="text-xs text-muted-foreground">{achievement.achievement?.description}</p>
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <span className="text-reward-dark font-medium">
                      +{achievement.achievement?.xpReward} XP
                    </span>
                    <span className="text-purple-600 font-medium">
                      +{achievement.achievement?.pointsReward} pts
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {lockedAchievements.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Verrouillés ({lockedAchievements.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {lockedAchievements.map(achievement => (
              <Card 
                key={achievement.id}
                className="p-4 text-center space-y-2 opacity-60"
              >
                <div className="relative">
                  <div className="text-4xl grayscale">{achievement.achievement?.icon || '🏆'}</div>
                  <Lock className="w-4 h-4 absolute top-0 right-0 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">
                    {achievement.achievement?.isSecret ? '???' : achievement.achievement?.name}
                  </h4>
                  {!achievement.achievement?.isSecret && (
                    <p className="text-xs text-muted-foreground">{achievement.achievement?.description}</p>
                  )}
                  {achievement.currentProgress > 0 && achievement.achievement?.targetValue && (
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div
                        className="h-full bg-reward rounded-full transition-all"
                        style={{ 
                          width: `${(achievement.currentProgress / achievement.achievement.targetValue) * 100}%` 
                        }}
                      />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {achievements.length === 0 && (
        <div className="text-center py-8">
          <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Aucun achievement pour le moment</p>
          <p className="text-sm text-muted-foreground mt-1">Complétez des tâches pour débloquer des achievements !</p>
        </div>
      )}
    </div>
  );
};

export default AchievementsList;
