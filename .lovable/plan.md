
## Analyse de l'existant

**Système actuel** : basé sur des "minutes guilty-free" calculées avec `√(durée) × coefficient_quadrant × multiplicateurs`. Les 4 compétences actuelles (Discipline, Priorisation, Constance, Finalisation) sont des métriques calculées à la volée dans `useRewardsViewData.ts` sans être persistées en DB. Elles utilisent `SKILL_LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500]`.

**Ce qui change** : Remplacer les 4 compétences par 5 nouvelles (Planification, Priorisation Stratégique, Discipline, Vision Long Terme, Résilience) avec des règles XP spécifiques et des indicateurs visibles dans l'Observatoire.

**Ce qui ne change PAS** : Le système de "minutes guilty-free" reste intact (jauge, récompenses, temps libre) — c'est la couche de motivation principale. Les compétences sont une couche de progression complémentaire.

---

## Architecture retenue

### Couche de calcul : `src/lib/rewards/skillsEngine.ts` (nouveau)
Fonction pure `computeSkillXP(items, projects, transactions)` qui calcule les XP des 5 compétences à partir des données brutes. Retourne `SkillData[]`.

Les données nécessaires sont déjà en DB :
- `items` : `parent_id`, `is_completed`, `is_important`, `is_urgent`, `created_at`, `project_id`, `postpone_count`, `category`
- `items` (kanban column via `metadata.kanbanStatus` ou `project_status`)  
- `xp_transactions` : déjà utilisées
- `user_progress` : streak, tasks_completed

### Calcul XP par compétence

**1. Planification** (structuration hiérarchique)
- Données : requête `items` filtrée `item_type = 'task'` avec `parent_id`
- XP = (nb tâches avec ≥3 sous-tâches × 5) + (nb tâches avec 2 niveaux × 10) + (nb tâches structurées complétées à 100% × 25)
- Seuils niveaux : 20 / 50 / 100 tâches structurées complétées → utiliser `SKILL_LEVEL_THRESHOLDS` adapté

**2. Priorisation Stratégique** (Q2 / matrice Eisenhower)
- Données : `items` avec `is_important`, `is_urgent`, `is_completed`
- XP = (nb Q2 complétées × 5) + (nb Q1 complétées × 3) − malus si >70% Q1 sur 30j (−1/tâche excédentaire, plafonné à 0)
- Indicateur : % Q2 sur 30/60/90j

**3. Discipline** (constance)
- Données : `user_progress.current_task_streak`, `xp_transactions` pour jours actifs
- XP = (streak actuel × 20) + (nb semaines consécutives complètes × 20) + (bonus habitudes si ≥80% cette semaine × 10)
- Note : le bonus habitude nécessite de calculer le taux de complétion hebdomadaire depuis `habit_completions`

**4. Vision Long Terme** (projets)
- Données : `items` avec `project_id`, projets de `useProjects`
- XP = (nb projets complétés × 15) + (nb tâches projet Q2 complétées × 5)
- Indicateur : % tâches dans un projet, % projets complétés

**5. Résilience** (finir les tâches anciennes)
- Données : `items` avec `created_at`, `is_completed`, `metadata` (colonnes kanban passées)
- XP = (nb tâches complétées après ≥3 jours × 10) + (nb tâches passées par 3 colonnes × 15)
- Indicateur : taux de récupération

### Persistance des XP compétences
Les XP sont **recalculés à la volée** (pas de persistance supplémentaire en DB), exactement comme les 4 compétences actuelles. La table `user_skills` existe déjà mais n'est pas utilisée — on peut l'ignorer ou l'utiliser pour caching. On reste en recalcul pur pour rester simple.

### Affichage Observatoire : nouveaux indicateurs
Ajout d'une section "Indices de maturité" dans `ObservatoryView.tsx` avec :
- Indice Structuration (Planification) : profondeur moyenne
- Indice Stratégique (Priorisation) : % Q2 sur 30/60/90j  
- Taux de récupération (Résilience) : % tâches anciennes finies
- Indice Long Terme (Vision) : % tâches en projet

