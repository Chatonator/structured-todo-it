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
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WidgetConfig, WidgetId } from '@/types/widget';
import {
  DailyOverviewWidget,
  PriorityTasksWidget,
  TodayTimelineWidget,
  ActiveProjectWidget,
  TodayHabitsWidget,
  ObservatorySnapshotWidget,
  RewardsSnapshotWidget,
  TeamSnapshotWidget,
  QuickLinksWidget,
} from './widgets';

const WIDGET_COMPONENTS: Record<WidgetId, React.FC> = {
  'daily-overview': DailyOverviewWidget,
  'priority-tasks': PriorityTasksWidget,
  'today-timeline': TodayTimelineWidget,
  'active-project': ActiveProjectWidget,
  'today-habits': TodayHabitsWidget,
  'observatory-snapshot': ObservatorySnapshotWidget,
  'rewards-snapshot': RewardsSnapshotWidget,
  'team-snapshot': TeamSnapshotWidget,
  'quick-links': QuickLinksWidget,
};

interface SortableWidgetProps {
  widget: WidgetConfig;
  isEditing: boolean;
  onToggle: (id: WidgetId) => void;
}

const SortableWidget: React.FC<SortableWidgetProps> = ({ widget, isEditing, onToggle }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
    disabled: !isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Component = WIDGET_COMPONENTS[widget.id];
  if (!Component) return null;

  const containerClassName = cn(
    'relative group',
    widget.span === 2 ? 'xl:col-span-12' : 'xl:col-span-6',
    isDragging && 'z-50 opacity-80',
    isEditing && 'rounded-2xl ring-2 ring-dashed ring-primary/30',
  );

  return (
    <div ref={setNodeRef} style={style} className={containerClassName}>
      {isEditing && (
        <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggle(widget.id)}
            className="rounded-full border border-border bg-background/95 p-1.5 shadow-sm transition-colors hover:bg-accent"
            title={widget.visible ? 'Masquer' : 'Afficher'}
          >
            {widget.visible ? (
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab rounded-full border border-border bg-background/95 p-1.5 shadow-sm transition-colors hover:bg-accent active:cursor-grabbing"
            title="Deplacer"
          >
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      )}

      {isEditing && !widget.visible ? (
        <div className="h-full min-h-[180px] rounded-2xl border border-dashed border-border/80 bg-muted/20 p-6">
          <div className="flex h-full flex-col justify-between gap-4">
            <div>
              <p className="text-3xl">{widget.icon}</p>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{widget.label}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{widget.description}</p>
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Source : {widget.sourceView}
            </p>
          </div>
        </div>
      ) : (
        <Component />
      )}
    </div>
  );
};

interface WidgetGridProps {
  widgets: WidgetConfig[];
  isEditing: boolean;
  onReorder: (activeId: string, overId: string) => void;
  onToggle: (id: WidgetId) => void;
}

const WidgetGrid: React.FC<WidgetGridProps> = ({ widgets, isEditing, onReorder, onToggle }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(String(active.id), String(over.id));
    }
  };

  const displayedWidgets = isEditing ? widgets : widgets.filter((widget) => widget.visible);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={displayedWidgets.map((widget) => widget.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          {displayedWidgets.map((widget) => (
            <SortableWidget key={widget.id} widget={widget} isEditing={isEditing} onToggle={onToggle} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default WidgetGrid;
