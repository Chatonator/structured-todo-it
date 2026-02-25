import React from 'react';
import LabScene from '@/components/rewards/lab/LabScene';
import { ViewLayout } from '@/components/layout/view';
import { Trophy } from 'lucide-react';

interface RewardsViewProps {
  className?: string;
}

const RewardsView: React.FC<RewardsViewProps> = ({ className }) => {
  return (
    <ViewLayout
      header={{
        title: "Récompenses",
        subtitle: "Laboratoire de raffinement",
        icon: <Trophy className="w-5 h-5" />
      }}
      state="success"
      className={className}
    >
      <div className="pb-20 md:pb-6">
        <LabScene />
      </div>
    </ViewLayout>
  );
};

export default RewardsView;
