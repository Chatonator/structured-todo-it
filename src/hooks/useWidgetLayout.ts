import { useState, useCallback, useEffect } from 'react';
import { DashboardLayout, WidgetConfig, WidgetId, DEFAULT_DASHBOARD_LAYOUT } from '@/types/widget';
import { arrayMove } from '@dnd-kit/sortable';

const STORAGE_KEY = 'todoIt_dashboardLayout';

/**
 * Hook pour gérer le layout du dashboard (ordre, visibilité des widgets)
 * Persiste dans localStorage
 */
export const useWidgetLayout = () => {
  const [layout, setLayout] = useState<DashboardLayout>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DashboardLayout;
        // Merge with defaults to handle new widgets
        const storedIds = new Set(parsed.widgets.map(w => w.id));
        const newWidgets = DEFAULT_DASHBOARD_LAYOUT.widgets
          .filter(w => !storedIds.has(w.id))
          .map((w, i) => ({ ...w, order: parsed.widgets.length + i }));
        return { widgets: [...parsed.widgets, ...newWidgets] };
      }
    } catch (e) {
      console.error('Error loading dashboard layout:', e);
    }
    return DEFAULT_DASHBOARD_LAYOUT;
  });

  const [isEditing, setIsEditing] = useState(false);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch (e) {
      console.error('Error saving dashboard layout:', e);
    }
  }, [layout]);

  /** Widgets visibles triés par ordre */
  const visibleWidgets = layout.widgets
    .filter(w => w.visible)
    .sort((a, b) => a.order - b.order);

  /** Tous les widgets triés par ordre */
  const allWidgets = [...layout.widgets].sort((a, b) => a.order - b.order);

  /** Réordonner après un drag & drop */
  const reorderWidgets = useCallback((activeId: string, overId: string) => {
    setLayout(prev => {
      const sorted = [...prev.widgets].sort((a, b) => a.order - b.order);
      const oldIndex = sorted.findIndex(w => w.id === activeId);
      const newIndex = sorted.findIndex(w => w.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      
      const reordered = arrayMove(sorted, oldIndex, newIndex)
        .map((w, i) => ({ ...w, order: i }));
      
      return { widgets: reordered };
    });
  }, []);

  /** Toggle la visibilité d'un widget */
  const toggleWidget = useCallback((widgetId: WidgetId) => {
    setLayout(prev => ({
      widgets: prev.widgets.map(w =>
        w.id === widgetId ? { ...w, visible: !w.visible } : w
      ),
    }));
  }, []);

  /** Réinitialiser le layout */
  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_DASHBOARD_LAYOUT);
  }, []);

  return {
    visibleWidgets,
    allWidgets,
    isEditing,
    setIsEditing,
    reorderWidgets,
    toggleWidget,
    resetLayout,
  };
};
