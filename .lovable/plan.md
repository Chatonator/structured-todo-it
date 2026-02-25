
## Problèmes identifiés

**1. Détection de collision imprécise (`closestCenter`)**
Le `collisionDetection={closestCenter}` de dnd-kit calcule la distance entre le centre de l'élément draggué et le centre de chaque droppable. Avec des blocs Matin/Après-midi/Soir qui occupent tout l'espace vertical de la vue, l'activation peut targeter le mauvais bloc car le centre de la souris/doigt n'est pas nécessairement dans la colonne visuelle attendue.

**Solution** : Passer à `rectIntersection` ou à un algorithme custom `pointerWithin` — dnd-kit fournit `pointerWithin` qui utilise la position exacte du pointeur (pas le centre du rectangle draggué). C'est beaucoup plus précis pour des zones bien définies.

**2. Seuil d'activation trop petit (`distance: 8`)**
Le seuil actuel de 8px signifie que le drag commence quasi-immédiatement sur un simple scroll. Passer à `distance: 5` est ok pour la réactivité mais le vrai gain de précision vient de `pointerWithin`.

**3. Pas de feedback visuel immédiat pendant le survol**
`TimeBlockColumn` et `CompactDayColumn` changent leur border/background via `isOver`, mais l'animation CSS n'utilise que `transition-all` sans durée explicite. Préciser `transition-colors duration-150` évite le flash/lag visuel.

**4. Latence perçue après le drop**
`scheduleTaskToBlock` fait : `syncTaskEventWithSchedule` → `recalculateBreaks` → `loadEvents` séquentiellement. C'est 3 allers-retours DB avant que l'UI ne reflète le changement. Il faut ajouter **un état optimiste local** : dès le drop, retirer la tâche de la liste `unscheduledTasks` côté UI (sans attendre la DB), puis `reload` en background.

## Plan d'implémentation

### Étape 1 — TimelineView.tsx : `pointerWithin` + état optimiste
- Importer `pointerWithin` depuis `@dnd-kit/core`
- Remplacer `collisionDetection={closestCenter}` par `collisionDetection={pointerWithin}`
- Dans `handleDragEnd`, avant l'`await scheduleTaskToBlock(...)`, mettre à jour un `Set<string>` local `pendingTaskIds` pour masquer la tâche du deck immédiatement
- Retirer `pendingTaskIds` après le `await` (succès ou échec)
- Passer `pendingTaskIds` au `TaskDeckPanel` pour filtrer l'affichage

### Étape 2 — TimeBlockRow.tsx / TimeBlockColumn : feedback visuel précis
- Remplacer `transition-all` par `transition-colors duration-150` sur le container droppable
- Ajouter une `scale(1.01)` ou un `ring` sur `isOver` pour un retour visuel net
- Remplacer `border-2 border-dashed` par `border-2` seul avec changement de couleur plus prononcé sur `isOver`

### Étape 3 — CompactDayColumn.tsx : même amélioration visuelle
- Même refactoring `transition-colors duration-150` + style `isOver` plus visible

### Étape 4 — TaskDeckItem.tsx : drag handle sur toute la carte
- Actuellement le drag handle est un `<button>` séparé invisible par défaut (visible au hover). Cela oblige à viser précisément le handle.
- Mettre `{...listeners}` directement sur le container principal `div` (à la place du bouton séparé), et garder le `onClick` sur le titre uniquement
- Le curseur `grab` sur toute la carte rend le drag beaucoup plus intuitif

### Étape 5 — Capteur PointerSensor : délai minimal
- Garder `distance: 5` (légèrement réduit depuis 8 pour plus de réactivité)
- Ajouter `delay: 0` explicitement pour s'assurer qu'il n'y a pas de délai système

## Fichiers modifiés

| Fichier | Modification |
|---|---|
| `src/components/views/timeline/TimelineView.tsx` | `pointerWithin`, état optimiste `pendingTaskIds` |
| `src/components/timeline/planning/TimeBlockRow.tsx` | feedback visuel `isOver` amélioré |
| `src/components/timeline/planning/CompactDayColumn.tsx` | feedback visuel `isOver` amélioré |
| `src/components/timeline/panels/TaskDeckItem.tsx` | drag sur toute la carte |
| `src/components/timeline/panels/TaskDeckPanel.tsx` | filtre `pendingTaskIds` |
