
# Plan : Refonte de la Vue Timeline

## Problèmes Identifiés

### Bug 1 : Planification toujours au jour actuel
**Cause** : Dans `useTimelineScheduling.ts`, la fonction `scheduleTask` reçoit correctement la date du slot mais le `syncTaskEventWithSchedule` utilise `scheduleInfo.date!.toISOString().split('T')[0]` qui devrait fonctionner. Le problème vient probablement de la date passée par le TimeSlot qui n'est pas correctement propagée.

**Analyse du flux** :
1. `TimeSlot` → `handleDragEnd` → reçoit `overData.date` 
2. Mais `TimeSlot` passe `date={day}` où `day` est calculé depuis `selectedDate`
3. Le problème : `day` est bien une Date mais quand elle est passée via `droppable.data`, elle peut perdre son type

### Bug 2 : Projets et tâches mélangés sans identification
**Cause** : Le panneau `UnscheduledTasksPanel` affiche toutes les tâches sans distinction de leur origine (projet, tâche libre, équipe).

### Bug 3 : Tâches planifiées dépassées = "perdues"
**Cause** : `EventRegistry.fetchEvents` filtre par date range, donc les événements passés ne sont pas affichés. Une tâche planifiée hier mais non validée disparaît de la vue.

### Bug 4 : Vue semaine ne fonctionne pas
**Cause** : La `TimeGrid` génère correctement les jours mais le `eventsByDay` ne reçoit que les événements de la date range courante. Si la vue semaine est sélectionnée, les événements devraient s'afficher sur plusieurs colonnes.

### Bug 5 : Créneaux horaires vs Blocs temporels
**Demande** : Remplacer la grille horaire précise par 3 blocs (Matin/Après-midi/Soir) avec un quota d'heures par jour.

---

## Architecture Proposée

### Nouveau Modèle de Données

```text
┌─────────────────────────────────────────────────────────────────┐
│                    PLANNING JOURNALIER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Lundi 3 février          Quota: 4h / 4h ✓                   │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │ 🌅 MATIN (6h-12h)                                       │  │
│   │   • Tâche A (30min) - Projet X                          │  │
│   │   • Tâche B (1h) - Perso                                │  │
│   └─────────────────────────────────────────────────────────┘  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │ ☀️ APRÈS-MIDI (12h-18h)                                 │  │
│   │   • Tâche C (1h30) - Équipe Y                           │  │
│   └─────────────────────────────────────────────────────────┘  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │ 🌙 SOIR (18h-22h)                                       │  │
│   │   • Tâche D (1h) - Perso                                │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Plan d'Implémentation

### Phase 1 : Corriger le bug de date lors du drag-drop

**Fichier** : `src/components/timeline/TimeSlot.tsx`

Le TimeSlot passe `date` dans `droppable.data` mais les objets Date peuvent être sérialisés en string. Correction :

```typescript
// Avant
data: {
  type: 'time-slot',
  date,        // Date object - peut devenir string
  hour,
  minute
}

// Après
data: {
  type: 'time-slot',
  date: date.toISOString(),  // Explicitement string ISO
  hour,
  minute
}
```

**Fichier** : `src/components/views/timeline/TimelineView.tsx`

```typescript
// Dans handleDragEnd, reconvertir en Date
if (overData?.type === 'time-slot') {
  const date = new Date(overData.date); // S'assurer que c'est une Date
  const { hour, minute } = overData;
  // ...
}
```

---

### Phase 2 : Ajouter des sélecteurs de source dans le panneau de tâches

**Fichier** : `src/components/timeline/UnscheduledTasksPanel.tsx`

Ajouter un filtre par source :
- Toutes
- Tâches libres (sans projectId)
- Par projet (liste des projets)
- Équipe (si applicable)

```typescript
type SourceFilter = 'all' | 'free-tasks' | 'project' | 'team';

// Nouveau state
const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

