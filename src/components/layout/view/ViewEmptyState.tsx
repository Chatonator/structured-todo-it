import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

export interface ViewEmptyStateProps {
  icon?: LucideIcon | React.ReactNode;
  title: string;
  description?: string;
  message?: string; // Alias for description
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'secondary' | 'outline';
  };
  className?: string;
}

export const ViewEmptyState: React.FC<ViewEmptyStateProps> = ({
  icon,
  title,
  description,
  message,
  action,
  className,
}) => {
  // Support both LucideIcon components and React elements
  const renderIcon = () => {
    if (!icon) return null;
    
    // Check if icon is a React element (JSX)
    if (React.isValidElement(icon)) {
      return (
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
          {React.cloneElement(icon as React.ReactElement, {
            className: "w-8 h-8 text-muted-foreground"
          })}
        </div>
      );
    }
    
    // Icon is a LucideIcon component
    const Icon = icon as LucideIcon;
    return (
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
    );
  };

  const displayMessage = description || message;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-6 text-center",
      className
    )}>
      {renderIcon()}
      
      <h3 className="text-lg font-medium text-foreground mb-2">
        {title}
      </h3>
      
      {displayMessage && (
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          {displayMessage}
        </p>
      )}
      
      {action && (
        <Button
          variant={action.variant || 'default'}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default ViewEmptyState;
