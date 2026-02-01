
# Timeline 2.0 - Vue de Planification

> **Status: MVP Implémenté (Phases 1-3)** ✅

## Contexte et Analyse

### Etat actuel
La Timeline actuelle est une vue passive qui affiche les événements planifiés sans permettre de réelle interaction de planification. Le système temporel (`time_events`, `useTimeHub`, `TimeEngine`) est bien en place mais sous-exploité.

### Problèmes identifiés
- Impossible de planifier directement depuis la vue Timeline
- Les tâches non planifiées sont invisibles dans cette vue
- Aucune représentation visuelle des créneaux horaires disponibles
- Pas de drag-and-drop pour organiser sa journée

## Architecture Proposée

### Vue d'ensemble

```text
+------------------------------------------------------------------+
|  TIMELINE 2.0                                                     |
+------------------------------------------------------------------+
|  [Jour] [Semaine]        < Lun 3 Fév >        [Aujourd'hui]      |
+------------------------------------------------------------------+
|                                                                   |
|  +------------------------+  +----------------------------------+ |
|  | BACKLOG NON PLANIFIÉ   |  | GRILLE HORAIRE                   | |
|  |------------------------|  |----------------------------------| |
|  | [Filtre: Toutes]       |  |  08:00 |                        | |
|  |                        |  |  ------|  Réunion équipe        | |
|  | ○ Rédiger rapport      |  |  09:00 |  [45min] ████████████  | |
|  |   1h30 · Crucial       |  |  ------|                        | |
|  |                        |  |  10:00 |                        | |
|  | ○ Appeler fournisseur  |  |  ------|  Révision code         | |
|  |   30min · Régulier     |  |  11:00 |  [1h] ██████████████   | |
|  |                        |  |  ------|                        | |
|  | ○ Préparer présentation|  |  12:00 |  ~~~~~ LIBRE ~~~~~     | |
|  |   2h · Envie           |  |  ------|                        | |
|  |                        |  |  13:00 |  Déjeuner              | |
|  +------------------------+  |  ------|                        | |
|                              +----------------------------------+ |
|                                                                   |
+------------------------------------------------------------------+
|  Stats: 4h planifiées · 2h libres · 3 tâches non planifiées      |
+------------------------------------------------------------------+
```

## Plan d'Implémentation

### Phase 1 - Grille Horaire Interactive
Création d'un composant `TimeGrid` avec représentation visuelle des créneaux

**Fichiers à créer:**
- `src/components/timeline/TimeGrid.tsx` - Grille des heures (6h-22h par défaut)
- `src/components/timeline/TimeSlot.tsx` - Créneau individuel cliquable
- `src/components/timeline/ScheduledEvent.tsx` - Bloc d'événement planifié

**Fonctionnalités:**
- Affichage des heures en colonnes/lignes selon le mode (jour/semaine)
- Visualisation claire des événements avec durée proportionnelle
- Indicateurs visuels des créneaux libres vs occupés
- Ligne "maintenant" qui suit l'heure actuelle

### Phase 2 - Backlog des Tâches Non Planifiées
Panneau latéral listant les tâches à planifier

**Fichiers à créer:**
- `src/components/timeline/UnscheduledTasksPanel.tsx` - Panneau des tâches sans date
- `src/components/timeline/DraggableTask.tsx` - Carte de tâche draggable

**Fonctionnalités:**
- Liste filtrable (par catégorie, contexte, durée)
- Affichage du temps estimé et de la priorité
- Tri par priorité, durée, date de création
- Compteur des tâches en attente

### Phase 3 - Drag & Drop avec @dnd-kit
Interaction de glisser-déposer pour planifier les tâches

**Fichiers à modifier:**
- `src/components/views/timeline/TimelineView.tsx` - Refonte complète

**Fichiers à créer:**
- `src/components/timeline/DndContext.tsx` - Contexte drag-and-drop
- `src/hooks/useTimelineScheduling.ts` - Logique de planification

**Fonctionnalités:**
- Drag depuis le backlog vers la grille
- Snap automatique sur les créneaux de 15min
- Prévisualisation pendant le drag
- Détection des conflits en temps réel
- Feedback visuel (zones de drop valides/invalides)

### Phase 4 - Interactions Avancées
Édition in-place et manipulation des événements

**Fonctionnalités:**
- Clic sur créneau vide = création rapide d'événement
- Resize des événements (ajuster la durée)
- Move des événements (changer l'heure)
- Double-clic = édition complète
- Menu contextuel (compléter, dé-planifier, éditer, supprimer)

### Phase 5 - Suivi Temporel (Objectif Secondaire)
Historique et prochaines occurrences

**Fichiers à créer:**
- `src/components/timeline/TaskTimeline.tsx` - Historique d'une tâche
- `src/components/timeline/RecurringPreview.tsx` - Prochaines occurrences

**Fonctionnalités:**
- Badge avec date de création sur les tâches
- Historique des complétions dans le détail d'une tâche
- Vue des 5 prochaines occurrences pour les tâches récurrentes
- Mini-calendrier de chaleur pour les récurrences

## Détails Techniques

### Structure des Composants

```text
TimelineView (refonte)
├── TimelineHeader
│   ├── DateNavigation
│   ├── ViewModeToggle
│   └── StatsBar
├── TimelineContent (nouveau layout)
│   ├── UnscheduledTasksPanel
│   │   ├── PanelFilters
│   │   └── DraggableTaskList
│   └── TimeGrid
│       ├── TimeGutter (colonne des heures)
│       ├── DayColumn(s)
│       │   ├── TimeSlots
│       │   └── ScheduledEvents
│       └── CurrentTimeIndicator
└── TimelineFooter
    └── SummaryStats
```

### Hook useTimelineScheduling

```text
useTimelineScheduling()
├── Données
│   ├── unscheduledTasks: Task[]
│   ├── scheduledEvents: TimeEvent[]
│   └── conflicts: ConflictResult[]
├── Actions
│   ├── scheduleTask(taskId, datetime, duration)
│   ├── rescheduleEvent(eventId, newDatetime)
│   ├── resizeEvent(eventId, newDuration)
│   ├── unscheduleEvent(eventId)
│   └── completeEvent(eventId)
└── Calculs
    ├── getFreeSlots(date)
    ├── checkConflict(datetime, duration)
    └── getSuggestedSlots(task)
```

### Intégration avec le Système Existant

Le système `time_events` existant est parfaitement adapté. Les modifications principales seront:

1. **useTasks**: Ajouter un filtre pour les tâches non planifiées (sans `time_event` associé)
2. **useTimeEventSync**: Utiliser pour créer/mettre à jour les événements lors du drag-drop
3. **useTimeHub**: Étendre pour inclure les calculs de créneaux libres

## Estimation et Priorités

| Phase | Composants | Priorité | Complexité |
|-------|------------|----------|------------|
| 1 | TimeGrid | Haute | Moyenne |
| 2 | UnscheduledPanel | Haute | Faible |
| 3 | Drag & Drop | Haute | Élevée |
| 4 | Interactions | Moyenne | Moyenne |
| 5 | Suivi temporel | Basse | Faible |

Les phases 1-3 constituent le MVP de la planification et répondent à l'objectif principal.
