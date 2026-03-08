

# Personnalisation des durées du Pomodoro avec presets

## Concept

Ajouter un panneau de configuration accessible depuis l'état `idle` du Pomodoro, avec 2 presets recommandés et un mode personnalisé.

## Presets

| Preset | Focus | Pause courte | Pause longue | Cycles |
|--------|-------|-------------|-------------|--------|
| **Classique** (défaut) | 25 min | 5 min | 15 min | 4 |
| **Sprint** | 15 min | 3 min | 10 min | 4 |
| **Personnalisé** | Libre | Libre | Libre | Libre |

## Modifications

### 1. `usePomodoroTool.ts`
- Ajouter un state `config` interne au hook (au lieu de le recevoir en param fixe)
- Exposer `config` et `setConfig` dans le retour
- Persister le config choisi dans `localStorage` (`pomodoro_config`)
- Mettre à jour l'affichage idle (`25:00`) pour refléter le focus configuré

### 2. `PomodoroTool.tsx`
- Ajouter une section de configuration visible uniquement en état `idle` (avant de démarrer)
- 3 boutons presets : **Classique** / **Sprint** / **Personnalisé**
- En mode Personnalisé : 3 sliders (focus 5-60 min, pause courte 1-15 min, pause longue 5-30 min)
- Icône `Settings2` pour toggler la visibilité du panneau de config
- L'affichage idle du timer reflète la durée focus configurée

## UX
- Le panneau de config disparaît dès que le timer démarre
- Le preset actif est visuellement mis en évidence
- Les sliders affichent la valeur en minutes à côté

