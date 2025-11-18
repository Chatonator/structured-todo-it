import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';

interface LevelUpAnimationProps {
  level: number;
}

const LevelUpAnimation: React.FC<LevelUpAnimationProps> = ({ level }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="animate-bounce">
        <div className="bg-gradient-to-br from-reward to-reward-dark text-white rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center gap-3">
            <Trophy className="w-16 h-16" />
            <div className="text-center">
              <div className="text-4xl font-bold">Niveau {level} !</div>
              <div className="text-lg mt-2">Bravo, vous progressez !</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelUpAnimation;
