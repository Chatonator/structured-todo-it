import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Habit, 
  HABIT_FREQUENCY_OPTIONS, 
  DAYS_OF_WEEK, 
  DAYS_OF_MONTH,
  CHALLENGE_DURATION_PRESETS,
  CHALLENGE_END_OPTIONS,
  UNLOCK_CONDITION_OPTIONS,
  UnlockCondition,
  ChallengeEndAction
} from '@/types/habit';
import { Calendar, Lock, Flame, Target } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  habit?: Habit | null;
  availableHabits?: Habit[]; // Pour sélectionner l'habitude prérequise
  isProgressionDeck?: boolean; // Si le deck est en mode progression
}

const EMOJI_OPTIONS = ['💪', '🏃', '📚', '🧘', '💧', '🥗', '😴', '🎯', '✍️', '🎨', '🎵', '🧠', '🚀', '💼', '🏋️', '🧹'];

const HabitModal: React.FC<HabitModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  habit, 
  availableHabits = [],
  isProgressionDeck = false 
}) => {
  // Base
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('💪');
  
  // Fréquence
  const [frequency, setFrequency] = useState<Habit['frequency']>('daily');
  const [timesPerWeek, setTimesPerWeek] = useState(3);
  const [timesPerMonth, setTimesPerMonth] = useState(4);
  const [targetDays, setTargetDays] = useState<number[]>([]);
  
  // Challenge/Durée
  const [isChallenge, setIsChallenge] = useState(false);
  const [challengeDurationDays, setChallengeDurationDays] = useState(30);
  const [customDuration, setCustomDuration] = useState(30);
  const [challengeEndAction, setChallengeEndAction] = useState<ChallengeEndAction>('archive');
  
  // Déverrouillage
  const [isLocked, setIsLocked] = useState(false);
  const [unlockCondition, setUnlockCondition] = useState<UnlockCondition>({
    type: 'streak',
    value: 7
  });

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setDescription(habit.description || '');
      setIcon(habit.icon || '💪');
      setFrequency(habit.frequency);
      setTimesPerWeek(habit.timesPerWeek || 3);
      setTimesPerMonth(habit.timesPerMonth || 4);
      setTargetDays(habit.targetDays || []);
      setIsChallenge(habit.isChallenge || false);
      setChallengeDurationDays(habit.challengeDurationDays || 30);
      setCustomDuration(habit.challengeDurationDays || 30);
      setChallengeEndAction(habit.challengeEndAction || 'archive');
      setIsLocked(habit.isLocked || false);
      setUnlockCondition(habit.unlockCondition || { type: 'streak', value: 7 });
    } else {
      setName('');
      setDescription('');
      setIcon('💪');
      setFrequency('daily');
      setTimesPerWeek(3);
      setTimesPerMonth(4);
      setTargetDays([]);
      setIsChallenge(false);
      setChallengeDurationDays(30);
      setCustomDuration(30);
      setChallengeEndAction('archive');
      setIsLocked(false);
      setUnlockCondition({ type: 'streak', value: 7 });
    }
  }, [habit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const challengeStartDate = isChallenge ? new Date() : undefined;
    const finalDuration = challengeDurationDays === 0 ? customDuration : challengeDurationDays;
    const challengeEndDate = isChallenge && challengeStartDate 
      ? addDays(challengeStartDate, finalDuration) 
      : undefined;
    
    onSave({
      userId: '',
      name,
      category: 'Quotidien',
      context: 'Perso',
      estimatedTime: 15,
      description: description || undefined,
      deckId: habit?.deckId || '',
      frequency,
      timesPerWeek: frequency === 'x-times-per-week' ? timesPerWeek : undefined,
      timesPerMonth: frequency === 'x-times-per-month' ? timesPerMonth : undefined,
      targetDays: ['weekly', 'monthly', 'custom'].includes(frequency) ? targetDays : undefined,
      isActive: true,
      updatedAt: new Date(),
      order: habit?.order || 0,
      icon,
      isChallenge,
      challengeStartDate,
      challengeEndDate,
      challengeDurationDays: isChallenge ? finalDuration : undefined,
      challengeEndAction: isChallenge ? challengeEndAction : undefined,
      isLocked: isProgressionDeck ? isLocked : false,
      unlockCondition: isProgressionDeck && isLocked ? unlockCondition : undefined
    });
  };

  const toggleDay = (day: number) => {
    setTargetDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const getPreviewEndDate = () => {
    const duration = challengeDurationDays === 0 ? customDuration : challengeDurationDays;
    return format(addDays(new Date(), duration), 'PPP', { locale: fr });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{habit ? 'Modifier l\'habitude' : 'Nouvelle habitude'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="base" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="base">Base</TabsTrigger>
              <TabsTrigger value="frequency">Fréquence</TabsTrigger>
              <TabsTrigger value="advanced">Avancé</TabsTrigger>
            </TabsList>

            {/* Tab Base */}
            <TabsContent value="base" className="space-y-4 mt-4">
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
                      className={`text-2xl p-2 rounded border transition-colors ${
                        icon === emoji ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Tab Fréquence */}
            <TabsContent value="frequency" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="frequency">Fréquence</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as Habit['frequency'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HABIT_FREQUENCY_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="flex items-center gap-2">
                          <span>{option.icon}</span>
                          <span>{option.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {HABIT_FREQUENCY_OPTIONS.find(o => o.value === frequency)?.description}
                </p>
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
                    onChange={(e) => setTimesPerWeek(parseInt(e.target.value) || 1)}
                  />
                </div>
              )}

              {frequency === 'x-times-per-month' && (
                <div>
                  <Label htmlFor="timesMonth">Nombre de fois par mois</Label>
                  <Input
                    id="timesMonth"
                    type="number"
                    min={1}
                    max={31}
                    value={timesPerMonth}
                    onChange={(e) => setTimesPerMonth(parseInt(e.target.value) || 1)}
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
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      Semaine
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetDays([5, 6])}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                        targetDays.length === 2 && targetDays.includes(5) && targetDays.includes(6)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      Weekend
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetDays([0, 1, 2, 3, 4, 5, 6])}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                        targetDays.length === 7
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      Tous
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={`px-3 py-2 rounded border text-sm font-medium transition-colors ${
                          targetDays.includes(day.value)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border text-foreground hover:border-primary/50'
                        }`}
                      >
                        {day.short}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {frequency === 'monthly' && (
                <div>
                  <Label>Jours du mois</Label>
                  <div className="flex gap-2 mt-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setTargetDays([1])}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                        targetDays.length === 1 && targetDays[0] === 1
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      1er du mois
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetDays([1, 15])}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                        targetDays.length === 2 && targetDays.includes(1) && targetDays.includes(15)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      1er et 15
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {DAYS_OF_MONTH.map(day => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={`p-2 rounded border text-xs font-medium transition-colors ${
                          targetDays.includes(day.value)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border text-foreground hover:border-primary/50'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Tab Avancé */}
            <TabsContent value="advanced" className="space-y-6 mt-4">
              {/* Mode Challenge */}
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-500" />
                    <div>
                      <Label htmlFor="challenge-mode" className="cursor-pointer">Mode Challenge</Label>
                      <p className="text-xs text-muted-foreground">Habitude temporaire avec une durée limitée</p>
                    </div>
                  </div>
                  <Switch
                    id="challenge-mode"
                    checked={isChallenge}
                    onCheckedChange={setIsChallenge}
                  />
                </div>

                {isChallenge && (
                  <div className="space-y-4 pt-2 border-t">
                    <div>
                      <Label>Durée du challenge</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {CHALLENGE_DURATION_PRESETS.map(preset => (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => setChallengeDurationDays(preset.value)}
                            className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                              challengeDurationDays === preset.value
                                ? 'bg-orange-500 text-white border-orange-500'
                                : 'border-border text-muted-foreground hover:border-orange-500/50'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {challengeDurationDays === 0 && (
                      <div>
                        <Label htmlFor="customDuration">Durée personnalisée (jours)</Label>
                        <Input
                          id="customDuration"
                          type="number"
                          min={1}
                          max={365}
                          value={customDuration}
                          onChange={(e) => setCustomDuration(parseInt(e.target.value) || 1)}
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Fin prévue: {getPreviewEndDate()}</span>
                    </div>

                    <div>
                      <Label>À la fin du challenge</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {CHALLENGE_END_OPTIONS.map(option => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setChallengeEndAction(option.value)}
                            className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                              challengeEndAction === option.value
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'border-border text-muted-foreground hover:border-primary/50'
                            }`}
                            title={option.description}
                          >
                            {option.icon} {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Système de déverrouillage (uniquement si deck en mode progression) */}
              {isProgressionDeck && (
                <div className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-purple-500" />
                      <div>
                        <Label htmlFor="locked-mode" className="cursor-pointer">Habitude verrouillée</Label>
                        <p className="text-xs text-muted-foreground">Doit être débloquée par une autre habitude</p>
                      </div>
                    </div>
                    <Switch
                      id="locked-mode"
                      checked={isLocked}
                      onCheckedChange={setIsLocked}
                    />
                  </div>

                  {isLocked && (
                    <div className="space-y-4 pt-2 border-t">
                      <div>
                        <Label>Condition de déverrouillage</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {UNLOCK_CONDITION_OPTIONS.map(option => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setUnlockCondition(prev => ({ ...prev, type: option.value }))}
                              className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                                unlockCondition.type === option.value
                                  ? 'bg-purple-500 text-white border-purple-500'
                                  : 'border-border text-muted-foreground hover:border-purple-500/50'
                              }`}
                              title={option.description}
                            >
                              {option.icon} {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {unlockCondition.type !== 'manual' && (
                        <>
                          <div>
                            <Label htmlFor="prerequisiteHabit">Habitude prérequise</Label>
                            <Select 
                              value={unlockCondition.prerequisiteHabitId || ''} 
                              onValueChange={(v) => setUnlockCondition(prev => ({ ...prev, prerequisiteHabitId: v }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir une habitude..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableHabits.filter(h => h.id !== habit?.id).map(h => (
                                  <SelectItem key={h.id} value={h.id}>
                                    {h.icon} {h.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="unlockValue">
                              {unlockCondition.type === 'streak' ? 'Jours de streak minimum' : 'Nombre de complétions'}
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="unlockValue"
                                type="number"
                                min={1}
                                max={365}
                                value={unlockCondition.value || 7}
                                onChange={(e) => setUnlockCondition(prev => ({ ...prev, value: parseInt(e.target.value) || 1 }))}
                              />
                              {unlockCondition.type === 'streak' && (
                                <Flame className="h-5 w-5 text-orange-500" />
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              {habit ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default HabitModal;
