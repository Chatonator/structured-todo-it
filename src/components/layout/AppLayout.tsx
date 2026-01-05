import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/shared/use-mobile';

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout principal de l'application TO-DO-IT 2.0
 * Utilise le SidebarProvider de shadcn pour gérer l'état de la sidebar
 */
const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full bg-background">
        {children}
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
