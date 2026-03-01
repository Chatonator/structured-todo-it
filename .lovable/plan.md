

## Plan : Factorisation de la vue Récompenses + ajustement graphique

### Problème actuel
La ligne du haut utilise un `flex` avec des largeurs fixes/shrink-0 qui empêchent les containers de remplir dynamiquement l'espace. Le container Récompenses prend trop de place même quand son contenu est petit, et la jauge de Points ne s'étire pas assez.

### Approche

Passer à un layout **CSS Grid avec `fr`** pour que chaque colonne prenne sa part proportionnelle de l'espace disponible, tout en respectant des tailles minimales.

### Modifications

**1. `RewardsView.tsx`** — Nouveau grid layout
- Remplacer le `flex` par `grid` avec : `grid-cols-[1fr_1.2fr_auto_170px]`
  - Col 1 (Refinement) : `1fr` — s'adapte mais reste compact
  - Col 2 (Progress/Points) : `1.2fr` — prend plus de place proportionnellement
  - Col 3 (Rewards) : `auto` — ne prend que la place de son contenu
  - Col 4 (Skills) : `170px` fixe
- Supprimer tous les `lg:w-[...]`, `lg:shrink-0`, `lg:w-fit` wrapper divs inutiles
- Passer les composants directement dans le grid sans divs intermédiaires
- Responsive : `grid-cols-1 lg:grid-cols-[1fr_1.2fr_auto_170px]`
- `items-stretch` pour que tous les containers aient la même hauteur

**2. `RewardsClaim.tsx`** — Contraindre la largeur au contenu
- Ajouter `w-fit` au Card racine pour qu'il ne s'étire pas au-delà de son contenu
- Ajouter `min-w-[200px]` pour garder un minimum lisible

**3. `ProgressOverview.tsx`** — S'adapter à l'espace
- Confirmer que le Card a `h-full w-full` (déjà le cas)
- Pas de changement majeur, le grid `1.2fr` lui donnera plus d'espace naturellement

**4. Aucun changement** sur `RefinementPanel`, `SkillsPanel`, `ClaimHistory` — ils sont déjà corrects

### Résultat attendu
```text
┌──────────┬────────────────┬────────┬───────┐
│ Travail  │ Points dispo   │Récomp. │Skills │
│ accompli │ (jauge vert.)  │(compact│ 🎯   │
│ 1fr      │ 1.2fr          │ auto)  │ 170px │
└──────────┴────────────────┴────────┴───────┘
│  Claim History (full width)                │
└────────────────────────────────────────────┘
```

