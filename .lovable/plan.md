

# Plan: Garde-fous XP et ajustements comportementaux

## Vue d'ensemble

Six chantiers distincts pour renforcer le modèle de gamification : anti-spam 15 min, résilience multi-niveaux, indice global de maturité, alertes surcharge cognitive, bonus vision long terme projets, et limitation structurelle des sous-tâches.

---

## 1. Anti-spam (garde-fou 15 minutes)

**Fichier:** `src/hooks/useGamification.ts` — fonction `rewardTaskCompletion`

- Après le guard d'idempotence (ligne ~116), ajouter une vérification : comparer `task.createdAt` (ou requêter `items.created_at` depuis la DB) avec `Date.now()`. Si la différence est < 15 minutes, skip l'attribution XP (return early, ou enregistrer la transaction avec `points_gained: 0` et metadata `{ blocked: 'anti-spam' }`).
- La tâche reste marquée complétée (pas de blocage côté `toggleTaskCompletion`), seul le scoring est annulé.
- Ajouter une constante `ANTI_SPAM_MINUTES = 15` dans `src/lib/rewards/constants.ts`.

## 2. Résilience multi-niveaux

**Fichier:** `src/lib/rewards/engine.ts` — fonction `computeTaskMinutes`

- Ajouter un champ optionnel `ageInDays` à `TaskRewardInput`.
- Calculer un bonus additif basé sur l'âge :
  - `≥ 14 jours → +20 XP`
  - `≥ 7 jours → +10 XP`
  - `≥ 3 jours → +5 XP`
- Ajouter un champ optionnel `kanbanChanges` à `TaskRewardInput`. Si `≥ 2` → `+15 XP`.
- Intégrer ces bonus dans le résultat `TaskRewardResult` (nouveau champ `resilienceBonus`, `kanbanBonus`).

**Fichier:** `src/hooks/useGamification.ts` — `rewardTaskCompletion`

- Calculer `ageInDays` depuis `items.created_at`.
- Pour le bonus Kanban, il n'y a pas de tracking historique des changements de colonne actuellement. Option : compter le `postpone_count` comme proxy, ou ajouter une colonne `kanban_changes` dans `items.metadata`. On utilisera `postpone_count ≥ 2` comme proxy initial (déjà disponible en DB).

**Fichier:** `src/lib/rewards/skillsEngine.ts` — `computeResilienceXP`

- Remplacer le bonus fixe `+10 XP` pour `age ≥ 3` par les paliers multi-niveaux (+5/+10/+20).
- Ajuster le calcul du niveau : `≥ 25%` des tâches complétées avec `≥ 7 jours` d'ancienneté sur 60 jours pour monter de niveau.

## 3. Indice global de maturité

**Fichier:** `src/hooks/view-data/observatoryComputations.ts`

- Créer une fonction `computeGlobalMaturityScore(indices: MaturityIndices)` retournant :
  - `score` (0-100) : moyenne pondérée des 5 indices normalisés
  - `isBalanced` : aucun indice < 30%
  - `highLevelSkillCount` : nombre de compétences ≥ niveau 3
  - `alerts` : liste de messages si déséquilibre détecté

**Fichier:** `src/components/views/observatory/ObservatoryView.tsx`

- Sous la section "Indices de maturité organisationnelle", ajouter l'affichage du score global composite avec une jauge visuelle et un message qualitatif (pas de pénalité, juste un reflet).

## 4. Surcharge cognitive (sans pénalité)

**Fichier:** `src/hooks/view-data/observatoryComputations.ts`

- Créer `computeCognitiveLoad(tasks, projects)` retournant :
  - `openTaskCount`, `completedTaskCount`, `openCompletedRatio`
  - `activeProjectCount`
  - `isOverloaded` (seuils : > 50 tâches ouvertes, ratio > 3:1, > 5 projets actifs)
  - `suggestions` : liste d'actions recommandées (archiver tâches > 30j inactives, regrouper isolées, clôturer projets inactifs)

**Fichier:** `src/components/views/observatory/ObservatoryView.tsx`

- Ajouter un composant d'alerte douce (Card avec icône warning, fond ambre léger) qui apparaît conditionnellement si `isOverloaded`. Afficher les suggestions comme boutons/liens d'action.
- Aucun malus XP associé.

## 5. Vision long terme — Projets durables

**Fichier:** `src/lib/rewards/engine.ts`

