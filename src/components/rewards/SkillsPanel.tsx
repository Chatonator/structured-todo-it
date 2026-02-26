import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { SkillData } from '@/types/gamification';
import { Sparkles } from 'lucide-react';

interface SkillsPanelProps {
  skills: SkillData[];
}

const SkillsPanel: React.FC<SkillsPanelProps> = ({ skills }) => {
  if (skills.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Compétences</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {skills.map(skill => (
          <Card key={skill.key} className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{skill.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{skill.name}</p>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    Niv. {skill.level}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{skill.xp} XP</p>
              </div>
            </div>
            <Progress value={skill.progressPct} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {skill.progressPct}% → Niv. {skill.level + 1}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SkillsPanel;
