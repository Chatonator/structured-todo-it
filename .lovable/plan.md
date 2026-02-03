

# Plan : Améliorations de la Vue Timeline

## Objectif
Améliorer la vue Timeline avec :
1. Couleurs correctes des priorités et projets pour les tâches libres
2. Quota d'heures par défaut configurable dans les paramètres + modifiable manuellement dans la vue
3. Visualisation des tâches déjà planifiées (pas seulement celles à planifier)
4. Système de filtres avancés
5. Justification du texte trop long

## Analyse des Éléments Réutilisables

### Composants Sidebar à réutiliser
| Composant Sidebar | Utilisation Timeline | Modifications |
|-------------------|---------------------|---------------|
| `SidebarSearchFilter` | Filtres dans TaskDeckPanel | Adapter les types (enlever épinglées/récurrentes, ajouter priorité) |
| `SidebarSortSelector` | Tri dans TaskDeckPanel | Réutiliser directement |
| `getCategoryColor()` de SidebarTaskItem | Couleur barre gauche | Factoriser dans fichier partagé |

---

## Phase 1 : Factoriser les couleurs de catégorie

### Nouveau fichier : `src/lib/styling.ts`

Créer un fichier utilitaire partagé pour les couleurs :

```typescript
import { TaskCategory, CATEGORY_CONFIG, SUB_CATEGORY_CONFIG, SubTaskCategory } from '@/types/task';

export const getCategoryBorderColor = (category: TaskCategory): string => {
  return CATEGORY_CONFIG[category]?.borderPattern || 'border-l-4 border-l-muted';
};

export const getPriorityBorderColor = (subCategory?: SubTaskCategory): string => {
  return subCategory 
    ? SUB_CATEGORY_CONFIG[subCategory]?.pattern || 'border-l-4 border-l-muted'
    : 'border-l-4 border-l-muted';
};

export const getCategoryColor = (category: TaskCategory): string => {
  switch (category) {
    case 'Obligation': return 'bg-category-obligation';
    case 'Quotidien': return 'bg-category-quotidien';
    case 'Envie': return 'bg-category-envie';
    case 'Autres': return 'bg-category-autres';
    default: return 'bg-muted';
  }
};
```

---

## Phase 2 : Ajouter les couleurs aux TaskDeckItem et ScheduledEventCard

### Fichier : `src/components/timeline/panels/TaskDeckItem.tsx`

**Modifications :**
1. Ajouter la barre colorée de catégorie (comme SidebarTaskItem)
2. Afficher le badge de priorité avec couleurs
3. Afficher le nom du projet s'il existe
4. Justifier le texte long

```tsx
// Imports ajoutés
import { getCategoryColor, getPriorityBorderColor } from '@/lib/styling';
import { CATEGORY_CONFIG, SUB_CATEGORY_CONFIG } from '@/types/task';

// Dans le composant
const categoryColor = getCategoryColor(task.category);
const priorityBorder = getPriorityBorderColor(task.subCategory);
const priorityConfig = task.subCategory ? SUB_CATEGORY_CONFIG[task.subCategory] : null;

// JSX modifié
<div className={cn(
  "group flex items-start gap-2 p-2 rounded-md bg-card border transition-all cursor-pointer",
  priorityBorder,
  isDragging && "opacity-50 shadow-lg z-50",
  "hover:shadow-sm hover:bg-accent/50"
)}>
  {/* Barre catégorie */}
  <div className={cn("w-1 self-stretch rounded-full shrink-0", categoryColor)} />
  
  {/* Contenu */}
  <div className="flex-1 min-w-0">
    <p className="text-sm font-medium leading-tight line-clamp-2">{task.name}</p>
    
    {/* Badges */}
    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
      {/* Badge priorité coloré */}
      {priorityConfig && (
        <span className={cn(
          "text-[10px] px-1.5 py-0.5 rounded-full",
          priorityConfig.color
        )}>
          {task.subCategory}
        </span>
      )}
      
      {/* Durée */}
      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
        <Clock className="w-2.5 h-2.5" />
        {formatDuration(task.estimatedTime)}
      </span>
      
      {/* Contexte */}
      <span className="text-[10px]">
        {task.context === 'Pro' ? '💼' : '🏠'}
      </span>
    </div>
  </div>
</div>
```

