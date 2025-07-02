
import React, { useState, useMemo } from 'react';
import { Task, CATEGORY_CONFIG, SUB_CATEGORY_CONFIG } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Clock } from 'lucide-react';
import { cssVarRGB } from '@/utils/colors';

interface PriorityViewProps {
  tasks: Task[];
  getSubTasks: (parentId: string) => Task[];
  calculateTotalTime: (task: Task) => number;
}

interface PrioritySelection {
  priority: Task | null;
  medium: Task[];
  quick: Task[];
}

const PriorityView: React.FC<PriorityViewProps> = ({ tasks, getSubTasks, calculateTotalTime }) => {
  const [selection, setSelection] = useState<PrioritySelection | null>(null);

  // Algorithme de priorisation hiérarchique
  const generatePrioritySelection = (): PrioritySelection => {
    const allEligibleTasks: Task[] = [];

    // Fonction récursive pour explorer la hiérarchie
    const exploreHierarchy = (task: Task): Task => {
      const subTasks = getSubTasks(task.id);
      
      if (subTasks.length === 0) {
        return task; // Feuille de l'arbre
      }

      // Chercher les sous-tâches prioritaires (Le plus important)
      const essentialSubTasks = subTasks.filter(st => st.subCategory === 'Le plus important');
      
      if (essentialSubTasks.length > 0) {
        // Descendre dans les sous-tâches les plus importantes
        const randomEssential = essentialSubTasks[Math.floor(Math.random() * essentialSubTasks.length)];
        return exploreHierarchy(randomEssential);
      } else {
        // Pas de sous-tâche "Le plus important", prendre une sous-tâche au hasard
        const randomSubTask = subTasks[Math.floor(Math.random() * subTasks.length)];
        return exploreHierarchy(randomSubTask);
      }
    };

    // Explorer toutes les tâches principales
    tasks.filter(task => task.level === 0).forEach(mainTask => {
      const finalTask = exploreHierarchy(mainTask);
      allEligibleTasks.push(finalTask);
    });

    // Séparer par critères
    const obligations = allEligibleTasks.filter(task => 
      task.category === 'Obligation' || task.subCategory === 'Le plus important'
    );
    const mediumTasks = allEligibleTasks.filter(task => 
      calculateTotalTime(task) >= 15 && calculateTotalTime(task) <= 60 &&
      !obligations.includes(task)
    );
    const quickTasks = allEligibleTasks.filter(task => 
      calculateTotalTime(task) < 15 &&
      !obligations.includes(task) &&
      !mediumTasks.includes(task)
    );

    // Sélection finale
    const priority = obligations.length > 0 ? 
      obligations[Math.floor(Math.random() * obligations.length)] : 
      (allEligibleTasks.length > 0 ? allEligibleTasks[Math.floor(Math.random() * allEligibleTasks.length)] : null);

    const selectedMedium = mediumTasks
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const selectedQuick = quickTasks
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);

    return {
      priority,
      medium: selectedMedium,
      quick: selectedQuick
    };
  };

  const handleGenerate = () => {
    setSelection(generatePrioritySelection());
  };

  // Génération initiale
  useMemo(() => {
    if (tasks.length > 0 && !selection) {
      handleGenerate();
    }
  }, [tasks.length]);

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const renderTask = (task: Task, isHigh: boolean = false) => {
    const categoryConfig = CATEGORY_CONFIG[task.category];
    const subCategoryConfig = task.subCategory ? SUB_CATEGORY_CONFIG[task.subCategory] : null;
    const totalTime = calculateTotalTime(task);

    // Couleur résolue mémorisée
    const resolvedCategoryColor = React.useMemo(() => 
      cssVarRGB(`--color-${categoryConfig.cssName}`), 
      [categoryConfig.cssName]
    );

    return (
      <div 
        key={task.id} 
        className={`
          p-3 border rounded-lg transition-all
          ${isHigh ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}
          hover:shadow-sm
        `}
      >
        <div className="flex items-center space-x-2 mb-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: resolvedCategoryColor }}
          />
          <h3 className="font-medium text-gray-900 flex-1">{task.name}</h3>
          <span 
            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium border"
            style={{
              backgroundColor: `${resolvedCategoryColor.replace('rgb(', 'rgba(').replace(')', ', 0.1)')}`,
              borderColor: resolvedCategoryColor,
              color: resolvedCategoryColor
            }}
          >
            {task.category}
          </span>
        </div>
        
        {subCategoryConfig && (
          <div className="mb-2">
            <span 
              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium border"
              style={{
                backgroundColor: `${cssVarRGB(`--color-priority-${subCategoryConfig.priority > 3 ? 'highest' : subCategoryConfig.priority > 2 ? 'high' : subCategoryConfig.priority > 1 ? 'medium' : 'low'}`).replace('rgb(', 'rgba(').replace(')', ', 0.1)')}`,
                borderColor: cssVarRGB(`--color-priority-${subCategoryConfig.priority > 3 ? 'highest' : subCategoryConfig.priority > 2 ? 'high' : subCategoryConfig.priority > 1 ? 'medium' : 'low'}`),
                color: cssVarRGB(`--color-priority-${subCategoryConfig.priority > 3 ? 'highest' : subCategoryConfig.priority > 2 ? 'high' : subCategoryConfig.priority > 1 ? 'medium' : 'low'}`)
              }}
            >
              {task.subCategory}
            </span>
          </div>
        )}
        
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="w-4 h-4 mr-1" />
          {formatDuration(totalTime)}
        </div>
      </div>
    );
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-gray-500 mb-2">Aucune tâche disponible</h3>
        <p className="text-sm text-gray-400">Créez des tâches pour utiliser la vue 1-3-5</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vue 1-3-5</h2>
          <p className="text-sm text-gray-600">Priorisation intelligente de vos tâches</p>
        </div>
        <Button onClick={handleGenerate} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Régénérer
        </Button>
      </div>

      {selection && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1 Tâche Prioritaire */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg text-red-600">1 Prioritaire</CardTitle>
            </CardHeader>
            <CardContent>
              {selection.priority ? (
                renderTask(selection.priority, true)
              ) : (
                <p className="text-sm text-gray-500">Aucune tâche prioritaire disponible</p>
              )}
            </CardContent>
          </Card>

          {/* 3 Tâches Moyennes */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg text-blue-600">3 Moyennes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selection.medium.length > 0 ? (
                selection.medium.map(task => renderTask(task))
              ) : (
                <p className="text-sm text-gray-500">Aucune tâche moyenne disponible</p>
              )}
            </CardContent>
          </Card>

          {/* 5 Tâches Rapides */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg text-green-600">5 Rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selection.quick.length > 0 ? (
                selection.quick.map(task => renderTask(task))
              ) : (
                <p className="text-sm text-gray-500">Aucune tâche rapide disponible</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PriorityView;
