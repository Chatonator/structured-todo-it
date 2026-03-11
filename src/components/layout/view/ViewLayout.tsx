import React from 'react';
import { cn } from '@/lib/utils';
import { ViewHeader, ViewHeaderProps } from './ViewHeader';
import { ViewContent, ViewContentProps } from './ViewContent';
import { ViewLoadingState, ViewLoadingStateProps } from './ViewLoadingState';
import { ViewErrorState, ViewErrorStateProps } from './ViewErrorState';
import { ViewEmptyState, ViewEmptyStateProps } from './ViewEmptyState';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useViewport } from '@/contexts/ViewportContext';

export type ViewState = 'idle' | 'loading' | 'error' | 'empty' | 'success';

/** Variantes de layout pour différents types de vues */
export type ViewVariant = 'dashboard' | 'list' | 'kanban' | 'detail' | 'grid';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

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

  // Layout variant
  variant?: ViewVariant;

  // Breadcrumb / Back navigation
  breadcrumb?: BreadcrumbItem[];
  showBackButton?: boolean;
  backButtonLabel?: string;
  onBack?: () => void;

  // Children
  children: React.ReactNode;

  // Styling
  className?: string;
  containerClassName?: string;
}

const variantClasses: Record<ViewVariant, string> = {
  dashboard: '',
  list: '',
  kanban: 'overflow-x-auto',
  detail: '',
  grid: '',
};

export const ViewLayout: React.FC<ViewLayoutProps> = ({
  header,
  contentProps,
  state = 'success',
  loadingProps,
  errorProps,
  emptyProps,
  variant = 'dashboard',
  breadcrumb,
  showBackButton = false,
  backButtonLabel = 'Retour',
  onBack,
  children,
  className,
  containerClassName,
}) => {
  const { isPhone, isTabletCompact } = useViewport();

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

  const hasBreadcrumb = breadcrumb && breadcrumb.length > 0;
  const hasBackNavigation = showBackButton && onBack;

  return (
    <div className={cn('flex flex-col h-full min-h-0 overflow-hidden', containerClassName)}>
      <div
        className={cn(
          'flex-1 flex flex-col min-h-0',
          isPhone ? 'p-4' : isTabletCompact ? 'p-5' : 'p-4 md:p-6',
          variantClasses[variant],
          className
        )}
      >
        {(hasBreadcrumb || hasBackNavigation) && (
          <nav className="mb-4 flex items-center gap-2 text-sm">
            {hasBackNavigation && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="-ml-2 gap-1 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                {backButtonLabel}
              </Button>
            )}

            {hasBreadcrumb && (
              <div className="flex items-center gap-1 text-muted-foreground">
                {breadcrumb.map((item, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <span className="mx-1">/</span>}
                    {item.onClick ? (
                      <button onClick={item.onClick} className="transition-colors hover:text-foreground">
                        {item.label}
                      </button>
                    ) : (
                      <span className={index === breadcrumb.length - 1 ? 'font-medium text-foreground' : ''}>
                        {item.label}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </nav>
        )}

        {header && <ViewHeader {...header} />}

        <ViewContent {...contentProps}>
          <div className={cn(isPhone ? 'pb-6' : 'pb-20 md:pb-6')}>{renderContent()}</div>
        </ViewContent>
      </div>
    </div>
  );
};

export default ViewLayout;
