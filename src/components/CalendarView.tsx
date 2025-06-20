
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Task } from '@/types/task';

interface CalendarViewProps {
  tasks: Task[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Calendrier</h2>
        <p className="text-sm text-gray-600">Planification temporelle de vos tâches</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>📅 Vue Calendrier</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <div className="text-4xl mb-2">📅</div>
          </div>
          <h3 className="text-lg font-medium text-gray-500 mb-2">Calendrier en développement</h3>
          <p className="text-sm text-gray-400">
            Cette vue permettra de planifier vos tâches dans le temps
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarView;
