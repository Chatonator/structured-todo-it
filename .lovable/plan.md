

# Unification de l'affichage des tâches et enrichissement du TaskLinker

## Constat : duplications identifiées

L'audit révèle **3 catégories de duplications** systématiques :

### 1. Fonctions utilitaires dupliquées localement
| Fonction | Fichiers dupliqués | Alternative centralisée existante |
|---|---|---|
| `getCategoryColor()` (switch) | `SidebarTaskItem`, `TaskFolders` | `getCategoryIndicatorColor()` dans `lib/styling` |
| `getCategoryBadgeClass()` (switch) | `TaskTableRow` | `getCategoryClasses()` dans `lib/styling` |
| `formatTime()` (minutes→string) | `SidebarTaskItem`, `SidebarListItem`, `TaskFolders` | `formatDuration()` dans `lib/formatters` |

### 2. Lignes de tâche reconstruites partout
Chaque endroit qui affiche une tâche reconstruit : nom + barre catégorie + durée + badge contexte + badge priorité. On a au moins **6 variantes** : `TaskCard`, `TaskDeckItem`, `SidebarTaskItem`, `TaskTableRow`, `TaskRow` (TaskLinker), `TaskItem` (Rule135).

### 3. TaskLinker trop basique
Le TaskLinker actuel n'a que 2 filtres (recherche + contexte Pro/Perso) et un affichage minimal. Il n'utilise pas les badges primitives existantes (`PriorityBadge`, `CategoryBadge`) de façon cohérente.

---

## Plan de refactorisation

### Phase 1 — Supprimer les duplications utilitaires

**Fichiers modifiés** : `SidebarTaskItem.tsx`, `SidebarListItem.tsx`, `TaskFolders.tsx`, `TaskTableRow.tsx`

- Supprimer les fonctions locales `getCategoryColor`, `getCategoryBadgeClass`, `formatTime`
- Remplacer par les imports centralisés : `getCategoryIndicatorColor`, `getCategoryClasses`, `formatDuration`

### Phase 2 — Créer un composant `TaskRow` primitif

**Nouveau fichier** : `src/components/primitives/cards/TaskRow.tsx`

Un composant d'affichage de ligne de tâche unifié avec variantes, réutilisable dans le TaskLinker, les listes, les outils :

```text
<TaskRow
  task={task}
  variant="compact" | "default" | "chip"
  showCategory={true}
  showPriority={true}
  showContext={true}
  showDuration={true}
  onClick / onSelect / onRemove
  actionSlot={ReactNode}
/>
```

- Utilise `CategoryBadge`, `PriorityBadge`, `ContextBadge` des primitives
- Barre de couleur catégorie via `getCategoryIndicatorColor`
- Durée via `formatDuration`

### Phase 3 — Enrichir le TaskLinker

**Fichiers modifiés** : `useTaskLinker.ts`, `TaskLinker.tsx`

**Nouveaux filtres dans le hook** :
- Filtre par **catégorie** (Obligation/Quotidien/Envie/Autres)
- Filtre par **priorité** (Le plus important → Si j'ai le temps)
- Import des options depuis `config/taskFilterOptions.ts` (déjà existant)

**Améliorations UI** :
- Utiliser le nouveau `TaskRow` au lieu du `TaskRow` interne
- Chips de filtres catégorie avec couleurs du design system
- Chips de filtres priorité avec couleurs
- Les chips sélectionnés (`SelectedChip`) affichent barre catégorie + badges complets
- Compteur de résultats filtrés

### Phase 4 — Migrer les outils existants

**Fichiers modifiés** : `Rule135Tool.tsx` (son `TaskItem` interne → `TaskRow` primitif)

Le `TaskRow` dans le TaskLinker sera automatiquement mis à jour pour tous les outils qui l'utilisent (Pomodoro, Rule135).

---

## Fichiers impactés

| Fichier | Action |
|---|---|
| `src/components/primitives/cards/TaskRow.tsx` | **Nouveau** — ligne de tâche réutilisable |
| `src/components/primitives/cards/index.ts` | Export `TaskRow` |
| `src/components/views/toolbox/shared/useTaskLinker.ts` | Ajouter filtres catégorie + priorité |
| `src/components/views/toolbox/shared/TaskLinker.tsx` | Enrichir UI, utiliser `TaskRow`, ajouter filtres |
| `src/components/views/toolbox/tools/rule135/Rule135Tool.tsx` | Utiliser `TaskRow` au lieu du `TaskItem` local |
| `src/components/sidebar/SidebarTaskItem.tsx` | Supprimer `getCategoryColor` et `formatTime` locaux |
| `src/components/sidebar/SidebarListItem.tsx` | Supprimer `formatTime` local |
| `src/components/views/observatory/components/TaskTableRow.tsx` | Supprimer `getCategoryBadgeClass` local, utiliser `CategoryBadge` |
| `src/components/views/observatory/components/TaskFolders.tsx` | Supprimer `getCategoryColor` et `formatTime` locaux |

