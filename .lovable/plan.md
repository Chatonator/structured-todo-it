

## Plan: Réorganisation du layout Récompenses + corrections

### Problèmes identifiés

**Layout actuel** : Tous les blocs empilés verticalement sur toute la largeur, prenant beaucoup de place.

**Bugs de calcul des compétences** :
- **Priorisation** et **Finalisation** : calculés en pourcentage (max 100), mais les seuils de niveau commencent à 100 XP pour le niveau 2. Ces compétences ne dépasseront jamais le niveau 1-2. Il faut multiplier ces valeurs (ex: ×30) pour les rendre comparables aux autres.
- **Constance** : streak × 10, aussi très faible comparé aux seuils (0, 100, 300, 600...).
- **Discipline** : somme brute des minutes importantes — peut être disproportionnellement élevée.

### Modifications

#### 1. Nouveau layout en grille (RewardsView.tsx)

```text
┌──────────────────────┬──────────────────┐
│  Refinement Panel    │  Progress        │
│  (points à raffiner) │  (points dispo)  │
├──────────────────────┴──────────────────┤
│                                         │
│  ┌─────────────┬─────────────┐ ┌──────┐ │
│  │ Récompenses │             │ │Skills│ │
│  │ (cards)     │             │ │  🎯  │ │
│  │             │             │ │  ⭐  │ │
│  └─────────────┴─────────────┘ │  🔥  │ │
│                                │  ✅  │ │
│  Claim History                 └──────┘ │
└─────────────────────────────────────────┘
```

- Ligne du haut : RefinementPanel + ProgressOverview côte à côte (`grid grid-cols-1 lg:grid-cols-2`)
- Ligne du bas : Récompenses + Historique à gauche (flex-1), Skills empilés verticalement à droite (colonne fixe)

#### 2. Compactifier les composants

- **ProgressOverview** : réduire le padding, rendre plus compact
- **RefinementPanel** : réduire padding, garder la liste scrollable
- **SkillsPanel** : passer en `grid-cols-1` (cartes empilées verticalement), réduire padding
- **RewardsClaim** : garder la grille existante
- **ClaimHistory** : compact, déjà OK

#### 3. Corriger les calculs de compétences (useRewardsViewData.ts)

- **Discipline** : plafonner ou normaliser (ex: `Math.min(disciplineXp, 5000)`)
- **Priorisation** : multiplier par 30 → max ~3000 XP, permettant d'atteindre des niveaux significatifs
- **Constance** : multiplier par 30 → streak de 10 = 300 XP (niveau 3)
- **Finalisation** : multiplier par 30 → 100% complété = 3000 XP (niveau 7)

#### 4. Fichiers modifiés

- `src/components/views/rewards/RewardsView.tsx` — layout en grille
- `src/components/rewards/ProgressOverview.tsx` — compact
- `src/components/rewards/RefinementPanel.tsx` — compact
- `src/components/rewards/SkillsPanel.tsx` — colonne verticale, compact
- `src/hooks/view-data/useRewardsViewData.ts` — corriger les facteurs XP des compétences