---

## Plan d'implémentation

### Fichiers à créer/modifier

| Fichier | Action | Détail |
|---|---|---|
| `src/lib/rewards/skillsEngine.ts` | **Créer** | Calcul XP des 5 compétences (fonctions pures) |
| `src/lib/rewards/constants.ts` | **Modifier** | Nouveaux seuils de niveaux par compétence |
| `src/lib/rewards/index.ts` | **Modifier** | Exporter le nouveau skillsEngine |
| `src/types/gamification.ts` | **Modifier** | Mettre à jour `SkillData` avec les nouveaux champs |
| `src/hooks/view-data/useRewardsViewData.ts` | **Modifier** | Remplacer `computeSkills` par appel au nouveau engine |
| `src/hooks/view-data/observatoryComputations.ts` | **Modifier** | Ajouter `calculateMaturityIndices()` |
| `src/hooks/view-data/useObservatoryViewData.ts` | **Modifier** | Exposer les nouveaux indices |
| `src/components/rewards/SkillsPanel.tsx` | **Modifier** | Adapter l'affichage aux 5 compétences avec leurs indicateurs |
| `src/components/views/observatory/ObservatoryView.tsx` | **Modifier** | Ajouter section "Indices de maturité" |

### Étape 1 — `skillsEngine.ts` (cœur du système)

```typescript
// Interfaces d'entrée
interface RawItem {
  id: string; parent_id?: string; is_completed: boolean;
  is_important: boolean; is_urgent: boolean;
  created_at: string; project_id?: string;
  postpone_count: number; category: string;
  metadata?: any;
}

// Retourne les 5 compétences avec XP calculé
export function computeAllSkills(
  items: RawItem[],
  currentStreak: number,
  habitWeeklyRate: number  // 0-1
): SkillData[]
```

Logique interne :
- `computePlanificationXP` : grouper par parent, compter niveaux de profondeur
- `computePriorisationXP` : compter Q1/Q2 complétées, appliquer malus
- `computeDisciplineXP` : streak × 20, bonus habitudes
- `computeVisionXP` : tâches avec project_id, projets complétés
- `computeResilienceXP` : tâches avec age ≥3j au moment de complétion (diff created_at vs updated_at approximatif)

### Étape 2 — `useRewardsViewData.ts`

Remplacer `computeSkills` (4 compétences) par un appel à `computeAllSkills` depuis le nouveau engine. Charger les données nécessaires en plus (items avec hiérarchie, taux habitudes).

### Étape 3 — Observatoire

Ajouter dans `observatoryComputations.ts` une fonction `calculateMaturityIndices` qui produit :
```typescript
interface MaturityIndices {
  structurationDepth: number;      // profondeur moyenne
  strategicIndex: { pct30: number; pct60: number; pct90: number }; // % Q2
  recoveryRate: number;             // % tâches anciennes finies
  longTermIndex: number;            // % tâches en projet
}
```

Afficher dans l'Observatoire sous forme de 4 cartes métriques (réutiliser `InsightCard`).

### Étape 4 — `SkillsPanel.tsx`

Adapter pour afficher 5 compétences avec :
- Icône, nom, niveau, barre de progression (existant)
- Ajouter : indicateur principal (ex: "Profondeur moy. 2.3" pour Planification)

### Seuils de niveaux
```
SKILL_LEVEL_THRESHOLDS (inchangés) = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500]
```
Les formules XP garantissent que le spam de petites tâches ne peut pas atteindre rapidement les niveaux élevés car les bonus se cumulent seulement via des comportements spécifiques (tâches structurées, Q2, streak long, projets, résilience).

### Note sur la Résilience et les colonnes Kanban
La détection "passage par 3 colonnes" nécessite un historique Kanban qui n'existe pas aujourd'hui. On simplifie : +15 XP si une tâche a `postpone_count ≥ 2` ET `age ≥ 3j` au moment de complétion. C'est un proxy raisonnable du comportement "tâche difficile finalement terminée".
