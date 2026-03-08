

# Ajout de l'outil Pomodoro à la boîte à outils

## Concept

Un timer Pomodoro interactif : 25 min de travail, 5 min de pause courte, 15 min de pause longue après 4 cycles. L'utilisateur peut lier une tâche existante à sa session en cours.

## Fichiers à créer/modifier

### 1. `src/components/views/toolbox/tools/pomodoro/usePomodoroTool.ts`
Hook custom gérant :
- Timer avec `setInterval` (countdown en secondes)
- États : `idle | focus | shortBreak | longBreak`
- Compteur de cycles (pause longue après 4 focus)
- Actions : `start`, `pause`, `resume`, `skip`, `reset`
- Sélection optionnelle d'une tâche depuis `useViewDataContext`
- Persistance du compteur de sessions complétées dans `localStorage`

### 2. `src/components/views/toolbox/tools/pomodoro/PomodoroTool.tsx`
Composant principal :
- Grand cercle de progression avec le temps restant (mm:ss)
- Indicateur de phase (Focus / Pause courte / Pause longue)
- Boutons Play/Pause, Skip, Reset
- Sélecteur de tâche optionnel (Popover comme Rule135)
- Compteur de sessions Pomodoro complétées aujourd'hui
- Indicateur des 4 cycles (dots)

### 3. `src/components/views/toolbox/tools/index.ts`
Ajouter l'entrée Pomodoro au `toolRegistry` :
- `id: 'pomodoro'`, `icon: Timer`, `category: 'focus'`, `isNew: true`
- Métadonnées : description longue, avantages, origine (Francesco Cirillo), conseils

## Design du timer

```text
┌─────────────────────────────┐
│  🍅 Pomodoro  ●●●○ (3/4)   │
│                             │
│      ┌───────────┐          │
│      │  24:37    │  cercle  │
│      │  FOCUS    │  progrès │
│      └───────────┘          │
│                             │
│   [⏸ Pause]  [⏭ Skip]     │
│                             │
│  📋 Tâche liée : Rédiger...│
│  🔥 4 sessions aujourd'hui  │
└─────────────────────────────┘
```

## Durées par défaut
- Focus : 25 min
- Pause courte : 5 min  
- Pause longue : 15 min
- Pause longue après : 4 focus