### Fichier : `src/components/timeline/ScheduledEventCard.tsx`

Similaire : ajouter barre de catégorie colorée + justification du texte avec `line-clamp-2`.

---

## Phase 3 : Quota par défaut dans les paramètres

### Fichier : `src/types/preferences.ts`

Ajouter le champ de préférence :

```typescript
export interface UserPreferences {
  // ... autres champs
  
  // Timeline
  timelineDefaultQuota: number; // en minutes (défaut: 240 = 4h)
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  // ... autres valeurs
  
  // Timeline
  timelineDefaultQuota: 240,
};
```

### Nouveau fichier : `src/components/settings/sections/TimelineSettings.tsx`

Créer une section de paramètres pour la Timeline :

```tsx
import React from 'react';
import { SettingsSection } from '../common/SettingsSection';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Clock } from 'lucide-react';

const QUOTA_OPTIONS = [60, 120, 180, 240, 300, 360, 480, 600];

export const TimelineSettings: React.FC = () => {
  const { preferences, updatePreferences } = useUserPreferences();

  const formatHours = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h}h${m}` : `${h}h`;
  };

  return (
    <SettingsSection
      title="Planification journalière"
      description="Configurez vos préférences pour la vue Timeline"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Quota journalier par défaut
          </Label>
          <span className="text-lg font-semibold">
            {formatHours(preferences.timelineDefaultQuota)}
          </span>
        </div>
        
        <Slider
          value={[preferences.timelineDefaultQuota]}
          onValueChange={([value]) => updatePreferences({ timelineDefaultQuota: value })}
          min={60}
          max={600}
          step={30}
          className="w-full"
        />
        
        <p className="text-xs text-muted-foreground">
          Nombre d'heures de travail prévues par jour par défaut
        </p>
      </div>
    </SettingsSection>
  );
};
```

### Fichier : `src/components/settings/SettingsModal.tsx`

Ajouter l'onglet Timeline dans le modal de paramètres :

```tsx
// Import
import { TimelineSettings } from './sections/TimelineSettings';

// Dans les tabs
<TabsContent value="timeline">
  <TimelineSettings />
</TabsContent>
```

### Fichier : `src/hooks/useDayPlanning.ts`

Utiliser la préférence comme valeur par défaut :

```typescript
import { useUserPreferences } from '@/hooks/useUserPreferences';

export const useDayPlanning = () => {
  const { preferences } = useUserPreferences();
  const defaultQuota = preferences.timelineDefaultQuota || 240;
  
  const getQuotaForDate = useCallback((date: Date): number => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const config = configs.get(dateKey);
    return config?.quotaMinutes ?? defaultQuota;
  }, [configs, defaultQuota]);
  
  // ...
};
```

---

## Phase 4 : Afficher les tâches planifiées dans le panneau

### Fichier : `src/components/timeline/panels/TaskDeckPanel.tsx`

**Modifications :**
1. Ajouter un onglet/toggle pour basculer entre "À planifier" et "Planifiées"
2. Recevoir les événements planifiés en props
3. Afficher les deux listes

```tsx
interface TaskDeckPanelProps {
  tasks: Task[];
  scheduledEvents?: TimeEvent[]; // NOUVEAU
  projects?: Project[];
  onTaskClick?: (task: Task) => void;
  onEventClick?: (event: TimeEvent) => void; // NOUVEAU
  className?: string;
}

// État pour le toggle
const [showMode, setShowMode] = useState<'unscheduled' | 'scheduled'>('unscheduled');

