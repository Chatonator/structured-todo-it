
# Plan de refactorisation de la vue Timeline

## Problèmes identifiés

1. **Densité excessive en vue semaine** : Les 7 DayPlanningCards avec leurs 3 blocs horaires (matin/midi/soir) créent une grille très chargée et peu lisible
2. **Répartition de l'espace** : Le panneau des tâches à planifier (w-80) et les cartes planning ne sont pas équilibrés
3. **Lisibilité des tâches non planifiées** : Les badges sont nombreux et petits, rendant la lecture difficile
4. **Manque de regroupement logique** : Les tâches à planifier sont listées à plat sans organisation par deck/catégorie
5. **Redondance visuelle** : Les 3 zones temporelles (matin/midi/soir) sont toujours affichées même vides

---

## Solutions proposées

### 1. Nouveau composant `TaskDeckPanel` pour remplacer `UnscheduledTasksPanel`

Regrouper les tâches à planifier en "decks" visuels :
- **Deck "Tâches libres"** : tâches personnelles sans projet
- **Deck par projet** : tâches groupées par projet avec icône/couleur
- **Deck "Équipe"** : tâches d'équipe

Chaque deck sera collapsible avec un header affichant :
- Icône + nom du deck
- Nombre de tâches
- Temps total estimé

### 2. Composant `CompactDayColumn` pour la vue semaine

Remplacer `DayPlanningCard` en mode compact par une version épurée :
- En-tête minimaliste (jour + date)
- Zone de drop unique (pas de séparation matin/midi/soir)
- Affichage condensé des tâches planifiées (titre tronqué + durée)
- Indicateur de remplissage (barre de progression)

### 3. Composant `TimeBlockRow` pour la vue jour

Réorganiser les blocs horizontalement plutôt que verticalement :
- Layout en 3 colonnes (Matin | Après-midi | Soir)
- Plus d'espace pour les événements
- Meilleure utilisation de l'espace horizontal

### 4. Amélioration du `DraggableTask` 

Simplifier l'affichage des badges :
- Badge source unique (icône seulement par défaut)
- Durée toujours visible
- Priorité via couleur de bordure gauche
- Expansion au hover pour plus de détails

### 5. Nouveau layout responsive

- Mobile : panneau tâches en bottom sheet collapsible
- Tablette : sidebar 240px + planning
- Desktop : sidebar 280px + planning large

---

## Architecture des fichiers

```text
src/components/timeline/
├── TimelineView.tsx          # Refactorisé - orchestration
├── panels/
│   ├── TaskDeckPanel.tsx     # NOUVEAU - panneau avec decks
│   ├── TaskDeck.tsx          # NOUVEAU - un deck collapsible
│   └── TaskDeckItem.tsx      # NOUVEAU - item dans un deck
├── planning/
│   ├── DayPlanningView.tsx   # NOUVEAU - vue jour améliorée
│   ├── WeekPlanningView.tsx  # NOUVEAU - vue semaine épurée
│   ├── TimeBlockRow.tsx      # NOUVEAU - blocs horizontaux
│   └── CompactDayColumn.tsx  # NOUVEAU - colonne jour compacte
└── ... (composants existants)
```

---

## Détails techniques

### TaskDeckPanel (nouveau)

```typescript
interface TaskDeckPanelProps {
  tasks: Task[];
  projects: Project[];
  onTaskClick?: (task: Task) => void;
}

// Structure interne des decks
interface TaskDeck {
  id: string;
  name: string;
  icon: string;
  color: string;
  tasks: Task[];
  totalTime: number;
}
```

Le panneau :
- Groupe automatiquement par source (libre/projet/équipe)
- Affiche les decks comme des accordéons
- Garde le drag-and-drop fonctionnel via `@dnd-kit`

### WeekPlanningView (nouveau)

Simplifications pour la vue semaine :
- Suppression des blocs matin/midi/soir en mode compact
- Une seule zone de drop par jour
- Affichage des tâches en liste verticale compacte
- Quota journalier affiché en barre de progression discrète

### TimeBlockRow (nouveau)

Pour la vue jour, disposition horizontale :
```
┌─────────────────────────────────────────────────────────┐
│  🌅 Matin (6h-12h)  │  ☀️ Après-midi (12h-18h)  │  🌙 Soir  │
│  ┌─────────────┐   │  ┌─────────────┐          │  ┌─────┐  │
│  │ Tâche 1     │   │  │ Tâche 2     │          │  │     │  │
│  │ 45min       │   │  │ 1h30        │          │  │     │  │
│  └─────────────┘   │  └─────────────┘          │  └─────┘  │
└─────────────────────────────────────────────────────────┘
```

### Amélioration DraggableTask

Modifications :
- Bordure gauche colorée selon priorité (remplace le badge)
- Badge source condensé (icône seule)
- Durée avec icône clock compacte
- Hover : expansion verticale avec tous les détails

---

## Étapes d'implémentation

1. **Créer les nouveaux composants de panneau**
   - `TaskDeck.tsx` - deck collapsible
   - `TaskDeckItem.tsx` - item simplifié
   - `TaskDeckPanel.tsx` - conteneur avec logique de groupement

2. **Créer les nouveaux composants de planning**
   - `TimeBlockRow.tsx` - blocs en ligne pour vue jour
   - `CompactDayColumn.tsx` - colonne simplifiée pour vue semaine
   - `DayPlanningView.tsx` - layout vue jour
   - `WeekPlanningView.tsx` - layout vue semaine

3. **Refactoriser TimelineView**
   - Remplacer `UnscheduledTasksPanel` par `TaskDeckPanel`
   - Utiliser les nouvelles vues jour/semaine
   - Ajuster le layout responsive

4. **Ajuster les styles globaux**
   - Optimiser les espacements
   - Améliorer les contrastes
   - Harmoniser les tailles de police

---

## Résultat attendu

- **Vue semaine** : 7 colonnes épurées, sans blocs temporels, affichage liste condensée
- **Vue jour** : 3 colonnes horizontales (blocs), plus d'espace vertical
- **Panneau tâches** : Groupement visuel en decks, navigation intuitive
- **Lisibilité** : Moins de badges, plus de texte visible, meilleur contraste
- **Performance** : Moins de DOM nodes grâce à la simplification

