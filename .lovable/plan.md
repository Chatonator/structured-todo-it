

# Amélioration UI des TeamTaskCard

## Probleme

Les cartes de taches d'equipe (`TeamTaskCard`) prennent trop de place et les boutons d'action (aide, encourager, assignation) ne sont pas intuitifs -- trop de boutons visibles en permanence.

## Solution

Rendre les cartes plus compactes et regrouper les actions dans un menu contextuel, a l'image des `TaskItem` personnels.

### Modifications

**`src/components/views/teams/TeamTaskCard.tsx`** -- Refonte compacte :

- Reduire le padding de `p-3` a `p-2`
- Integrer l'avatar d'assignation inline a cote du nom (petit avatar 5x5 sans bouton), au lieu d'un bouton dropdown separe
- Regrouper les actions (assigner, aide, encourager) dans un **unique DropdownMenu** via une icone `MoreHorizontal` qui apparait au hover uniquement (comme les taches perso)
- Retirer les boutons Help et Heart visibles en permanence
- Afficher la duree et la categorie sur la meme ligne que le nom quand l'espace le permet

**Structure visuelle cible :**

```text
┌─────────────────────────────────────────────────┐
│ [✓] Nom de la tâche          [AB] 30m  [⋯]     │
└─────────────────────────────────────────────────┘
```

- `[✓]` = checkbox
- `[AB]` = petit avatar initiales de l'assigne (ou icone grise si non assigne)
- `30m` = duree compacte
- `[⋯]` = menu contextuel au hover avec : Assigner a..., Demander de l'aide, Encourager

### Details techniques

1. Remplacer le dropdown d'assignation + les boutons Help/Heart par un seul `DropdownMenu` avec `MoreHorizontal`
2. Le menu contient : sous-menu assignation (liste membres), separateur, action aide (si ma tache), action encourager (si tache d'un autre)
3. L'avatar d'assignation reste visible en lecture seule (indicateur, pas bouton)
4. Le `[⋯]` n'apparait qu'au `group-hover`

| Fichier | Action |
|---------|--------|
| `src/components/views/teams/TeamTaskCard.tsx` | Refonte compacte avec menu contextuel unifie |

