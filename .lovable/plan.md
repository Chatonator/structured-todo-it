

## Plan: Compacter la ligne haute et y intégrer les récompenses

### Layout cible

```text
┌─────────┬──────┬──────────────────┬────────┐
│ Travail │Points│  Récompenses     │ Skills │
│accompli │dispo │  (cards grid)    │  🎯    │
│(compact)│jauge │                  │  ⭐    │
│         │vert. │                  │  🔥    │
│         │      │                  │  ✅    │
└─────────┴──────┴──────────────────┴────────┘
│  Claim History (full width)               │
└───────────────────────────────────────────┘
```

### Modifications

1. **RewardsView.tsx** — Nouvelle grille top row : `grid-cols-[minmax(180px,0.5fr)_auto_1fr_170px]`
   - Colonne 1 : RefinementPanel (réduit de moitié)
   - Colonne 2 : ProgressOverview (auto, compact)
   - Colonne 3 : RewardsClaim (prend l'espace libre)
   - Colonne 4 : SkillsPanel (170px au lieu de 240px, -30%)
   - Row 2 : ClaimHistory seul, full width

2. **RefinementPanel.tsx** — Ajouter `max-w-[220px]` ou laisser la grille contraindre, texte en `text-justify` pour les noms de tâches

3. **SkillsPanel.tsx** — Réduire la largeur (contrôlée par la grille 170px), padding `p-2`

4. **RewardsClaim.tsx** — S'adapte à l'espace disponible, grille interne `grid-cols-1` pour les cartes

