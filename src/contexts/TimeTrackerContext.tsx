import React, { createContext, useContext } from 'react';
import { useTimeTracker } from '@/hooks/useTimeTracker';

type TimeTrackerContextType = ReturnType<typeof useTimeTracker>;

const TimeTrackerContext = createContext<TimeTrackerContextType | null>(null);

export function TimeTrackerProvider({ children }: { children: React.ReactNode }) {
  const tracker = useTimeTracker();
  return (
    <TimeTrackerContext.Provider value={tracker}>
      {children}
    </TimeTrackerContext.Provider>
  );
}

export function useTimeTrackerContext(): TimeTrackerContextType {
  const ctx = useContext(TimeTrackerContext);
  if (!ctx) throw new Error('useTimeTrackerContext must be used within TimeTrackerProvider');
  return ctx;
}
