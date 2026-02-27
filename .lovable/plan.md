## Plan: Système de Raffinage des Points

### Concept

Les points sont calculés a la completion mais stockes comme "non raffines" dans `xp_transactions` (nouveau champ `is_refined`). Ils ne comptent pas dans `points_available` tant que l'utilisateur n'a pas clique "Raffiner". Une decote de 10%/semaine s'applique sur les points non raffines et raffinés.

---

### Bloc 1 — Migration DB

**Alter `xp_transactions**` :

- `is_refined` boolean NOT NULL DEFAULT false
- `refined_at` timestamptz NULL

Aucune nouvelle table necessaire.

---

### Bloc 2 — Modifier `rewardTaskCompletion` dans `useGamification.ts`

Actuellement les points sont ajoutes a `points_available` immediatement (ligne 262). Changement :

- **Ne plus incrementer `points_available**` ni `total_points_earned` a la completion
- Stocker les points dans `xp_transactions` avec `is_refined = false` (comportement par defaut grace au DEFAULT)
- Le toast reste ("+ X pts") mais les points ne sont pas encore utilisables

---

### Bloc 3 — Nouvelle action `refinePoints` dans `useGamification.ts`

```
refinePoints(transactionIds?: string[])
```

1. Fetch toutes les `xp_transactions` ou `is_refined = false` et `source_type = 'task'` (ou seulement celles selectionnees)
2. Pour chaque transaction, calculer la decote : `max(0, points × (1 - 0.10 × nb_semaines))` ou `nb_semaines = floor((now - created_at) / 7 jours)`
3. Somme des points apres decote = `refinedTotal`
4. Marquer les transactions `is_refined = true`, `refined_at = now()`
5. Incrementer `points_available += refinedTotal` et `total_points_earned += refinedTotal`
6. Toast : "+X pts raffines"

---

### Bloc 4 — Nouvelle action `getUnrefinedTasks` dans `useGamification.ts`

Fetch les `xp_transactions` non raffinees avec jointure sur `items` pour recuperer nom, categorie, etc. Retourne la liste avec les infos de decote calculee.

---

### Bloc 5 — Hook `useRewardsViewData` : ajouter donnees non raffinees

Nouvel etat `unrefinedTasks` charge au mount. Expose `actions.refinePoints`.

---

### Bloc 6 — Nouveau composant `RefinementPanel.tsx`

Container "Travail accompli" affichant :

- Liste des taches non raffinees avec barre de couleur categorie
- Indicateur de decote par tache (ex: "-20% (2 sem.)")
- Aucune valeur de points affichee
- Bouton "Raffiner" (toutes ou selection)
- Action irreversible

---

### Bloc 7 — Modifier `ProgressOverview.tsx`

Le titre change en "Points disponibles". N'affiche que les points raffines (`points_available`). Le `totalPointsEarned` ne compte que les points effectivement raffines.

---

### Bloc 8 — Modifier `RewardsView.tsx`

Ordre des sections :

1. **RefinementPanel** — "Travail accompli" (en premier, action principale)
2. **ProgressOverview** — "Points disponibles" (solde raffine)
3. **RewardsClaim** — Recompenses
4. **SkillsPanel** — Competences
5. **ClaimHistory** — Historique

---

### Fichiers impactes


| Fichier                                        | Action                                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `supabase/migrations/`                         | ALTER xp_transactions (is_refined, refined_at)                                             |
| `src/integrations/supabase/types.ts`           | Ajouter champs xp_transactions                                                             |
| `src/hooks/useGamification.ts`                 | Retirer points_available de rewardTaskCompletion, ajouter refinePoints + getUnrefinedTasks |
| `src/types/gamification.ts`                    | Nouveau type UnrefinedTask                                                                 |
| `src/hooks/view-data/useRewardsViewData.ts`    | Charger unrefinedTasks, exposer refinePoints                                               |
| `src/components/rewards/RefinementPanel.tsx`   | **Nouveau** — container "Travail accompli"                                                 |
| `src/components/rewards/ProgressOverview.tsx`  | Renommer en "Points disponibles"                                                           |
| `src/components/views/rewards/RewardsView.tsx` | Integrer RefinementPanel en position 1                                                     |
| `src/lib/rewards/constants.ts`                 | Constantes decote (DECAY_RATE, MAX_DECAY_WEEKS)                                            |


---

### Details techniques

- Decote : `valeur = max(0, points_origin × (1 - 0.10 × nb_semaines))` avec `nb_semaines = floor((now - created_at) / (7×24×60×60×1000))`
- Apres 10 semaines : valeur = 0
- Constantes : `DECAY_RATE_PER_WEEK = 0.10`, `MAX_DECAY_WEEKS = 10`
- Le `points_available` dans `user_progress` ne change qu'au moment du raffinage (pas a la completion)
- Le `total_points_earned` ne compte que les points raffines (valeur apres decote)
- Les transactions non raffinees sont filtrables par `is_refined = false`