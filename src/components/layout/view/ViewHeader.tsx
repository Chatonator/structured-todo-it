import React from 'react';
import { cn } from '@/lib/utils';
import { useViewport } from '@/contexts/ViewportContext';

export interface ViewHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export const ViewHeader: React.FC<ViewHeaderProps> = ({
  title,
  subtitle,
  icon,
  actions,
  className,
  children,
}) => {
  const { isPhone } = useViewport();

  if (isPhone) {
    if (!actions && !children) {
      return null;
    }

    return (
      <header className={cn('flex flex-col gap-3 border-b border-border/40 pb-3', className)}>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        {children && <div className="flex items-center gap-3 overflow-x-auto pb-1">{children}</div>}
      </header>
    );
  }

  return (
    <header
      className={cn(
        'flex flex-col gap-4 border-b border-border/50 pb-6',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>

        {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
      </div>

      {children && <div className="flex items-center gap-3">{children}</div>}
    </header>
  );
};

export default ViewHeader;
