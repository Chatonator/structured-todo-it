

## Bouton dynamique + pré-sélection du contexte

### Ce que tu veux
- Le bouton "Nouvelle tâche" du header change de label selon le filtre actif : **Toutes** → "Nouvelle tâche", **Perso** → "Tâche Perso", **Pro** → "Tâche Pro", **Équipe** → "Tâche équipe"
- Quand on ouvre un modal de création (tâche, habitude, projet), le contexte est **pré-sélectionné** selon le filtre actif
- Appliquer cette logique partout : tâches, habitudes, projets

### Changements

**1. `src/components/layout/HeaderBar.tsx`**
Rendre le label du bouton dynamique :
```
contextFilter === 'all' && !currentTeam → "Nouvelle tâche"
contextFilter === 'Perso' → "Tâche Perso"  
contextFilter === 'Pro' → "Tâche Pro"
currentTeam → "Tâche équipe"
```

**2. `src/pages/Index.tsx`**
Passer `contextFilter` au `TaskModal` pour que le contexte soit pré-rempli :
- Si `contextFilter === 'Perso'` → le modal s'ouvre avec contexte "Perso"
- Si `contextFilter === 'Pro'` → contexte "Pro"
- Si `contextFilter === 'all'` → pas de pré-sélection (garde le comportement actuel)

**3. `src/components/task/TaskModal.tsx`**
Ajouter une prop `defaultContext?: TaskContext` qui remplace le default du draft quand elle est fournie. Le `createEmptyDraft()` utilisera ce contexte.

**4. `src/config/taskTypeConfig.ts`**
Pas de changement structurel — le `defaults.context` sera overridé par la prop dynamique.

**5. `src/components/habits/HabitModal.tsx`**
Ajouter une prop `defaultContext?: TaskContext`. Quand on crée une nouvelle habitude, le `context` est initialisé à `defaultContext` au lieu de `'Perso'` en dur (ligne 113).

**6. `src/components/views/habits/HabitsView.tsx`**
Passer `contextFilter` au `HabitModal` via la prop `defaultContext`.

**7. `src/components/projects/ProjectModal.tsx`**
Ajouter une prop `defaultContext?: TaskContext`. Le `useEffect` initial (ligne 74) utilisera `defaultContext` au lieu de `'Perso'` quand on crée un nouveau projet.

**8. `src/components/views/projects/ProjectsView.tsx`**
Passer `contextFilter` au `ProjectModal` via `defaultContext`.

### Résumé des fichiers touchés

| Fichier | Modification |
|---------|-------------|
| `HeaderBar.tsx` | Label dynamique du bouton |
| `Index.tsx` | Passer `contextFilter` aux modals |
| `TaskModal.tsx` | Nouvelle prop `defaultContext`, pré-remplir le draft |
| `HabitModal.tsx` | Nouvelle prop `defaultContext`, pré-remplir le contexte |
| `ProjectModal.tsx` | Nouvelle prop `defaultContext`, pré-remplir le contexte |
| `HabitsView.tsx` | Transmettre `contextFilter` au modal |
| `ProjectsView.tsx` | Transmettre `contextFilter` au modal |