// Dans le header, ajouter un toggle
<div className="flex gap-1 bg-muted/40 rounded-md p-0.5">
  <Button
    variant={showMode === 'unscheduled' ? 'secondary' : 'ghost'}
    size="sm"
    className="h-6 text-xs"
    onClick={() => setShowMode('unscheduled')}
  >
    À faire ({tasks.length})
  </Button>
  <Button
    variant={showMode === 'scheduled' ? 'secondary' : 'ghost'}
    size="sm"
    className="h-6 text-xs"
    onClick={() => setShowMode('scheduled')}
  >
    Planifiées ({scheduledEvents?.length || 0})
  </Button>
</div>

// Afficher la liste correspondante
{showMode === 'unscheduled' ? (
  // Decks existants
) : (
  // Liste des événements planifiés
  <ScheduledEventsList 
    events={scheduledEvents} 
    onEventClick={onEventClick}
  />
)}
```

### Nouveau composant : `src/components/timeline/panels/ScheduledEventsList.tsx`

Liste des événements planifiés avec possibilité de les dé-planifier :

```tsx
import { TimeEvent } from '@/lib/time/types';
import { ScheduledEventCard } from '../ScheduledEventCard';

interface ScheduledEventsListProps {
  events: TimeEvent[];
  onEventClick?: (event: TimeEvent) => void;
  onUnschedule?: (eventId: string) => void;
}

