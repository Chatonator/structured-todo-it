

# Factorisation de l'Application

## Problemes Identifies

### 1. Duplication des vues : deux emplacements pour les memes composants
Actuellement, les vues existent a deux endroits :
- `src/components/habits/HabitsView.tsx` (composant reel)
- `src/components/views/habits/HabitsView.tsx` (simple re-export)

Meme probleme pour `projects/` et `rewards/`. Certaines vues (Observatory, Toolbox, Home, Teams, Timeline) sont deja correctement placees dans `src/components/views/`, tandis que d'autres restent dans des dossiers "legacy" avec un fichier de re-export qui ajoute de la confusion.

### 2. Duplication RewardsView
Il existe deux fichiers `RewardsView.tsx` :
- `src/components/rewards/RewardsView.tsx` : version legacy utilisant `useGamification` directement
- `src/components/views/rewards/RewardsView.tsx` : version refactorisee utilisant `useRewardsViewData`

Les deux coexistent, et le `viewRegistry` charge la version de `views/rewards/`.

### 3. Hook mort : useEisenhowerViewData exporte depuis index mais lie a l'ancien systeme
Le hook `useEisenhowerViewData` est encore exporte depuis `view-data/index.ts` mais n'est plus utilise que par `EisenhowerTool.tsx` dans la toolbox. Il devrait etre deplace dans le dossier de l'outil ou renomme pour plus de clarte.

### 4. Re-export inutile de useRule135Tool dans view-data/index.ts
Le hook `useRule135Tool` est exporte depuis `view-data/index.ts` alors qu'il appartient exclusivement a l'outil 1-3-5 de la toolbox. Ce n'est pas un hook de vue, c'est un hook d'outil.

### 5. Composants legacy orphelins
Les dossiers `src/components/rewards/` et `src/components/projects/` contiennent les composants originaux. Apres consolidation, les vues principales (`RewardsView`, `ProjectsView`) devraient vivre dans `src/components/views/`. Les sous-composants specifiques (ProjectGrid, ProjectCard, etc.) peuvent rester dans leur dossier ou etre deplaces.

## Plan de Factorisation

### Etape 1 : Consolider les vues Habits

**Deplacer** le contenu de `src/components/habits/HabitsView.tsx` vers `src/components/views/habits/HabitsView.tsx` (remplacer le re-export par le vrai composant).

Mettre a jour les imports dans `viewRegistry.ts` et `src/components/views/index.ts` (deja corrects car ils pointent vers `views/habits/`).

L'ancien `src/components/habits/HabitsView.tsx` devient un re-export inverse temporaire pour ne pas casser les eventuels imports directs.

### Etape 2 : Consolider la vue Projects

**Deplacer** le contenu de `src/components/projects/ProjectsView.tsx` vers `src/components/views/projects/ProjectsView.tsx`.

L'ancien fichier devient un re-export inverse.

### Etape 3 : Nettoyer la vue Rewards

**Supprimer** `src/components/rewards/RewardsView.tsx` (version legacy, non referencee).

La version dans `src/components/views/rewards/RewardsView.tsx` est deja la bonne et la seule utilisee.

### Etape 4 : Reorganiser les hooks de la toolbox

**Retirer** de `src/hooks/view-data/index.ts` :
- `useRule135Tool` (re-export inutile - les consommateurs importent deja directement depuis le dossier de l'outil)
- Renommer l'export `useEisenhowerViewData` en ajoutant un commentaire clarifiant qu'il sert la toolbox

### Etape 5 : Nettoyer les index d'exports

Mettre a jour `src/components/views/index.ts` pour retirer les commentaires "re-export from original location" devenus obsoletes apres les etapes 1-3.

## Details Techniques

### Fichiers a modifier

| Fichier | Action |
|---------|--------|
| `src/components/views/habits/HabitsView.tsx` | Remplacer le re-export par le vrai composant (copie depuis `components/habits/`) |
| `src/components/habits/HabitsView.tsx` | Transformer en re-export vers `views/habits/` |
| `src/components/views/projects/ProjectsView.tsx` | Remplacer le re-export par le vrai composant (copie depuis `components/projects/`) |
| `src/components/projects/ProjectsView.tsx` | Transformer en re-export vers `views/projects/` |
| `src/components/rewards/RewardsView.tsx` | Supprimer (version legacy non utilisee) |
| `src/hooks/view-data/index.ts` | Retirer le re-export de `useRule135Tool` |
| `src/components/views/index.ts` | Nettoyer les commentaires TODO |

### Fichiers NON impactes

Les sous-composants (`HabitGrid`, `HabitDeckCard`, `ProjectGrid`, `ProjectCard`, etc.) restent dans `src/components/habits/` et `src/components/projects/` car ils ne sont pas des vues -- ce sont des composants de feature. Seul le composant racine de vue (`*View.tsx`) est deplace.

## Resultat Attendu

Apres cette factorisation :
- Chaque vue a un seul emplacement canonique dans `src/components/views/{feature}/`
- Les hooks de vue sont dans `src/hooks/view-data/`
- Les hooks specifiques aux outils restent dans `src/components/views/toolbox/tools/`
- Les re-exports "legacy" pointent vers la nouvelle source (et non l'inverse)
- Zero duplication de code

