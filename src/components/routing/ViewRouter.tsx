import React, { Suspense, useMemo } from 'react';
import { viewRegistry, getViewConfig, getDefaultView } from './viewRegistry';
import { ViewLoadingState } from '@/components/layout/view';
import { ViewErrorState } from '@/components/layout/view';
import { cn } from '@/lib/utils';

export interface ViewRouterProps {
  currentView: string;
  viewProps?: Record<string, any>;
  className?: string;
  onViewError?: (error: Error, viewId: string) => void;
}

// Error Boundary for view-level errors
class ViewErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <ViewErrorState 
          title="Erreur dans la vue"
          message={this.state.error?.message || "Une erreur inattendue s'est produite"}
          onRetry={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }

    return this.props.children;
  }
}

export const ViewRouter: React.FC<ViewRouterProps> = ({
  currentView,
  viewProps = {},
  className,
  onViewError,
}) => {
  // Get the view configuration
  const viewConfig = useMemo(() => {
    return getViewConfig(currentView) || getViewConfig(getDefaultView());
  }, [currentView]);

  // If no view config found, show error
  if (!viewConfig) {
    return (
      <ViewErrorState 
        title="Vue introuvable"
        message={`La vue "${currentView}" n'existe pas.`}
      />
    );
  }

  const ViewComponent = viewConfig.component;

  return (
    <div className={cn(
      "flex-1 min-h-0 overflow-hidden",
      className
    )}>
      <ViewErrorBoundary 
        onError={(error) => onViewError?.(error, currentView)}
        fallback={
          <ViewErrorState 
            title={`Erreur dans ${viewConfig.title}`}
            message="Un problème est survenu lors du chargement de cette vue."
            onRetry={() => window.location.reload()}
          />
        }
      >
        <Suspense fallback={
          <div className="p-6">
            <ViewLoadingState variant="cards" count={6} />
          </div>
        }>
          <ViewComponent {...viewProps} />
        </Suspense>
      </ViewErrorBoundary>
    </div>
  );
};

export default ViewRouter;
