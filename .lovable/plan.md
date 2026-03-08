

## Diagnostic : Mauvais fichier edite

Toutes les modifications precedentes (couleurs de categorie, bouton "Aujourd'hui" visible) ont ete appliquees au fichier **`src/components/timeline/TimelineView.tsx`** (ancien composant orphelin).

L'application charge en realite **`src/components/views/timeline/TimelineView.tsx`** via le `viewRegistry`. C'est un composant completement different, avec drag-and-drop, TaskDeckPanel, blocs Matin/Apres-midi/Soir.

Les corrections n'ont donc jamais ete visibles.

## Mapping de la vue Timeline reelle

```text
viewRegistry.ts
  └─ src/components/views/timeline/TimelineView.tsx   ← COMPOSANT ACTIF
       ├─ useTimelineScheduling (hook principal)
       ├─ useDayPlanning (quotas)
       ├─ TaskDeckPanel (panneau gauche : taches non planifiees)
       │    └─ TaskDeckItem (carte dans le deck)
       ├─ DayPlanningView (zone droite en mode jour)
       │    └─ TimeBlockRow (3 colonnes : Matin | Apres-midi | Soir)
       │         └─ ScheduledEventCard  ← CARTE DE TACHE PLANIFIEE
       └─ WeekPlanningView (mode semaine)
            └─ CompactDayColumn
```

## Probleme des couleurs

`ScheduledEventCard` (ligne 49) fait `(event as any).category` pour obtenir la couleur. Mais `TimeEvent` ne contient pas de champ `category` — il n'est jamais stocke ni transmis. Donc `categoryColor` vaut toujours `'bg-primary'` (couleur par defaut).

**Solution** : enrichir `ScheduledEventCard` en lui fournissant la categorie de la tache source. Deux approches possibles, la plus simple et performante :
- Dans `TimelineView`, creer un `taskCategoryMap` (comme fait dans l'ancien fichier) et passer la categorie comme prop a `DayPlanningView` → `TimeBlockRow` → `ScheduledEventCard`.
- Alternative : faire le lookup directement dans `ScheduledEventCard` via `useTasks` (mais plus lourd).

Je propose l'approche par map qui descend via props.

## Probleme du bouton "Aujourd'hui"

Le bouton actuel (ligne 332) est un simple `variant="ghost"` sans distinction visuelle quand on n'est pas sur le jour actuel. Il faut le rendre visible comme dans l'ancien correctif : style accentue + icone Home quand `selectedDate` n'est pas aujourd'hui.

## Plan d'implementation

### 1. Bouton "Aujourd'hui" visible (`src/components/views/timeline/TimelineView.tsx`)

- Ajouter `isSameDay` import et `isViewingToday` variable
- Modifier le bouton de navigation pour qu'il soit `variant="default"` avec `animate-pulse` quand on n'est pas sur aujourd'hui, `variant="ghost"` sinon

### 2. Couleurs de categorie dans les cartes planifiees

**Fichiers touches** :
- `src/components/views/timeline/TimelineView.tsx` : creer `taskCategoryMap` via `useTasks`, passer aux composants enfants
- `src/components/timeline/planning/DayPlanningView.tsx` : accepter et transmettre `taskCategoryMap`
- `src/components/timeline/planning/TimeBlockRow.tsx` : accepter et transmettre `taskCategoryMap`
- `src/components/timeline/ScheduledEventCard.tsx` : accepter `category?: TaskCategory` en prop, l'utiliser au lieu du cast `(event as any).category`
- `src/components/timeline/planning/WeekPlanningView.tsx` : meme pattern pour la vue semaine

Le `taskCategoryMap` associe `entityId → TaskCategory` pour que chaque `ScheduledEventCard` affiche la bonne couleur de barre laterale.

### 3. Nettoyage de l'ancien fichier

- Supprimer `src/components/timeline/TimelineView.tsx` (orphelin, jamais utilise par l'app)

