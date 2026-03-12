import { useState, useCallback, useEffect, useMemo } from 'react';
import { DashboardLayout, WidgetConfig, WidgetId, DEFAULT_DASHBOARD_LAYOUT, WIDGET_REGISTRY } from '@/types/widget';
import { arrayMove } from '@dnd-kit/sortable';

const STORAGE_KEY = 'todoIt_dashboardLayout';

function normalizeLayout(storedLayout?: DashboardLayout | null): DashboardLayout {
  const storedWidgets = Array.isArray(storedLayout?.widgets) ? storedLayout.widgets : [];
  const mappedStored = storedWidgets
    .map((widget, index) => {
      const definition = WIDGET_REGISTRY[widget.id as WidgetId];
      if (!definition) return null;

      return {
        ...definition,
        visible: typeof widget.visible === 'boolean' ? widget.visible : true,
        order: typeof widget.order === 'number' ? widget.order : index,
      } satisfies WidgetConfig;
    })
    .filter((widget): widget is WidgetConfig => !!widget)
    .sort((left, right) => left.order - right.order);

  const knownIds = new Set(mappedStored.map((widget) => widget.id));
  const missingWidgets = DEFAULT_DASHBOARD_LAYOUT.widgets
    .filter((widget) => !knownIds.has(widget.id))
    .map((widget, index) => ({
      ...widget,
      order: mappedStored.length + index,
    }));

  return {
    widgets: [...mappedStored, ...missingWidgets].map((widget, index) => ({
      ...widget,
      order: index,
    })),
  };
}

export const useWidgetLayout = () => {
  const [layout, setLayout] = useState<DashboardLayout>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return normalizeLayout(JSON.parse(stored) as DashboardLayout);
      }
    } catch (error) {
      console.error('Error loading dashboard layout:', error);
    }

    return normalizeLayout(DEFAULT_DASHBOARD_LAYOUT);
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
    }
  }, [layout]);

  const visibleWidgets = useMemo(
    () => layout.widgets.filter((widget) => widget.visible).sort((left, right) => left.order - right.order),
    [layout.widgets],
  );

  const allWidgets = useMemo(
    () => [...layout.widgets].sort((left, right) => left.order - right.order),
    [layout.widgets],
  );

  const reorderWidgets = useCallback((activeId: string, overId: string) => {
    setLayout((previous) => {
      const sorted = [...previous.widgets].sort((left, right) => left.order - right.order);
      const oldIndex = sorted.findIndex((widget) => widget.id === activeId);
      const newIndex = sorted.findIndex((widget) => widget.id === overId);

      if (oldIndex === -1 || newIndex === -1) {
        return previous;
      }

      return {
        widgets: arrayMove(sorted, oldIndex, newIndex).map((widget, index) => ({
          ...widget,
          order: index,
        })),
      };
    });
  }, []);

  const toggleWidget = useCallback((widgetId: WidgetId) => {
    setLayout((previous) => ({
      widgets: previous.widgets.map((widget) => (
        widget.id === widgetId ? { ...widget, visible: !widget.visible } : widget
      )),
    }));
  }, []);

  const resetLayout = useCallback(() => {
    setLayout(normalizeLayout(DEFAULT_DASHBOARD_LAYOUT));
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
