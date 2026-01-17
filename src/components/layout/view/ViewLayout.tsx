import React from 'react';
import { cn } from '@/lib/utils';
import { ViewHeader, ViewHeaderProps } from './ViewHeader';
import { ViewContent, ViewContentProps } from './ViewContent';
import { ViewLoadingState, ViewLoadingStateProps } from './ViewLoadingState';
import { ViewErrorState, ViewErrorStateProps } from './ViewErrorState';
import { ViewEmptyState, ViewEmptyStateProps } from './ViewEmptyState';

export type ViewState = 'idle' | 'loading' | 'error' | 'empty' | 'success';

export interface ViewLayoutProps {
  // Header configuration
  header?: ViewHeaderProps;
  
  // Content configuration
  contentProps?: Omit<ViewContentProps, 'children'>;
  
  // State management
  state?: ViewState;
  loadingProps?: ViewLoadingStateProps;
  errorProps?: ViewErrorStateProps;
  emptyProps?: ViewEmptyStateProps;
  
  // Children
  children: React.ReactNode;
  
  // Styling
  className?: string;
  containerClassName?: string;
}

export const ViewLayout: React.FC<ViewLayoutProps> = ({
  header,
  contentProps,
  state = 'success',
  loadingProps,
  errorProps,
  emptyProps,
  children,
  className,
  containerClassName,
}) => {
  const renderContent = () => {
    switch (state) {
      case 'loading':
        return <ViewLoadingState {...loadingProps} />;
      case 'error':
        return <ViewErrorState {...errorProps} />;
      case 'empty':
        return emptyProps ? <ViewEmptyState {...emptyProps} /> : children;
      case 'idle':
      case 'success':
      default:
        return children;
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full min-h-0 overflow-hidden",
      containerClassName
    )}>
      <div className={cn(
        "flex-1 flex flex-col min-h-0 p-4 md:p-6",
        className
      )}>
        {header && (
          <ViewHeader {...header} />
        )}
        
        <ViewContent {...contentProps}>
          {renderContent()}
        </ViewContent>
      </div>
    </div>
  );
};

export default ViewLayout;
