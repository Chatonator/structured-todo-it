
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Task } from '@/types/task';

interface EisenhowerViewProps {
  tasks: Task[];
}

const EisenhowerView: React.FC<EisenhowerViewProps> = ({ tasks }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Matrice d'Eisenhower</h2>
        <p className="text-sm text-gray-600">Classification urgence/importance</p>
      </div>

      <div className="grid grid-cols-2 gap-4 h-96">
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">🔥 Urgent + Important</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">À faire immédiatement</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-700">📅 Important + Non urgent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">À planifier</p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-700">⚡ Urgent + Non important</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">À déléguer</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-700">🗑️ Non urgent + Non important</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">À éliminer</p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-gray-500">
        <p className="text-sm">Vue en cours de développement</p>
      </div>
    </div>
  );
};

export default EisenhowerView;