- Ajouter un champ optionnel `projectContext` à `TaskRewardInput` : `{ isProjectTask: boolean; projectAgeInDays?: number; projectCompletedAt?: Date; weeklyActivity?: boolean }`.
- Bonus additifs :
  - `+5 XP` si tâche appartient à un projet
  - `+15 XP` si projet complété (attribué lors de la complétion du projet)
  - `+10 XP` si projet actif ≥ 60 jours
  - `+20 XP` si projet actif ≥ 90 jours avec progression continue (≥ 1 tâche/semaine)

**Fichier:** `src/hooks/useGamification.ts`

- Dans `rewardTaskCompletion`, enrichir l'input avec le contexte projet (requêter le projet si `task.projectId` existe pour obtenir `created_at`, calculer l'âge).
- Ajouter une fonction `rewardProjectCompletion(projectId)` pour le bonus de +15 XP projet complété.

**Fichier:** `src/lib/rewards/skillsEngine.ts` — `computeVisionXP`

- Intégrer les bonus projet durables (+10/+20) dans le calcul XP Vision.

## 6. Limitation structurelle des sous-tâches

**Fichier:** `src/components/task/TaskModal.tsx`

- Dans `handleFinish`, si `parentTask` existe et `parentTask.level >= 2`, bloquer la création et afficher une erreur.
- Ajouter une vérification du nombre d'enfants directs : requêter les items avec `parent_id = parentTask.id`, si `count ≥ 3`, bloquer et afficher "Maximum 3 sous-tâches atteint".

**Fichier:** `src/hooks/useTasks.ts` — `addTask`

- Ajouter un guard : si `taskData.level > 2`, rejeter.
- Ajouter un guard : compter les siblings (items avec même `parentId`), si `≥ 3`, rejeter.

**Fichier:** `src/components/sidebar/AppSidebar.tsx`

- Même vérification avant d'ouvrir le modal de sous-tâche : si le parent est au level 2 ou a déjà 3 enfants, désactiver l'action.

**Fichier:** `src/utils/taskValidation.ts`

- Ajouter des fonctions utilitaires `canAddSubTask(parentLevel, siblingCount)` et constantes `MAX_SUBTASK_DEPTH = 2`, `MAX_CHILDREN_PER_TASK = 3`.

---

## Constantes à ajouter (`src/lib/rewards/constants.ts`)

```text
ANTI_SPAM_MINUTES = 15
RESILIENCE_BONUS_3D = 5
RESILIENCE_BONUS_7D = 10
RESILIENCE_BONUS_14D = 20
KANBAN_CHANGE_BONUS = 15
KANBAN_MIN_CHANGES = 2
PROJECT_TASK_BONUS = 5
PROJECT_COMPLETED_BONUS = 15
PROJECT_ACTIVE_60D_BONUS = 10
PROJECT_ACTIVE_90D_BONUS = 20
COGNITIVE_LOAD_OPEN_TASKS_THRESHOLD = 50
COGNITIVE_LOAD_RATIO_THRESHOLD = 3
COGNITIVE_LOAD_ACTIVE_PROJECTS_THRESHOLD = 5
MAX_SUBTASK_DEPTH = 2
MAX_CHILDREN_PER_TASK = 3
```

## Résumé des fichiers modifiés

| Fichier | Changement |
|---|---|
| `src/lib/rewards/constants.ts` | Nouvelles constantes |
| `src/lib/rewards/engine.ts` | Bonus résilience, projet, anti-spam check |
| `src/lib/rewards/skillsEngine.ts` | Résilience multi-niveaux, vision projets durables |
| `src/lib/rewards/index.ts` | Exports nouveaux |
| `src/hooks/useGamification.ts` | Anti-spam guard, enrichissement projet, `rewardProjectCompletion` |
| `src/hooks/view-data/observatoryComputations.ts` | Score maturité global, surcharge cognitive |
| `src/components/views/observatory/ObservatoryView.tsx` | Affichage maturité globale + alerte surcharge |
| `src/components/task/TaskModal.tsx` | Limite profondeur/nombre sous-tâches |
| `src/hooks/useTasks.ts` | Guards sous-tâches |
| `src/utils/taskValidation.ts` | Utilitaires validation sous-tâches |

Aucune migration DB requise — toutes les données nécessaires existent déjà (created_at, postpone_count, project_id, metadata).

