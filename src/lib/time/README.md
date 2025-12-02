# Système de Gestion Temporelle Unifié

Ce système fournit une architecture unifiée pour gérer tous les événements temporels de l'application (tâches, habitudes, défis, etc.).

## Architecture

### 1. Tables de Base de Données

#### `time_events`
Stocke tous les événements temporels sous une forme normalisée.

**Colonnes principales:**
- `entity_type`: Type d'entité ('task', 'habit', 'challenge', etc.)
- `entity_id`: ID de l'entité source
- `starts_at`: Date/heure de début
- `duration`: Durée en minutes
- `recurrence`: Configuration de récurrence (JSON)
- `status`: État de l'événement ('scheduled', 'completed', 'cancelled', etc.)

#### `time_occurrences`
Stocke les occurrences calculées d'événements récurrents.

### 2. Composants du Système

#### TimeEngine (`src/lib/time/TimeEngine.ts`)
Moteur central qui coordonne tous les calculs temporels.

```typescript
import { TimeEngine } from '@/lib/time';

const engine = new TimeEngine();

// Calculer les occurrences d'un événement
const occurrences = engine.getOccurrences(event, dateRange);

// Détecter les conflits
const conflicts = engine.checkConflicts(newEvent, existingEvents);

// Trouver des créneaux libres
const freeSlots = engine.findFreeSlots(dateRange, events, minDuration);
```

#### EventNormalizer (`src/lib/time/EventNormalizer.ts`)
Convertit différents types d'entités en TimeEvents normalisés.

```typescript
import { EventNormalizer } from '@/lib/time';

// Convertir une Task en TimeEvent
const timeEvent = EventNormalizer.taskToTimeEvent(task, userId);

// Convertir un Habit en TimeEvent
const timeEvent = EventNormalizer.habitToTimeEvent(habit, userId);
```

#### EventRegistry (`src/lib/time/EventRegistry.ts`)
Gère le CRUD des événements dans la base de données.

```typescript
import { EventRegistry } from '@/lib/time';

// Créer un événement
await EventRegistry.createEvent(timeEvent);

// Récupérer des événements
const events = await EventRegistry.fetchEvents(userId, dateRange);

// Mettre à jour un événement
await EventRegistry.updateEvent(eventId, updates);
```

#### useTimeHub (`src/hooks/useTimeHub.ts`)
Hook React qui intègre le système avec les composants UI.

```typescript
import { useTimeHub } from '@/hooks/useTimeHub';

function MyComponent() {
  const {
    events,              // Tous les événements chargés
    occurrences,         // Occurrences calculées
    loading,             // État de chargement
    createEventFromTask, // Créer depuis une Task
    createEventFromHabit,// Créer depuis un Habit
    checkConflicts,      // Vérifier les conflits
    findFreeSlots,       // Trouver créneaux libres
  } = useTimeHub(dateRange);

  // Utiliser les données...
}
```

### 3. Composants UI

#### TimelineView (`src/components/timeline/TimelineView.tsx`)
Vue unifiée de tous les événements dans une timeline.

**Fonctionnalités:**
- Affichage par jour ou par semaine
- Navigation temporelle
- Statistiques (temps occupé/libre)
- Marquage de complétion
- Filtrage par type d'événement

#### TimelineSyncButton (`src/components/timeline/TimelineSyncButton.tsx`)
Bouton pour synchroniser les données existantes vers le nouveau système.

## Utilisation

### Synchronisation Initiale

Pour synchroniser les tâches et habitudes existantes:

1. Cliquer sur le bouton "Synchroniser" dans l'en-tête de l'application
2. L'edge function `time-sync` sera appelée automatiquement
3. Toutes les tâches planifiées et habitudes actives seront converties en `time_events`

### Accès à la Timeline

La timeline est accessible via la navigation principale:
- **Desktop**: Bouton "Timeline" dans la barre de navigation
- **Mobile**: Menu hamburger → Timeline

### Créer des Événements

```typescript
// Depuis une tâche
const timeEvent = await createEventFromTask(task);

// Depuis une habitude
const timeEvent = await createEventFromHabit(habit);
```

### Vérifier les Conflits

```typescript
const newEvent = {
  startsAt: new Date('2024-01-15T10:00:00'),
  duration: 60,
  // ...autres propriétés
};

const conflicts = checkConflicts(newEvent);
if (conflicts.length > 0) {
  console.log('Conflits détectés:', conflicts);
}
```

### Trouver des Créneaux Libres

```typescript
// Trouver tous les créneaux de 30 minutes minimum
const freeSlots = findFreeSlots(30);

freeSlots.forEach(slot => {
  console.log(`Libre de ${slot.start} à ${slot.end} (${slot.duration} min)`);
});
```

## Types de Récurrence

Le système supporte plusieurs types de récurrence:

- `once`: Événement unique
- `daily`: Quotidien
- `weekly`: Hebdomadaire (avec jours spécifiques)
- `bi-weekly`: Toutes les 2 semaines
- `monthly`: Mensuel (avec jour du mois spécifique)
- `yearly`: Annuel
- `custom`: Pattern personnalisé (RRULE)

## Calculs Temporels

### DateCalculator
Fonctions utilitaires pour les calculs de dates:
- Vérification de chevauchement
- Calcul de durée
- Manipulation de dates

### RecurrenceResolver
Calcul des occurrences d'événements récurrents:
- Génération d'occurrences dans un range
- Calcul de la prochaine occurrence
- Support de patterns complexes

### ConflictChecker
Détection de conflits d'horaire:
- Vérification de conflits
- Calcul de temps occupé/libre
- Recherche de créneaux disponibles

## Migration et Compatibilité

Le système est conçu pour coexister avec le système existant:

1. Les anciennes `Task` et `Habit` continuent de fonctionner
2. La synchronisation vers `time_events` est optionnelle
3. Les deux systèmes peuvent être utilisés simultanément
4. Migration progressive possible

## Performance

- Les occurrences sont calculées à la demande
- Les événements sont mis en cache par `useTimeHub`
- Les calculs de récurrence sont optimisés
- Rechargement automatique lors des changements

## Edge Functions

### time-sync
Synchronise les données existantes vers le nouveau système.

**Endpoint:** `supabase.functions.invoke('time-sync')`

**Authentification:** Requise (JWT)

**Réponse:**
```json
{
  "success": true,
  "syncedEvents": 42,
  "syncedTasks": 28,
  "syncedHabits": 14
}
```

## Développement Futur

Fonctionnalités prévues:
- Notifications avant événements
- Suggestions de planification intelligente
- Détection automatique de conflits lors de la création
- Synchronisation temps réel
- Export/import de calendrier (iCal)
- Intégration avec calendriers externes
