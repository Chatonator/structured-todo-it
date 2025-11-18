import React from 'react';
import { Card } from '@/components/ui/card';
import { UserChallenge } from '@/types/gamification';
import { Target, CheckCircle2, Calendar } from 'lucide-react';

interface ChallengesListProps {
  dailyChallenges: UserChallenge[];
  weeklyChallenges: UserChallenge[];
  loading: boolean;
}

const ChallengesList: React.FC<ChallengesListProps> = ({
  dailyChallenges,
  weeklyChallenges,
  loading
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  const renderChallenge = (challenge: UserChallenge) => {
    const progress = challenge.challenge?.targetValue 
      ? (challenge.currentProgress / challenge.challenge.targetValue) * 100 
      : 0;

    return (
      <Card 
        key={challenge.id}
        className={`p-4 ${challenge.isCompleted ? 'bg-green-50 border-green-200' : ''}`}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl">{challenge.challenge?.icon || '🎯'}</div>
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">{challenge.challenge?.name}</h4>
                <p className="text-sm text-muted-foreground">{challenge.challenge?.description}</p>
              </div>
              {challenge.isCompleted && (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              )}
            </div>

            {!challenge.isCompleted && (
              <>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="h-full bg-reward rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {challenge.currentProgress} / {challenge.challenge?.targetValue}
                  </span>
                  <span className="text-reward-dark font-medium">
                    +{challenge.challenge?.xpReward} XP • +{challenge.challenge?.pointsReward} pts
                  </span>
                </div>
              </>
            )}

            {challenge.isCompleted && (
              <div className="text-sm text-green-600 font-medium">
                Complété ! +{challenge.challenge?.xpReward} XP • +{challenge.challenge?.pointsReward} pts
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {dailyChallenges.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-reward" />
            <h3 className="text-lg font-semibold">Défis quotidiens</h3>
          </div>
          <div className="space-y-3">
            {dailyChallenges.map(renderChallenge)}
          </div>
        </div>
      )}

      {weeklyChallenges.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold">Défis hebdomadaires</h3>
          </div>
          <div className="space-y-3">
            {weeklyChallenges.map(renderChallenge)}
          </div>
        </div>
      )}

      {dailyChallenges.length === 0 && weeklyChallenges.length === 0 && (
        <div className="text-center py-8">
          <Target className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Aucun défi actif</p>
          <p className="text-sm text-muted-foreground mt-1">Revenez demain pour de nouveaux défis !</p>
        </div>
      )}
    </div>
  );
};

export default ChallengesList;
