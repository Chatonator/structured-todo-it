import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LayoutMode, getLayoutMode } from '@/lib/layout/layoutMode';

export type { LayoutMode } from '@/lib/layout/layoutMode';

export interface ViewportValue {
  width: number;
  height: number;
  layoutMode: LayoutMode;
  isPhone: boolean;
  isTabletCompact: boolean;
  isDesktop: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  safeArea: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
}

const DEFAULT_SAFE_AREA = {
  top: 'env(safe-area-inset-top, 0px)',
  right: 'env(safe-area-inset-right, 0px)',
  bottom: 'env(safe-area-inset-bottom, 0px)',
  left: 'env(safe-area-inset-left, 0px)',
} as const;

const getViewportSnapshot = (): ViewportValue => {
  if (typeof window === 'undefined') {
    return {
      width: 1280,
      height: 720,
      layoutMode: 'desktop',
      isPhone: false,
      isTabletCompact: false,
      isDesktop: true,
      isPortrait: false,
      isLandscape: true,
      safeArea: DEFAULT_SAFE_AREA,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const layoutMode = getLayoutMode(width);
  const isPortrait = height >= width;

  return {
    width,
    height,
    layoutMode,
    isPhone: layoutMode === 'phone',
    isTabletCompact: layoutMode === 'tablet-compact',
    isDesktop: layoutMode === 'desktop',
    isPortrait,
    isLandscape: !isPortrait,
    safeArea: DEFAULT_SAFE_AREA,
  };
};

const ViewportContext = createContext<ViewportValue | undefined>(undefined);

export const ViewportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewport, setViewport] = useState<ViewportValue>(() => getViewportSnapshot());

  useEffect(() => {
    const handleViewportChange = () => {
      setViewport(getViewportSnapshot());
    };

    handleViewportChange();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleViewportChange);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
    };
  }, []);

  const value = useMemo(() => viewport, [viewport]);

  return <ViewportContext.Provider value={value}>{children}</ViewportContext.Provider>;
};

export const useViewport = (): ViewportValue => {
  const context = useContext(ViewportContext);
  if (!context) {
    throw new Error('useViewport must be used within a ViewportProvider');
  }
  return context;
};
