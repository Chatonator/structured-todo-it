
# Restructuration du systeme XP — Competences alignees sur la realite

## Resume

Refonte du moteur de competences (`skillsEngine.ts`) pour aligner les 5 competences (Planification, Priorisation, Discipline, Vision long terme, Resilience) sur les comportements reels de l'application. Les regles XP sont recalibrees, la priorisation distingue taches classiques (Eisenhower) et taches projet (priorite interne), et les indices de maturite sont exposes dans l'Observatoire.

---

## Ce qui change

### 1. Planification — Recompenser la clarte, pas la complexite

**Regles actuelles** : +5 XP pour 3+ sous-taches, +10 XP pour profondeur 2+, +25 XP pour structuration complete.

**Nouvelles regles** :
- +5 XP si tache contient 2+ sous-taches
- +8 XP si tache contient exactement 3 sous-taches
- +5 XP bonus si toutes les sous-taches sont completees
- +3 XP si une sous-tache contient 2+ sous-sous-taches (bonus leger)
- Niveaux : 20 / 50 / 100 taches structurees (2+ sous-taches)

### 2. Priorisation — Deux systemes distincts

**A) Taches classiques (Eisenhower)** :
- +5 XP tache Q2 completee
- +3 XP tache Q1 completee
- Niveau superieur si 40%+ des completees sont Q2 sur 60 jours
- Malus si >70% Q1 sur 30 jours (conserve de l'existant)

**B) Taches projet (priorite interne `subCategory`)** :
- +5 XP "Le plus important"
- +3 XP "Important"
- +1 XP "Peut attendre"
- +0 XP "Si j'ai le temps"
- -2 XP si sur 30 jours >50% des completees projet sont "Si j'ai le temps" alors que des priorites hautes restent ouvertes

### 3. Discipline — Constance et engagement

**Regles actuelles** : +20 XP par bloc de 7 jours, +10 XP habitudes 80%+.

**Nouvelles regles** :
- +1 XP par tache completee (toutes taches)
- +20 XP tous les 7 jours consecutifs
- +10 XP par semaine d'habitudes validees 80%+
- Niveaux : 30 / 60 / 90 jours actifs

### 4. Vision long terme — Valoriser le travail en projet

**Regles actuelles** : +15 XP par projet complete, +5 XP par Q2 en projet.

**Nouvelles regles** :
- +15 XP projet complete
- +5 XP si 70%+ des taches d'un projet sont completees
- Niveau superieur si 50%+ des taches completees appartiennent a des projets
- Ne pas penaliser les taches isolees

### 5. Resilience — Finir ce qui traine

**Regles actuelles** : +10 XP tache ancienne (3+ jours), +15 XP si reportee 2+ fois.

**Nouvelles regles** :
- +10 XP tache completee apres 3+ jours
- +15 XP si tache passe par colonnes Kanban (projectStatus change)
- Niveau superieur si 25%+ des completees sont des taches anciennes

---

## Plan technique

### Fichiers a modifier

**1. `src/lib/rewards/skillsEngine.ts`** — Coeur des changements
- Recrire `computePlanificationXP` : compter sous-taches (2+), bonus 3, bonus completion totale, bonus sous-sous-taches leger
- Recrire `computePriorisationXP` : separer Eisenhower (taches sans `project_id`) et priorite interne (taches avec `project_id`, utilisant `subCategory`). Ajouter malus priorite basse projet.
- Modifier `computeDisciplineXP` : ajouter `completedTaskCount` en param, +1 XP par tache
- Modifier `computeVisionXP` : ajouter bonus +5 XP si 70%+ taches projet completees (necessite `projectTaskCounts` en entree)
- Modifier `computeResilienceXP` : ajouter bonus Kanban (+15 XP si `projectStatus` a change avant completion)
- Enrichir `RawSkillItem` avec `sub_category?: string` et `project_status?: string`
- Mettre a jour `SkillsEngineInput` avec `activeDaysCount: number`
- Ajouter seuils de niveau specifiques par competence au lieu des generiques

**2. `src/lib/rewards/constants.ts`**
- Ajouter constantes pour les seuils de niveau par competence :
  - `PLANIF_LEVEL_THRESHOLDS = [0, 20, 50, 100]` (en taches structurees)
  - `PRIO_LEVEL_Q2_THRESHOLD = 40` (% sur 60 jours)
  - `DISCIPLINE_LEVEL_DAYS = [30, 60, 90]`
  - `VISION_LEVEL_PCT_IN_PROJECT = 50`
  - `RESILIENCE_LEVEL_PCT_ANCIENT = 25`

**3. `src/hooks/view-data/useRewardsViewData.ts`** — Passer les nouvelles donnees au moteur
- Enrichir les items envoyes a `computeAllSkills` avec `sub_category` et `project_status`
- Calculer `activeDaysCount` et le passer en input

**4. `src/hooks/view-data/observatoryComputations.ts`** — Indices dans l'Observatoire
- Remplacer `MaturityIndices` par 5 indices nommes : strategique, structuration, constance, long terme, resilience
- Calculer via `computeAllSkills` directement

**5. `src/components/views/observatory/components/InsightsCards.tsx`** — Afficher les indices
- Ajouter une rangee de 5 indices sous les cartes existantes (ou remplacer)
- Chaque indice : nom, valeur %, icone, couleur

**6. `src/components/rewards/SkillsPanel.tsx`** — Afficher niveaux par competence
- Adapter l'indicateur par competence pour montrer le critere de niveau (ex: "12/20 taches structurees")

---

## Ce qui ne change PAS

- Le systeme de guilty-free minutes (`engine.ts`) reste intact
- Le `useGamification` hook et la logique de reward par tache completee restent identiques
- La base de donnees ne change pas (pas de migration)
- Les recompenses, claim history, jauge restent en place
