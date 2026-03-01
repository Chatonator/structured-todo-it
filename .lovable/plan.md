

## Changement structurel : Points → Temps Guilty-Free (minutes)

Remplacement complet du systeme de "points" par un systeme de **temps guilty-free en minutes**, avec jauge plafonnee a 200 min, paliers fixes, bonus de compensation, et depreciation hebdomadaire.

---

### 1. Mise a jour des constantes

**Fichier:** `src/lib/rewards/constants.ts`

- Remplacer `POINT_THRESHOLDS` par `TIME_TIERS = [30, 60, 90, 120, 150, 180]` (paliers fixes de recompenses)
- Ajouter `GAUGE_MAX_MINUTES = 200` (plafond absolu)
- Ajouter `COMPENSATION_THRESHOLD = 60` et `COMPENSATION_BONUS = 10` (bonus de 10 min par tranche de 60 min)
- Conserver `DECAY_RATE_PER_WEEK`, `MAX_DECAY_WEEKS` (depreciation inchangee)
- Supprimer les references "points" dans les commentaires

---

### 2. Refonte du moteur de calcul

**Fichier:** `src/lib/rewards/engine.ts`

- Renommer `computeTaskPoints` → `computeTaskMinutes` (ou garder le meme nom avec sortie en minutes)
- Le resultat (`TaskRewardResult`) retourne desormais `minutes` au lieu de `points`
- Formule identique dans sa logique :  `floor(sqrt(duree) x quadrantCoeff x bonus)`
- Renommer les champs de sortie : `points` → `minutes`
- Ajouter `computeCompensationBonus(currentMinutes, addedMinutes)` : retourne le bonus de 10 min si une tranche de 60 est franchie
- Ajouter `clampToGauge(value)` : tronque a `GAUGE_MAX_MINUTES` (200)
- Mettre a jour `WeeklySummary` : `totalPoints` → `totalMinutes`

---

### 3. Mise a jour des types

**Fichier:** `src/types/gamification.ts`

- `UserProgress` : renommer semantiquement `pointsAvailable` → `minutesAvailable`, `totalPointsEarned` → `totalMinutesEarned`, `totalPointsSpent` → `totalMinutesSpent`
- `TransactionMetadata` : pas de changement structurel (les metadonnees restent identiques)
- `Reward` : `costPoints` → `costMinutes` (doit etre un des paliers fixes : 30, 60, 90, 120, 150, 180)
- `ClaimHistoryEntry` : `costPoints` → `costMinutes`
- `UnrefinedTask` : `pointsOriginal` → `minutesOriginal`

---

### 4. Refonte du hook de gamification

**Fichier:** `src/hooks/useGamification.ts`

Changements majeurs :

- **`rewardTaskCompletion`** : le resultat du moteur donne des minutes. Application directe :
  - Calculer le bonus de compensation (si tranche de 60 franchie)
  - Tronquer le total a 200 min (`clampToGauge`)
  - Mettre a jour `points_available` en DB (semantiquement = minutes) directement, **sans passer par le raffinement**
  - L'excedent au-dela de 200 est perdu
  - Toast : `+X min guilty-free`

- **`refinePoints`** → toujours present mais la depreciation s'applique aux minutes. La logique reste : les taches non raffinees perdent 10%/semaine. Le raffinement convertit en minutes utilisables, tronquees a 200.

- **`claimReward`** : verifie `minutesAvailable >= costMinutes`. Deduit exactement le cout. Toast en minutes.

- **Bonus de compensation** : integre dans `rewardTaskCompletion` et `refinePoints`. Chaque fois que le cumul franchit un multiple de 60, +10 min sont ajoutees (soumises au plafond de 200 et a la depreciation).

---

### 5. Mise a jour du hook view-data

**Fichier:** `src/hooks/view-data/useRewardsViewData.ts`

- Adapter les noms de champs : `pointsAvailable` → `minutesAvailable`, etc.
- Le reste de la logique (skills, streak) est inchange

---

### 6. Mise a jour des composants UI

#### `ProgressOverview.tsx`
- Titre : "Points" → "Temps libre" ou "Guilty-Free"
- Jauge max = 200 (au lieu de 240)
- Afficher `X min` au lieu de `X pts`
- Paliers sur la jauge : marques a 30, 60, 90, 120, 150, 180 min
- Texte en bas : "Gagne X min - Depense X min"

#### `RewardsClaim.tsx`
- La creation de recompense propose un **select** parmi les paliers fixes (30, 60, 90, 120, 150, 180 min) au lieu d'un input libre
- Affichage : `X min` au lieu de `X pts`
- Dialog de confirmation : "Reclamer ... pour X min ?" + "Solde restant : Y min"

#### `RefinementPanel.tsx`
- Texte : "points" → "minutes", "pts" → "min"
- "Completez des taches pour gagner du temps" au lieu de "pour gagner des points"

#### `ClaimHistory.tsx`
- Afficher `-X min` au lieu de `-X pts`

#### `RewardsView.tsx`
- Sous-titre : "Suivez votre temps guilty-free et reclamez vos recompenses"

---

### 7. Aucune migration DB necessaire

Les colonnes existantes (`points_available`, `total_points_earned`, `total_points_spent`, `points_gained`, `cost_points`) stockeront desormais des minutes au lieu de points. Le changement est purement semantique cote DB -- les valeurs numeriques restent dans les memes colonnes, seul leur sens change.

---

### 8. Export et index

**Fichier:** `src/lib/rewards/index.ts`

- Exporter les nouveaux noms (`computeTaskMinutes` ou alias)
- Exporter les nouvelles constantes (`GAUGE_MAX_MINUTES`, `TIME_TIERS`, `COMPENSATION_THRESHOLD`, `COMPENSATION_BONUS`)

---

### Resume des fichiers modifies

| Fichier | Nature du changement |
|---|---|
| `src/lib/rewards/constants.ts` | Nouvelles constantes (jauge 200, paliers, bonus 60→10) |
| `src/lib/rewards/engine.ts` | Sortie en minutes, fonctions clamp + compensation |
| `src/lib/rewards/index.ts` | Nouveaux exports |
| `src/types/gamification.ts` | Renommage points → minutes |
| `src/hooks/useGamification.ts` | Logique minutes + plafond + compensation |
| `src/hooks/view-data/useRewardsViewData.ts` | Adaptation noms de champs |
| `src/components/rewards/ProgressOverview.tsx` | UI temps libre, jauge 200 |
| `src/components/rewards/RewardsClaim.tsx` | Select paliers fixes, affichage min |
| `src/components/rewards/RefinementPanel.tsx` | Texte min au lieu de pts |
| `src/components/rewards/ClaimHistory.tsx` | Affichage min |
| `src/components/views/rewards/RewardsView.tsx` | Sous-titre |

