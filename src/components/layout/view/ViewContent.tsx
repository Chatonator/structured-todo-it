import React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ViewContentProps {
  children: React.ReactNode;
  className?: string;
  scrollable?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  '2xl': 'max-w-[1400px]',
  full: 'max-w-full',
};

const paddingClasses = {
  none: '',
  sm: 'py-4',
  md: 'py-6',
  lg: 'py-8',
};

export const ViewContent: React.FC<ViewContentProps> = ({
  children,
  className,
  scrollable = false,
  maxWidth = 'full',
  padding = 'md',
}) => {
  const contentClasses = cn(
    "flex-1",
    maxWidthClasses[maxWidth],
    paddingClasses[padding],
    className
  );

  if (scrollable) {
    return (
      <ScrollArea className="flex-1">
        <div className={contentClasses}>
          {children}
        </div>
      </ScrollArea>
    );
  }

  return (
    <div className={contentClasses}>
      {children}
    </div>
  );
};

export default ViewContent;
