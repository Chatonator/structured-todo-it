import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SchedulingSectionProps {
  scheduledDate?: Date;
  scheduledTime?: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
}

export const SchedulingSection: React.FC<SchedulingSectionProps> = ({
  scheduledDate,
  scheduledTime,
  onDateChange,
  onTimeChange
}) => {
  return (
    <div className="space-y-3 pt-3 border-t border-border">
      <Label className="text-sm text-foreground flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Planification (optionnelle)
      </Label>
      
      <div className="grid grid-cols-2 gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !scheduledDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {scheduledDate ? format(scheduledDate, "d MMM", { locale: fr }) : "Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={scheduledDate}
              onSelect={onDateChange}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <Input
          type="time"
          value={scheduledTime || ''}
          onChange={(e) => onTimeChange(e.target.value)}
          placeholder="HH:MM"
          className="h-9 text-sm"
        />
      </div>
    </div>
  );
};