export const ScheduledEventsList: React.FC<ScheduledEventsListProps> = ({
  events,
  onEventClick,
  onUnschedule
}) => {
  // Grouper par date
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, TimeEvent[]>();
    events.forEach(event => {
      const dateKey = format(event.startsAt, 'yyyy-MM-dd');
      if (!grouped.has(dateKey)) grouped.set(dateKey, []);
      grouped.get(dateKey)!.push(event);
    });
    return grouped;
  }, [events]);

  return (
    <div className="space-y-3">
      {Array.from(eventsByDate.entries()).map(([dateKey, dayEvents]) => (
        <div key={dateKey}>
          <p className="text-xs font-medium text-muted-foreground mb-1.5 px-1">
            {format(new Date(dateKey), 'EEEE d MMM', { locale: fr })}
          </p>
          <div className="space-y-1">
            {dayEvents.map(event => (
              <ScheduledEventCard
                key={event.id}
                event={event}
                onClick={() => onEventClick?.(event)}
                onRemove={() => onUnschedule?.(event.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## Phase 5 : Système de filtres avancés

### Fichier : `src/components/timeline/panels/TimelineFilters.tsx`

Créer un composant de filtres adapté (basé sur SidebarSearchFilter) :

```tsx
export interface TimelineTaskFilters {
  categories: TaskCategory[];
  contexts: TaskContext[];
  priorities: SubTaskCategory[];
  sources: ('free' | 'project' | 'team')[];
}

// Réutiliser la structure de SidebarSearchFilter
// Mais adapter pour les besoins Timeline :
// - Filtrer par priorité (Le plus important, Important, etc.)
// - Filtrer par source (Libre, Projet, Équipe)
// - Pas de filtre épinglées/récurrentes
```

### Fichier : `src/components/timeline/panels/TaskDeckPanel.tsx`

Intégrer les filtres :

```tsx
import TimelineFilters, { TimelineTaskFilters } from './TimelineFilters';

const [filters, setFilters] = useState<TimelineTaskFilters>({
  categories: [],
  contexts: [],
  priorities: [],
  sources: []
});

// Appliquer les filtres
const filteredTasks = useMemo(() => {
  let result = [...tasks];
  
  // Recherche
  if (search) {
    result = result.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
  }
  
  // Catégories
  if (filters.categories.length > 0) {
    result = result.filter(t => filters.categories.includes(t.category));
  }
  
  // Contextes
  if (filters.contexts.length > 0) {
    result = result.filter(t => filters.contexts.includes(t.context));
  }
  
  // Priorités
  if (filters.priorities.length > 0) {
    result = result.filter(t => t.subCategory && filters.priorities.includes(t.subCategory));
  }
  
  // Sources
  if (filters.sources.length > 0) {
    result = result.filter(t => {
      const isTeam = !!(t as any).teamId;
      const isProject = !!t.projectId && !isTeam;
      const isFree = !t.projectId && !isTeam;
      
      return (
        (filters.sources.includes('free') && isFree) ||
        (filters.sources.includes('project') && isProject) ||
        (filters.sources.includes('team') && isTeam)
      );
    });
  }
  
  return result;
}, [tasks, search, filters]);
```

---

## Phase 6 : Justification du texte long

### Fichier : `src/components/timeline/panels/TaskDeckItem.tsx`

Remplacer `truncate` par `line-clamp-2` pour afficher jusqu'à 2 lignes :

```tsx
<p className="text-sm font-medium leading-tight line-clamp-2">
  {task.name}
</p>
```

### Fichier : `src/components/timeline/ScheduledEventCard.tsx`

Même modification :

```tsx
<span className={cn(
  "font-medium line-clamp-2",
  isCompleted && "line-through text-muted-foreground"
)}>
  {event.title}
</span>
```

### Fichier : `src/components/timeline/DraggableTask.tsx`

Même modification :

```tsx
<p className="text-sm font-medium line-clamp-2 leading-tight">{task.name}</p>
```

---

## Résumé des Fichiers Impactés

| Action | Fichier |
|--------|---------|
| Modifier | `src/lib/styling.ts` (ajouter fonctions couleurs) |
| Modifier | `src/types/preferences.ts` (ajouter timelineDefaultQuota) |
| Créer | `src/components/settings/sections/TimelineSettings.tsx` |
| Modifier | `src/components/settings/SettingsModal.tsx` (ajouter onglet) |
| Modifier | `src/hooks/useDayPlanning.ts` (utiliser préférence) |
| Modifier | `src/components/timeline/panels/TaskDeckItem.tsx` (couleurs + line-clamp) |
| Modifier | `src/components/timeline/panels/TaskDeckPanel.tsx` (toggle + filtres) |
| Créer | `src/components/timeline/panels/ScheduledEventsList.tsx` |
| Créer | `src/components/timeline/panels/TimelineFilters.tsx` |
| Modifier | `src/components/timeline/ScheduledEventCard.tsx` (couleurs + line-clamp) |
| Modifier | `src/components/timeline/DraggableTask.tsx` (line-clamp) |
| Modifier | `src/components/views/timeline/TimelineView.tsx` (passer scheduledEvents) |

---

## Ordre d'Exécution

| Étape | Description | Complexité |
|-------|-------------|------------|
| 1 | Factoriser les couleurs dans styling.ts | Faible |
| 2 | Ajouter préférence quota + TimelineSettings | Faible |
| 3 | Modifier useDayPlanning pour utiliser préférence | Faible |
| 4 | Ajouter couleurs et line-clamp aux TaskDeckItem | Faible |
| 5 | Créer ScheduledEventsList | Moyenne |
| 6 | Modifier TaskDeckPanel avec toggle À faire/Planifiées | Moyenne |
| 7 | Créer TimelineFilters (basé sur SidebarSearchFilter) | Moyenne |
| 8 | Intégrer les filtres dans TaskDeckPanel | Faible |
| 9 | Mettre à jour TimelineView pour passer les événements | Faible |

---

## Bénéfices

1. **Cohérence visuelle** : Les couleurs de priorité/catégorie sont identiques à la sidebar
2. **Personnalisation** : L'utilisateur peut définir son quota journalier par défaut
3. **Visibilité complète** : Voir les tâches à planifier ET celles déjà planifiées au même endroit
4. **Filtrage puissant** : Retrouver rapidement une tâche par catégorie, priorité ou source
5. **Lisibilité** : Les textes longs sont affichés sur 2 lignes maximum au lieu d'être tronqués
6. **Code partagé** : Réutilisation des patterns de la sidebar pour moins de duplication