// Afficher un badge d'origine sur chaque tâche
```

**Fichier** : `src/components/timeline/DraggableTask.tsx`

Ajouter l'affichage de l'origine :
```tsx
{/* Source badge */}
{task.projectId && (
  <span className="text-[10px] bg-project/10 text-project px-1 rounded">
    📁 {projectName}
  </span>
)}
{!task.projectId && (
  <span className="text-[10px] bg-muted text-muted-foreground px-1 rounded">
    📋 Tâche
  </span>
)}
```

---

### Phase 3 : Gérer les tâches planifiées dépassées

**Nouveau composant** : `src/components/timeline/OverdueTasksAlert.tsx`

Affiche une alerte si des tâches planifiées sont dépassées et non validées.

**Fichier** : `src/hooks/useTimelineScheduling.ts`

Ajouter une requête pour les événements passés non complétés :

```typescript
const overdueEvents = useMemo(() => {
  const now = new Date();
  return events.filter(e => 
    e.startsAt < now && 
    e.status !== 'completed' && 
    e.status !== 'cancelled'
  );
}, [events]);
```

**Fichier** : `src/lib/time/EventRegistry.ts`

Ajouter une méthode pour récupérer les événements dépassés :

```typescript
static async fetchOverdueEvents(userId: string): Promise<TimeEvent[]> {
  const now = new Date();
  const { data, error } = await supabase
    .from('time_events')
    .select('*')
    .eq('user_id', userId)
    .lt('starts_at', now.toISOString())
    .in('status', ['scheduled', 'in-progress'])
    .neq('status', 'completed');
  // ...
}
```

---

### Phase 4 : Implémenter les blocs temporels (Matin/Après-midi/Soir)

**Nouveau type** : `src/lib/time/types.ts`

```typescript
export type TimeBlock = 'morning' | 'afternoon' | 'evening';

export interface DayPlanningConfig {
  date: Date;
  quotaMinutes: number;  // Quota d'heures pour la journée
  blocks: {
    morning: boolean;    // Activé ou non
    afternoon: boolean;
    evening: boolean;
  };
}

export const TIME_BLOCKS = {
  morning: { label: 'Matin', icon: '🌅', startHour: 6, endHour: 12 },
  afternoon: { label: 'Après-midi', icon: '☀️', startHour: 12, endHour: 18 },
  evening: { label: 'Soir', icon: '🌙', startHour: 18, endHour: 22 }
} as const;
```

**Nouveau composant** : `src/components/timeline/DayPlanningCard.tsx`

Carte pour une journée avec :
- Header : Date + Quota (ex: "3h / 4h")
- 3 sections droppables : Matin, Après-midi, Soir
- Barre de progression du quota
- Possibilité de déplacer les tâches entre blocs

```typescript
interface DayPlanningCardProps {
  date: Date;
  quota: number;  // en minutes
  events: TimeEvent[];
  onDropTask: (taskId: string, block: TimeBlock) => void;
  onRemoveTask: (eventId: string) => void;
}
```

**Nouveau composant** : `src/components/timeline/TimeBlockDropZone.tsx`

Zone droppable pour un bloc horaire :

```typescript
interface TimeBlockDropZoneProps {
  block: TimeBlock;
  date: Date;
  events: TimeEvent[];
  isOver: boolean;
  isFull: boolean;  // Quota dépassé
}
```

**Nouveau composant** : `src/components/timeline/QuotaSelector.tsx`

Sélecteur de quota journalier :

```typescript
// Heures disponibles : 0, 1h, 2h, 3h, 4h, 5h, 6h, 8h
const QUOTA_OPTIONS = [0, 60, 120, 180, 240, 300, 360, 480];
```

---

### Phase 5 : Stocker les quotas journaliers

**Migration DB** : Nouvelle table `day_planning_config`

```sql
CREATE TABLE public.day_planning_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  quota_minutes INTEGER NOT NULL DEFAULT 240,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);
```

**Nouveau hook** : `src/hooks/useDayPlanning.ts`

```typescript
export const useDayPlanning = () => {
  const getQuotaForDate = (date: Date) => { ... };
  const setQuotaForDate = (date: Date, minutes: number) => { ... };
  const getDefaultWeeklyQuotas = () => { ... };
};
```

---

### Phase 6 : Modifier le modèle TimeEvent pour les blocs

**Fichier** : `src/lib/time/types.ts`

Ajouter un champ optionnel pour le bloc :

```typescript
export interface TimeEvent {
  // ... champs existants
  timeBlock?: TimeBlock;  // morning | afternoon | evening
}
```

**Migration DB** :

```sql
ALTER TABLE public.time_events 
ADD COLUMN time_block TEXT DEFAULT NULL;
```

---

### Phase 7 : Refonte de TimelineView

**Fichier** : `src/components/views/timeline/TimelineView.tsx`

Nouvelle structure :

```tsx
<ViewLayout>
  {/* Stats */}
  <ViewStats stats={stats} />
  
  {/* Navigation */}
  <DateNavigation 
    date={selectedDate}
    viewMode={viewMode}
    onPrevious={...}
    onNext={...}
    onToday={...}
  />
  
  {/* Alerte tâches dépassées */}
  {overdueEvents.length > 0 && (
    <OverdueTasksAlert 
      events={overdueEvents}
      onReschedule={...}
      onCancel={...}
    />
  )}
  
  {/* Contenu principal */}
  <div className="flex gap-4">
    {/* Panneau gauche : Tâches à planifier */}
    <UnscheduledTasksPanel 
      tasks={unscheduledTasks}
      sourceFilter={sourceFilter}
      onSourceFilterChange={...}
    />
    
    {/* Vue jour : DayPlanningCard unique */}
    {viewMode === 'day' && (
      <DayPlanningCard
        date={selectedDate}
        quota={dayQuota}
        events={dayEvents}
        onQuotaChange={...}
      />
    )}
    
    {/* Vue semaine : 7 DayPlanningCard */}
    {viewMode === 'week' && (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => (
          <DayPlanningCard
            key={day.toISOString()}
            date={day}
            quota={getQuota(day)}
            events={getEventsForDay(day)}
            compact
          />
        ))}
      </div>
    )}
  </div>
