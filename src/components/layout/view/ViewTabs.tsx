import React from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export interface ViewTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface ViewTabsProps {
  tabs: ViewTab[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  tabsListClassName?: string;
  variant?: 'default' | 'underline' | 'pills';
}

const variantClasses = {
  default: {
    list: 'bg-muted p-1 rounded-lg',
    trigger: 'data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md',
  },
  underline: {
    list: 'bg-transparent border-b border-border p-0 rounded-none',
    trigger: 'rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent',
  },
  pills: {
    list: 'bg-transparent gap-2 p-0',
    trigger: 'bg-secondary/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4',
  },
};

/**
 * ViewTabs - Système d'onglets standardisé pour les vues
 * 
 * Fournit une navigation par onglets avec plusieurs variantes visuelles.
 * Supporte les badges, icônes et état désactivé.
 * 
 * @example
 * <ViewTabs
 *   tabs={[
 *     { id: 'all', label: 'Tous', badge: 12, content: <AllContent /> },
 *     { id: 'active', label: 'Actifs', icon: <Clock />, content: <ActiveContent /> },
 *   ]}
 *   defaultTab="all"
 *   variant="underline"
 * />
 */
export const ViewTabs: React.FC<ViewTabsProps> = ({
  tabs,
  defaultTab,
  activeTab,
  onTabChange,
  className,
  tabsListClassName,
  variant = 'default',
}) => {
  if (tabs.length === 0) return null;

  const effectiveDefaultTab = defaultTab || tabs[0]?.id;
  const variantStyles = variantClasses[variant];

  return (
    <Tabs
      defaultValue={effectiveDefaultTab}
      value={activeTab}
      onValueChange={onTabChange}
      className={cn("w-full", className)}
    >
      <TabsList
        className={cn(
          "h-auto w-full justify-start flex-wrap",
          variantStyles.list,
          tabsListClassName
        )}
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            disabled={tab.disabled}
            className={cn(
              "flex items-center gap-2 py-2 px-3 text-sm font-medium transition-all",
              variantStyles.trigger,
              tab.disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {tab.icon && (
              <span className="h-4 w-4 flex-shrink-0">
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={cn(
                "ml-1.5 px-1.5 py-0.5 text-xs rounded-full font-medium",
                "bg-muted text-muted-foreground",
                "data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              )}>
                {tab.badge}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent
          key={tab.id}
          value={tab.id}
          className="mt-4 focus-visible:outline-none"
        >
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default ViewTabs;
