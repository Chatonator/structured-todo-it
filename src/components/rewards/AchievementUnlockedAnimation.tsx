import React, { useEffect, useState } from 'react';
import { Achievement, ACHIEVEMENT_TIERS } from '@/types/gamification';
import { X } from 'lucide-react';

interface AchievementUnlockedAnimationProps {
  achievement: Achievement;
}

const AchievementUnlockedAnimation: React.FC<AchievementUnlockedAnimationProps> = ({ achievement }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const tierInfo = ACHIEVEMENT_TIERS[achievement.tier];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full animate-in zoom-in duration-300">
        <button
          onClick={() => setVisible(false)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-4">
          <div className="text-6xl">{achievement.icon || '🏆'}</div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium" style={{ color: tierInfo.color }}>
              {tierInfo.label}
            </div>
            <h3 className="text-2xl font-bold">{achievement.name}</h3>
            <p className="text-muted-foreground">{achievement.description}</p>
          </div>

          <div className="flex items-center justify-center gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-reward-dark">+{achievement.xpReward}</div>
              <div className="text-xs text-muted-foreground">XP</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">+{achievement.pointsReward}</div>
              <div className="text-xs text-muted-foreground">Points</div>
            </div>
          </div>

          <div className="text-xl font-bold text-reward">Achievement débloqué !</div>
        </div>
      </div>
    </div>
  );
};

export default AchievementUnlockedAnimation;