</ViewLayout>
```

---

## Résumé des Fichiers

| Action | Fichier |
|--------|---------|
| Modifier | `src/components/timeline/TimeSlot.tsx` (fix date serialization) |
| Modifier | `src/components/views/timeline/TimelineView.tsx` (refonte complète) |
| Modifier | `src/components/timeline/UnscheduledTasksPanel.tsx` (filtres source) |
| Modifier | `src/components/timeline/DraggableTask.tsx` (badges origine) |
| Modifier | `src/hooks/useTimelineScheduling.ts` (overdueEvents + blocks) |
| Modifier | `src/lib/time/EventRegistry.ts` (fetchOverdueEvents) |
| Modifier | `src/lib/time/types.ts` (TimeBlock, TIME_BLOCKS) |
| Créer | `src/components/timeline/DayPlanningCard.tsx` |
| Créer | `src/components/timeline/TimeBlockDropZone.tsx` |
| Créer | `src/components/timeline/QuotaSelector.tsx` |
| Créer | `src/components/timeline/OverdueTasksAlert.tsx` |
| Créer | `src/hooks/useDayPlanning.ts` |
| Migration | Ajouter `time_block` à `time_events` |
| Migration | Créer table `day_planning_config` |

---

## Ordre d'Exécution

| Étape | Description | Priorité |
|-------|-------------|----------|
| 1 | Fix bug date drag-drop | Critique |
| 2 | Ajouter filtres source dans panneau | Haute |
| 3 | Gérer tâches dépassées (overdue) | Haute |
| 4 | Migrations DB (time_block + day_planning_config) | Moyenne |
| 5 | Créer composants blocs (DayPlanningCard, TimeBlockDropZone) | Moyenne |
| 6 | Créer QuotaSelector et hook useDayPlanning | Moyenne |
| 7 | Refonte TimelineView avec nouvelle architecture | Moyenne |
| 8 | Adapter vue semaine | Basse |
| 9 | Tests et ajustements | Basse |

---

## Bénéfices

1. **Bug fix date** : Les tâches seront planifiées au bon jour
2. **Clarté** : Identification claire de l'origine de chaque tâche (projet, libre, équipe)
3. **Pas de perte** : Les tâches dépassées sont visibles et facilement replanifiables
4. **Flexibilité** : Le système de quotas permet de planifier sans contrainte horaire précise
5. **Vue semaine fonctionnelle** : Navigation et affichage correct sur 7 jours
6. **UX simplifiée** : 3 blocs au lieu de créneaux de 15 minutes = moins de décisions à prendre
