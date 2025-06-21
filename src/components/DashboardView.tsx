
import React from 'react';
import { Task, CATEGORY_CONFIG, SUB_CATEGORY_CONFIG } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, BarChart3, PieChart, Timer, Hash } from 'lucide-react';
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface DashboardViewProps {
  tasks: Task[];
  mainTasks: Task[];
  calculateTotalTime: (task: Task) => number;
}

const DashboardView: React.FC<DashboardViewProps> = ({ tasks, mainTasks, calculateTotalTime }) => {
  // Calculs statistiques
  const totalTasks = tasks.length;
  const totalTime = mainTasks.reduce((sum, task) => sum + calculateTotalTime(task), 0);
  const averageTime = totalTasks > 0 ? Math.round(totalTime / totalTasks) : 0;

  // Répartition par catégories principales - corrigée
  const categoryStats = Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
    const categoryTasks = tasks.filter(task => task.category === category);
    const categoryTime = categoryTasks.reduce((sum, task) => sum + task.estimatedTime, 0);
    return {
      name: category,
      count: categoryTasks.length,
      time: categoryTime,
      color: config.color,
      icon: config.icon
    };
  }).filter(stat => stat.count > 0);

  // Répartition par sous-catégories (pour les sous-tâches)
  const subCategoryStats = Object.entries(SUB_CATEGORY_CONFIG).map(([subCategory, config]) => {
    const subCategoryTasks = tasks.filter(task => task.subCategory === subCategory);
    const subCategoryTime = subCategoryTasks.reduce((sum, task) => sum + task.estimatedTime, 0);
    return {
      name: subCategory,
      count: subCategoryTasks.length,
      time: subCategoryTime,
      color: config.color,
      icon: config.icon
    };
  }).filter(stat => stat.count > 0);

  // Données pour les graphiques - avec couleurs fixes
  const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
  
  const pieData = categoryStats.map((stat, index) => ({
    name: stat.name,
    value: stat.count,
    fill: CHART_COLORS[index % CHART_COLORS.length]
  }));

  const barData = categoryStats.map(stat => ({
    category: stat.name,
    temps: stat.time,
    taches: stat.count
  }));

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const formatHours = (minutes: number): string => {
    return `${(minutes / 60).toFixed(1)}h`;
  };

  if (totalTasks === 0) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-500 mb-2">Aucune donnée disponible</h3>
        <p className="text-sm text-gray-400">Créez des tâches pour voir les statistiques</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-600">Vue d'ensemble de vos tâches et statistiques</p>
      </div>

      {/* Cartes de statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tâches</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {mainTasks.length} principales, {totalTasks - mainTasks.length} sous-tâches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHours(totalTime)}</div>
            <p className="text-xs text-muted-foreground">
              {formatDuration(totalTime)} estimé
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durée Moyenne</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageTime}</div>
            <p className="text-xs text-muted-foreground">
              minutes par tâche
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Catégories</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryStats.length}</div>
            <p className="text-xs text-muted-foreground">
              types différents
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition par catégories (Camembert) */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par Catégories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  {/* Changement ici pour corriger le problème */}
                  <RechartsPieChart.Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </RechartsPieChart.Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {categoryStats.map((stat, index) => (
                <div key={stat.name} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: pieData[index]?.fill }}
                  />
                  <span className="text-sm">{stat.icon} {stat.name}</span>
                  <span className="text-xs text-gray-500">({stat.count})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Temps par catégorie (Histogramme) */}
        <Card>
          <CardHeader>
            <CardTitle>Temps par Catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'temps' ? `${value} min` : value,
                      name === 'temps' ? 'Temps' : 'Tâches'
                    ]}
                  />
                  <Bar dataKey="temps" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Détails par catégorie */}
      <Card>
        <CardHeader>
          <CardTitle>Détails par Catégorie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryStats.map(stat => (
              <div key={stat.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{stat.icon}</span>
                  <div>
                    <h4 className="font-medium">{stat.name}</h4>
                    <p className="text-sm text-gray-600">{stat.count} tâche{stat.count > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatDuration(stat.time)}</p>
                  <p className="text-xs text-gray-500">{Math.round(stat.time / stat.count)} min/tâche</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sous-catégories (si présentes) */}
      {subCategoryStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sous-catégories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subCategoryStats.map(stat => (
                <div key={stat.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{stat.icon}</span>
                    <div>
                      <h4 className="font-medium">{stat.name}</h4>
                      <p className="text-sm text-gray-600">{stat.count} sous-tâche{stat.count > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatDuration(stat.time)}</p>
                    <p className="text-xs text-gray-500">{Math.round(stat.time / stat.count)} min/tâche</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardView;
