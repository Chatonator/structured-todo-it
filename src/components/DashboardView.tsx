import React from 'react';
import { Task, CATEGORY_CONFIG, SUB_CATEGORY_CONFIG, CATEGORY_CSS_NAMES } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, BarChart3, PieChart, Timer, Hash } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface DashboardViewProps {
  tasks: Task[];
  mainTasks: Task[];
  calculateTotalTime: (task: Task) => number;
}

const DashboardView: React.FC<DashboardViewProps> = ({ tasks, mainTasks, calculateTotalTime }) => {
  // Mapping statique des couleurs
  const CATEGORY_COLORS = {
    'Obligation': '#DC2626',
    'Quotidien': '#FBBF24', 
    'Envie': '#86EFAC',
    'Autres': '#2563EB'
  };

  // Calculs statistiques
  const totalTasks = tasks.length;
  const totalTime = mainTasks.reduce((sum, task) => sum + calculateTotalTime(task), 0);
  const averageTime = totalTasks > 0 ? Math.round(totalTime / totalTasks) : 0;

  // Répartition par catégories principales avec couleurs statiques
  const categoryStats = Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
    const categoryTasks = tasks.filter(task => task.category === category);
    const categoryTime = categoryTasks.reduce((sum, task) => sum + task.estimatedTime, 0);
    
    // Mapping vers les couleurs statiques
    const colorKey = config.cssName === 'obligation' ? 'Obligation' :
                   config.cssName === 'quotidien' ? 'Quotidien' :
                   config.cssName === 'envie' ? 'Envie' : 'Autres';
    
    return {
      name: category,
      count: categoryTasks.length,
      time: categoryTime,
      color: CATEGORY_COLORS[colorKey],
      bgColor: config.color
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
      color: config.color
    };
  }).filter(stat => stat.count > 0);

  // Données pour les graphiques avec couleurs résolues
  const pieData = categoryStats.map((stat) => ({
    name: stat.name,
    value: stat.count,
    fill: stat.color
  }));

  const barData = categoryStats.map(stat => ({
    category: stat.name,
    temps: stat.time,
    taches: stat.count,
    fill: stat.color // Couleur statique pour chaque barre
  }));

  // Fonctions de formatage
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
        <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">Aucune donnée disponible</h3>
        <p className="text-sm text-muted-foreground">Créez des tâches pour voir les statistiques</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Vue d'ensemble de vos tâches et statistiques</p>
      </div>

      {/* Cartes de statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Tâches</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {mainTasks.length} principales, {totalTasks - mainTasks.length} sous-tâches
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Temps Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatHours(totalTime)}</div>
            <p className="text-xs text-muted-foreground">
              {formatDuration(totalTime)} estimé
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Durée Moyenne</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{averageTime}</div>
            <p className="text-xs text-muted-foreground">
              minutes par tâche
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Catégories</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{categoryStats.length}</div>
            <p className="text-xs text-muted-foreground">
              types différents
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition par catégories (Camembert) */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Répartition par Catégories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {categoryStats.map((stat) => (
                <div key={stat.name} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full bg-category-${stat.name.toLowerCase()}`} />
                  <span className="text-sm text-foreground">{stat.name}</span>
                  <span className="text-xs text-muted-foreground">({stat.count})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Temps par catégorie (Histogramme) */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Temps par Catégorie</CardTitle>
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
                  <Bar 
                    dataKey="temps" 
                    fill="#3B82F6"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Détails par catégorie */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Détails par Catégorie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryStats.map(stat => (
              <div key={stat.name} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full bg-category-${stat.name.toLowerCase()}`} />
                  <div>
                    <h4 className="font-medium text-foreground">{stat.name}</h4>
                    <p className="text-sm text-muted-foreground">{stat.count} tâche{stat.count > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">{formatDuration(stat.time)}</p>
                  <p className="text-xs text-muted-foreground">{Math.round(stat.time / stat.count)} min/tâche</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sous-catégories (si présentes) */}
      {subCategoryStats.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Sous-catégories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subCategoryStats.map(stat => (
                <div key={stat.name} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h4 className="font-medium text-foreground">{stat.name}</h4>
                      <p className="text-sm text-muted-foreground">{stat.count} sous-tâche{stat.count > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">{formatDuration(stat.time)}</p>
                    <p className="text-xs text-muted-foreground">{Math.round(stat.time / stat.count)} min/tâche</p>
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
