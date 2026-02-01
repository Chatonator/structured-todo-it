import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CurrentTimeIndicatorProps {
  startHour: number;
  pixelsPerMinute: number;
  className?: string;
}

export const CurrentTimeIndicator: React.FC<CurrentTimeIndicatorProps> = ({
  startHour,
  pixelsPerMinute,
  className
}) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Calculate position from start hour
  const minutesFromStart = (currentHour - startHour) * 60 + currentMinute;
  const topPosition = minutesFromStart * pixelsPerMinute;

  // Don't show if outside visible range
  if (currentHour < startHour || currentHour >= 22) {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute left-0 right-0 z-20 pointer-events-none",
        className
      )}
      style={{ top: `${topPosition}px` }}
    >
      <div className="flex items-center">
        <div className="w-2 h-2 rounded-full bg-system-error" />
        <div className="flex-1 h-0.5 bg-system-error" />
      </div>
    </div>
  );
};

export default CurrentTimeIndicator;
