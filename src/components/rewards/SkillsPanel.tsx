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
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Compétences</h3>
      </div>

      <div className="flex flex-col gap-2">
        {skills.map(skill => (
          <Card key={skill.key} className="p-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{skill.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground truncate">{skill.name}</p>
                  <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                    Niv. {skill.level}
                  </span>
                </div>
              </div>
            </div>
            <Progress value={skill.progressPct} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground mt-1 text-right">
              {skill.progressPct}% → Niv. {skill.level + 1}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SkillsPanel;
