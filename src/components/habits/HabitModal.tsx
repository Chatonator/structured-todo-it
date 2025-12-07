import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Habit, HABIT_FREQUENCY_OPTIONS, DAYS_OF_WEEK } from '@/types/habit';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  habit?: Habit | null;
}

const EMOJI_OPTIONS = ['💪', '🏃', '📚', '🧘', '💧', '🥗', '😴', '🎯', '✍️', '🎨', '🎵', '🧠'];

const HabitModal: React.FC<HabitModalProps> = ({ isOpen, onClose, onSave, habit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('💪');
  const [frequency, setFrequency] = useState<Habit['frequency']>('daily');
  const [timesPerWeek, setTimesPerWeek] = useState(3);
  const [targetDays, setTargetDays] = useState<number[]>([]);

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setDescription(habit.description || '');
      setIcon(habit.icon || '💪');
      setFrequency(habit.frequency);
      setTimesPerWeek(habit.timesPerWeek || 3);
      setTargetDays(habit.targetDays || []);
    } else {
      setName('');
      setDescription('');
      setIcon('💪');
      setFrequency('daily');
      setTimesPerWeek(3);
      setTargetDays([]);
    }
  }, [habit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave({
      name,
      description: description || undefined,
      deckId: habit?.deckId || '',
      frequency,
      timesPerWeek: frequency === 'x-times-per-week' ? timesPerWeek : undefined,
      targetDays: frequency === 'weekly' || frequency === 'custom' ? targetDays : undefined,
      isActive: true,
      order: habit?.order || 0,
      icon
    });
  };

  const toggleDay = (day: number) => {
    setTargetDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{habit ? 'Modifier l\'habitude' : 'Nouvelle habitude'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nom de l'habitude</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Méditer 10 minutes"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optionnel)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Méditation guidée le matin"
            />
          </div>

          <div>
            <Label>Icône</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`text-2xl p-2 rounded border ${
                    icon === emoji ? 'border-habit bg-habit-light' : 'border-border'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="frequency">Fréquence</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as Habit['frequency'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HABIT_FREQUENCY_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {frequency === 'x-times-per-week' && (
            <div>
              <Label htmlFor="times">Nombre de fois par semaine</Label>
              <Input
                id="times"
                type="number"
                min={1}
                max={7}
                value={timesPerWeek}
                onChange={(e) => setTimesPerWeek(parseInt(e.target.value))}
              />
            </div>
          )}

          {(frequency === 'weekly' || frequency === 'custom') && (
            <div>
              <Label>Jours de la semaine</Label>
              <div className="flex gap-2 mt-2 mb-3">
                <button
                  type="button"
                  onClick={() => setTargetDays([0, 1, 2, 3, 4])}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                    targetDays.length === 5 && !targetDays.includes(5) && !targetDays.includes(6)
                      ? 'bg-habit text-habit-foreground border-habit'
                      : 'border-border text-muted-foreground hover:border-habit/50'
                  }`}
                >
                  Semaine
                </button>
                <button
                  type="button"
                  onClick={() => setTargetDays([5, 6])}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                    targetDays.length === 2 && targetDays.includes(5) && targetDays.includes(6)
                      ? 'bg-habit text-habit-foreground border-habit'
                      : 'border-border text-muted-foreground hover:border-habit/50'
                  }`}
                >
                  Weekend
                </button>
                <button
                  type="button"
                  onClick={() => setTargetDays([0, 1, 2, 3, 4, 5, 6])}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                    targetDays.length === 7
                      ? 'bg-habit text-habit-foreground border-habit'
                      : 'border-border text-muted-foreground hover:border-habit/50'
                  }`}
                >
                  Tous
                </button>
              </div>
              <div className="flex gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`px-3 py-2 rounded border text-sm font-medium transition-colors ${
                      targetDays.includes(day.value)
                        ? 'bg-habit text-habit-foreground border-habit'
                        : 'border-border text-foreground hover:border-habit/50'
                    }`}
                  >
                    {day.short}
                  </button>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="bg-habit hover:bg-habit-dark">
              {habit ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default HabitModal;
