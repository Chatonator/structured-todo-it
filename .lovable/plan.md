

## Plan: Refonte Vue Récompense v1.0

### Scope

Refonte complète du moteur de points, ajout du système Claim, des compétences, et de la jauge visuelle. Travail structuré en 5 blocs.

---

### Bloc 1 — Schéma DB (migrations)

**Modifier `user_progress`** : ajouter colonnes
- `points_available` (int, default 0) — solde dépensable
- `total_points_earned` (int, default 0)
- `total_points_spent` (int, default 0)

**Nouvelle table `rewards`** (récompenses personnalisées) :
- `id` uuid PK
- `user_id` uuid NOT NULL
- `name` text NOT NULL
- `icon` text default '🎁'
- `cost_points` int NOT NULL
- `order_index` int default 0
- `created_at` timestamptz default now()
- RLS : CRUD own rows

**Nouvelle table `claim_history`** :
- `id` uuid PK
- `user_id` uuid NOT NULL
- `reward_name` text NOT NULL
- `cost_points` int NOT NULL
- `claimed_at` timestamptz default now()
- RLS : INSERT/SELECT own rows

**Nouvelle table `user_skills`** :
- `id` uuid PK
- `user_id` uuid NOT NULL
- `skill_key` text NOT NULL (discipline, prioritisation, constance, finalisation)
- `xp` int default 0
- `created_at` / `updated_at`
- UNIQUE(user_id, skill_key)
- RLS : CRUD own rows

---

### Bloc 2 — Moteur de points (engine.ts + constants.ts)

Remplacer la formule actuelle dans `computeTaskPoints` :

```
effort = sqrt(duration)
if duration < 15: effort *= 0.6
importance_weight = 2 if important else 1
quadrant_weight = { IU: 1.4, I!U: 1.5, !IU: 1.0, !I!U: 0.6 }
priority_multiplier = (importance_weight + quadrant_weight) / 2
secondary_bonus = 1.3 if postpone >= 3, else 1.2 if important && deadline < 48h, else 1
long_task_bonus = 5 if duration >= 60 else 0
points = floor(effort × priority_multiplier × secondary_bonus) + long_task_bonus
```

Mettre à jour `constants.ts` avec les nouveaux coefficients. Supprimer les anciens planning bonus (remplacés par secondary_bonus logic).

Mettre à jour `TaskRewardResult` pour inclure `longTaskBonus`.

---

### Bloc 3 — useGamification : points_available + Claim

- `rewardTaskCompletion` : incrémenter `points_available` et `total_points_earned` en plus de `total_xp`
- Nouveau : `claimReward(rewardId, cost)` — décrémenter `points_available`, incrémenter `total_points_spent`, insérer dans `claim_history`
- Nouveau : `getClaimHistory()`
- Toast post-tâche enrichi : afficher contexte quadrant ("+ X pts (Long terme)" / "+ X pts (Urgence traitée)")

---

### Bloc 4 — Skills (compétences)

Nouveau hook `useSkills` ou intégré dans `useGamification` :

- **Discipline** : XP = somme minutes importantes complétées (depuis xp_transactions metadata)
- **Priorisation** : XP = % tâches importantes / total tâches (×100 par calcul)
- **Constance** : XP = streak jours (current_task_streak)
- **Finalisation** : XP = ratio tâches complétées / tâches créées (×100)

Niveaux : XP seuils simples (ex: 0-100 = lvl 1, 100-300 = lvl 2, etc.)

Calcul à la volée depuis les données existantes (pas de stockage si MVP, ou stocker dans `user_skills` pour perf).

---

### Bloc 5 — UI RewardsView

Restructurer en sections :

1. **Points + Jauge** — Afficher `points_available` avec jauge réservoir vers les paliers 30/60/120/240. Progress bar remplissage.

2. **Récompenses (Claim)** — Grille de cartes récompenses avec état Locked/Available/Claimable. Bouton Claim avec dialog confirmation. CRUD récompenses (ajouter/supprimer ses propres récompenses).

3. **Compétences** — 4 cartes skill avec barre XP, level, progress %.

4. **Résumé hebdomadaire** — Conserver le composant existant `ProgressOverview` adapté (barres répartition, score alignement).

5. **Activité récente** — Conserver `RecentActivity` avec toast feedback enrichi.

6. **Historique Claims** — Liste des récompenses réclamées.

7. **Pause volontaire** (optionnel) — Bouton simple, log dans historique sans impact points.

---

### Fichiers impactés

| Fichier | Action |
|---|---|
| `supabase/migrations/` | 1 migration (3 tables + alter user_progress) |
| `src/lib/rewards/constants.ts` | Nouveaux coefficients |
| `src/lib/rewards/engine.ts` | Nouvelle formule |
| `src/hooks/useGamification.ts` | points_available, claim, toast enrichi |
| `src/hooks/view-data/useRewardsViewData.ts` | Skills, claims data |
| `src/types/gamification.ts` | Nouveaux types |
| `src/components/views/rewards/RewardsView.tsx` | Restructuration complète |
| `src/components/rewards/ProgressOverview.tsx` | Jauge réservoir + paliers |
| `src/components/rewards/RecentActivity.tsx` | Toast contextualisé |
| `src/components/rewards/RewardsClaim.tsx` | **Nouveau** — grille Claim |
| `src/components/rewards/SkillsPanel.tsx` | **Nouveau** — 4 compétences |
| `src/components/rewards/ClaimHistory.tsx` | **Nouveau** — historique |
| `src/components/rewards/RewardModal.tsx` | **Nouveau** — CRUD récompense |
| `src/components/rewards/VoluntaryPause.tsx` | **Nouveau** — bouton pause |

---

### Technical details

- La formule change les coefficients quadrant : `I+U: 1.4` (était 1.5), `I+!U: 1.5` (était 1.6), `!I+U: 1.0` (inchangé), `!I+!U: 0.6` (était 0.7)
- Le micro-task adjust passe de "cap daily" à "effort × 0.6" pour duration < 15 min (le cap daily reste aussi)
- `importance_weight` est un nouveau facteur (2 si important, 1 sinon) combiné avec quadrant_weight via moyenne
- `long_task_bonus` (+5 pts si ≥60 min) est additif, pas multiplicatif
- `secondary_bonus` remplace les anciens planning bonus — seuls anti-zombie (≥3 reports) et deadline urgente (<48h important) subsistent
- Les données de compétences sont calculées depuis `xp_transactions`, `items`, et `user_progress` existants — pas de tracking supplémentaire

