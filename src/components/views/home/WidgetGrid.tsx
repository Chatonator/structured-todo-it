import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WidgetConfig, WidgetId } from '@/types/widget';
import { Button } from '@/components/ui/button';
import { PriorityTasksWidget, ActiveProjectWidget, TodayHabitsWidget } from './widgets';

/** Registre des composants widget */
const WIDGET_COMPONENTS: Record<WidgetId, React.FC> = {
  'priority-tasks': PriorityTasksWidget,
  'active-project': ActiveProjectWidget,
  'today-habits': TodayHabitsWidget,
};

interface SortableWidgetProps {
  widget: WidgetConfig;
  isEditing: boolean;
  onToggle: (id: WidgetId) => void;
}

const SortableWidget: React.FC<SortableWidgetProps> = ({ widget, isEditing, onToggle }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id, disabled: !isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Component = WIDGET_COMPONENTS[widget.id];
  if (!Component) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        widget.span === 2 ? "lg:col-span-2" : "lg:col-span-1",
        isDragging && "z-50 opacity-80",
        isEditing && "ring-2 ring-dashed ring-primary/30 rounded-lg",
      )}
    >
      {isEditing && (
        <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1">
          <button
            onClick={() => onToggle(widget.id)}
            className="p-1 rounded-full bg-muted hover:bg-accent border border-border shadow-sm"
            title={widget.visible ? "Masquer" : "Afficher"}
          >
            {widget.visible ? (
              <EyeOff className="w-3 h-3 text-muted-foreground" />
            ) : (
              <Eye className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
          <button
            {...attributes}
            {...listeners}
            className="p-1 rounded-full bg-muted hover:bg-accent border border-border shadow-sm cursor-grab active:cursor-grabbing"
            title="Déplacer"
          >
            <GripVertical className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      )}
      <Component />
    </div>
  );
};

interface WidgetGridProps {
  widgets: WidgetConfig[];
  isEditing: boolean;
  onReorder: (activeId: string, overId: string) => void;
  onToggle: (id: WidgetId) => void;
}

const WidgetGrid: React.FC<WidgetGridProps> = ({
  widgets,
  isEditing,
  onReorder,
  onToggle,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string);
    }
  };

  const displayedWidgets = isEditing ? widgets : widgets.filter(w => w.visible);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={displayedWidgets.map(w => w.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {displayedWidgets.map(widget => (
            <SortableWidget
              key={widget.id}
              widget={widget}
              isEditing={isEditing}
              onToggle={onToggle}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default WidgetGrid;
