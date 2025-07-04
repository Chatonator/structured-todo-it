import React, { useState, useMemo, useEffect } from 'react';
import { Task, SUB_CATEGORY_CONFIG } from '@/types/task';
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

  // Algorithme de priorisation corrigé et sécurisé
  const generatePrioritySelection = (): PrioritySelection => {
    if (!tasks || tasks.length === 0) {
      return { priority: null, medium: [], quick: [] };
    }

    const allEligibleTasks: Task[] = [];

    // Fonction récursive corrigée pour éviter les boucles infinies
    const exploreHierarchy = (task: Task, visited = new Set<string>()): Task => {
      // Protection contre les références circulaires
      if (visited.has(task.id)) {
        return task;
      }
      visited.add(task.id);

      const subTasks = getSubTasks(task.id).filter(st => !st.isCompleted);
      
      if (subTasks.length === 0) {
        return task; // Feuille de l'arbre
      }

      // Chercher les sous-tâches prioritaires
      const essentialSubTasks = subTasks.filter(st => 
        st.subCategory === 'Le plus important' && !st.isCompleted
      );
      
      if (essentialSubTasks.length > 0) {
        const randomEssential = essentialSubTasks[Math.floor(Math.random() * essentialSubTasks.length)];
        return exploreHierarchy(randomEssential, visited);
      } else {
        // Prendre une sous-tâche au hasard parmi les non-complétées
        const randomSubTask = subTasks[Math.floor(Math.random() * subTasks.length)];
        return exploreHierarchy(randomSubTask, visited);
      }
    };

    // Explorer toutes les tâches principales non-complétées
    const mainTasks = tasks.filter(task => task.level === 0 && !task.isCompleted);
    
    mainTasks.forEach(mainTask => {
      try {
        const finalTask = exploreHierarchy(mainTask);
        if (finalTask && !finalTask.isCompleted) {
          allEligibleTasks.push(finalTask);
        }
      } catch (error) {
        console.warn('Erreur lors de l\'exploration de la hiérarchie:', error);
        // En cas d'erreur, ajouter la tâche principale
        allEligibleTasks.push(mainTask);
      }
    });

    // Filtrage sécurisé par critères
    const obligations = allEligibleTasks.filter(task => 
      task.category === 'Obligation' || task.subCategory === 'Le plus important'
    );
    
    const mediumTasks = allEligibleTasks.filter(task => {
      const totalTime = calculateTotalTime(task);
      return totalTime >= 15 && totalTime <= 60 && !obligations.includes(task);
    });
    
    const quickTasks = allEligibleTasks.filter(task => {
      const totalTime = calculateTotalTime(task);
      return totalTime < 15 && !obligations.includes(task) && !mediumTasks.includes(task);
    });

    // Sélection finale sécurisée
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
    try {
      setSelection(generatePrioritySelection());
    } catch (error) {
      console.error('Erreur lors de la génération de la sélection prioritaire:', error);
      setSelection({ priority: null, medium: [], quick: [] });
    }
  };

  // Génération initiale sécurisée avec useEffect
  useEffect(() => {
    if (tasks.length > 0 && !selection) {
      handleGenerate();
    }
  }, [tasks.length, selection]);

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const renderTask = (task: Task, isHigh: boolean = false) => {
    const subCategoryConfig = task.subCategory ? SUB_CATEGORY_CONFIG[task.subCategory] : null;
    const totalTime = calculateTotalTime(task);

    // Couleur résolue directement avec cssVarRGB
    const resolvedCategoryColor = cssVarRGB(`--color-${task.category?.toLowerCase() || 'autres'}`);

    return (
      <div 
        key={task.id} 
        className="p-3 border rounded-lg transition-all hover:shadow-sm"
        style={{
          backgroundColor: cssVarRGB('--color-card'),
          color: cssVarRGB('--color-foreground'),
          borderColor: isHigh ? cssVarRGB('--color-error') : cssVarRGB('--color-border'),
        }}
      >
        <div className="flex items-center space-x-2 mb-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ 
              backgroundColor: resolvedCategoryColor,
              border: `1px solid ${cssVarRGB('--color-border')}`
            }}
          />
          <h3 className="font-medium flex-1" style={{ color: cssVarRGB('--color-foreground') }}>
            {task.name}
          </h3>
          <span 
            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
            style={{
              backgroundColor: `${resolvedCategoryColor.replace('rgb(', 'rgba(').replace(')', ', 0.1)')}`,
              borderColor: resolvedCategoryColor,
              color: resolvedCategoryColor,
              border: `1px solid ${resolvedCategoryColor}`
            }}
          >
            {task.category || 'Sans catégorie'}
          </span>
        </div>
        
        {subCategoryConfig && (
          <div className="mb-2">
            <span 
              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
              style={{
                backgroundColor: `${cssVarRGB(`--color-priority-${subCategoryConfig.priority > 3 ? 'highest' : subCategoryConfig.priority > 2 ? 'high' : subCategoryConfig.priority > 1 ? 'medium' : 'low'}`).replace('rgb(', 'rgba(').replace(')', ', 0.1)')}`,
                borderColor: cssVarRGB(`--color-priority-${subCategoryConfig.priority > 3 ? 'highest' : subCategoryConfig.priority > 2 ? 'high' : subCategoryConfig.priority > 1 ? 'medium' : 'low'}`),
                color: cssVarRGB(`--color-priority-${subCategoryConfig.priority > 3 ? 'highest' : subCategoryConfig.priority > 2 ? 'high' : subCategoryConfig.priority > 1 ? 'medium' : 'low'}`),
                border: `1px solid ${cssVarRGB(`--color-priority-${subCategoryConfig.priority > 3 ? 'highest' : subCategoryConfig.priority > 2 ? 'high' : subCategoryConfig.priority > 1 ? 'medium' : 'low'}`)}`
              }}
            >
              {task.subCategory}
            </span>
          </div>
        )}
        
        <div className="flex items-center text-sm" style={{ color: cssVarRGB('--color-muted') }}>
          <Clock className="w-4 h-4 mr-1" />
          {formatDuration(totalTime)}
        </div>
      </div>
    );
  };

  if (tasks.length === 0) {
    return (
      <div 
        className="text-center py-8"
        style={{ backgroundColor: cssVarRGB('--color-background') }}
      >
        <h3 
          className="text-lg font-medium mb-2"
          style={{ color: cssVarRGB('--color-muted') }}
        >
          Aucune tâche disponible
        </h3>
        <p 
          className="text-sm"
          style={{ color: cssVarRGB('--color-muted') }}
        >
          Créez des tâches pour utiliser la vue 1-3-5
        </p>
      </div>
    );
  }

  return (
    <div 
      className="space-y-6"
      style={{ 
        backgroundColor: cssVarRGB('--color-background'),
        color: cssVarRGB('--color-foreground')
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 
            className="text-2xl font-bold"
            style={{ color: cssVarRGB('--color-foreground') }}
          >
            Vue 1-3-5
          </h2>
          <p 
            className="text-sm"
            style={{ color: cssVarRGB('--color-muted') }}
          >
            Priorisation intelligente de vos tâches
          </p>
        </div>
        <Button 
          onClick={handleGenerate} 
          variant="outline"
          style={{
            backgroundColor: cssVarRGB('--color-background'),
            color: cssVarRGB('--color-foreground'),
            borderColor: cssVarRGB('--color-border')
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Régénérer
        </Button>
      </div>

      {selection && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1 Tâche Prioritaire */}
          <Card 
            className="lg:col-span-1"
            style={{
              backgroundColor: cssVarRGB('--color-card'),
              borderColor: cssVarRGB('--color-border')
            }}
          >
            <CardHeader style={{ backgroundColor: cssVarRGB('--color-card') }}>
              <CardTitle 
                className="text-lg"
                style={{ color: cssVarRGB('--color-error') }}
              >
                1 Prioritaire
              </CardTitle>
            </CardHeader>
            <CardContent style={{ backgroundColor: cssVarRGB('--color-card') }}>
              {selection.priority ? (
                renderTask(selection.priority, true)
              ) : (
                <p 
                  className="text-sm"
                  style={{ color: cssVarRGB('--color-muted') }}
                >
                  Aucune tâche prioritaire disponible
                </p>
              )}
            </CardContent>
          </Card>

          {/* 3 Tâches Moyennes */}
          <Card 
            className="lg:col-span-1"
            style={{
              backgroundColor: cssVarRGB('--color-card'),
              borderColor: cssVarRGB('--color-border')
            }}
          >
            <CardHeader style={{ backgroundColor: cssVarRGB('--color-card') }}>
              <CardTitle 
                className="text-lg"
                style={{ color: cssVarRGB('--color-info') }}
              >
                3 Moyennes
              </CardTitle>
            </CardHeader>
            <CardContent 
              className="space-y-3"
              style={{ backgroundColor: cssVarRGB('--color-card') }}
            >
              {selection.medium.length > 0 ? (
                selection.medium.map(task => renderTask(task))
              ) : (
                <p 
                  className="text-sm"
                  style={{ color: cssVarRGB('--color-muted') }}
                >
                  Aucune tâche moyenne disponible
                </p>
              )}
            </CardContent>
          </Card>

          {/* 5 Tâches Rapides */}
          <Card 
            className="lg:col-span-1"
            style={{
              backgroundColor: cssVarRGB('--color-card'),
              borderColor: cssVarRGB('--color-border')
            }}
          >
            <CardHeader style={{ backgroundColor: cssVarRGB('--color-card') }}>
              <CardTitle 
                className="text-lg"
                style={{ color: cssVarRGB('--color-success') }}
              >
                5 Rapides
              </CardTitle>
            </CardHeader>
            <CardContent 
              className="space-y-3"
              style={{ backgroundColor: cssVarRGB('--color-card') }}
            >
              {selection.quick.length > 0 ? (
                selection.quick.map(task => renderTask(task))
              ) : (
                <p 
                  className="text-sm"
                  style={{ color: cssVarRGB('--color-muted') }}
                >
                  Aucune tâche rapide disponible
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PriorityView;
