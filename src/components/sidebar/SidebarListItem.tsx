import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { SidebarMenuItem } from '@/components/ui/sidebar';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SidebarListItemProps {
  // Content
  name: string;
  icon?: string;
  isCompleted?: boolean;
  
  // Style
  accentColor?: string;        // CSS color value (hsl var or hex)
  variant?: 'default' | 'pinned' | 'recurring';
  
  // Actions
  onToggleComplete?: () => void;
  showCheckbox?: boolean;
  
  // Slots for custom content
  leftSlot?: React.ReactNode;   // Before the text (expand button)
  rightSlot?: React.ReactNode;  // After the text (badges, time)
  bottomSlot?: React.ReactNode; // Under the text (actions on hover)
  
  // Additional class
  className?: string;
  
  // Estimated time (optional convenience prop)
  estimatedTime?: number;
}

const formatTime = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours}h${mins}` : `${hours}h`;
};

export const SidebarListItem: React.FC<SidebarListItemProps> = ({
  name,
  icon,
  isCompleted = false,
  accentColor = 'hsl(var(--muted))',
  variant = 'default',
  onToggleComplete,
  showCheckbox = true,
  leftSlot,
  rightSlot,
  bottomSlot,
  className,
  estimatedTime,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = isHovered;

  return (
    <SidebarMenuItem
      className={cn(
        'group relative flex items-center rounded-md transition-all duration-200 overflow-hidden',
        'hover:bg-sidebar-accent/60',
        'border-b border-sidebar-border/40',
        'mb-0.5 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.05)]',
        // Golden background for pinned items
        variant === 'pinned' && 'bg-[#EFBF04]/15 dark:bg-[#EFBF04]/10',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Recurring gradient on the right */}
      {variant === 'recurring' && (
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-blue-200/40 to-transparent dark:from-blue-600/25 dark:to-transparent pointer-events-none z-[1]" />
      )}

      {/* Category color bar - left edge */}
      <div
        className="w-1.5 self-stretch rounded-l-md shrink-0 z-10"
        style={{ backgroundColor: accentColor }}
      />

      {/* Main content - vertical layout on hover */}
      <div className="flex flex-col flex-1 min-w-0 py-2 pl-2 pr-1">
        {/* Text row */}
        <div className="flex items-start gap-1 w-full">
          {/* Left slot (expand button, etc.) */}
          {leftSlot}

          {/* Icon + Text - max priority */}
          <p
            className={cn(
              'text-sm leading-tight flex-1 min-w-0 transition-all duration-200',
              isCompleted && 'line-through text-muted-foreground',
              isExpanded ? 'whitespace-normal break-words' : 'truncate'
            )}
          >
            {icon && <span className="mr-1">{icon}</span>}
            {name}
          </p>

          {/* Right slot when collapsed */}
          {!isExpanded && rightSlot}
        </div>

        {/* Metadata and actions - UNDER text, visible on hover */}
        <div
          className={cn(
            'flex items-center gap-2 mt-1.5 transition-all duration-200',
            isExpanded ? 'opacity-100 max-h-10' : 'opacity-0 max-h-0 overflow-hidden'
          )}
        >
          {/* Estimated time */}
          {estimatedTime !== undefined && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
              <Clock className="w-3 h-3" />
              <span>{formatTime(estimatedTime)}</span>
            </div>
          )}

          {/* Right slot when expanded */}
          {rightSlot}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom slot (additional actions) */}
          {bottomSlot}

          {/* Checkbox */}
          {showCheckbox && onToggleComplete && (
            <Checkbox
              checked={isCompleted}
              onCheckedChange={onToggleComplete}
              className="h-4 w-4"
            />
          )}
        </div>
      </div>
    </SidebarMenuItem>
  );
};

export default SidebarListItem;
