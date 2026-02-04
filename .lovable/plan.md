
# Integration de l'Observatoire et Organisation en Dossiers

## Contexte

La vue Observatory (fusion des anciennes vues Taches et Terminées) existe et fonctionne, mais n'est pas accessible car :
- La navigation utilise encore les anciennes clés `tasks` et `completed`
- L'icone `observatory` n'est pas dans le mapping de navigation
- L'interface actuelle affiche tout en liste plate sans organisation

## Modifications Prevues

### Phase 1 : Correction de la Navigation

**Fichier : `src/contexts/AppContext.tsx`**
- Remplacer `tasks` et `completed` par `observatory` dans `allNavigationItems`
- Mettre a jour le titre : "Observatoire" avec icone appropriee

**Fichier : `src/components/layout/ViewNavigation.tsx`**
- Ajouter `observatory: Telescope` dans l'`iconMap`
- Supprimer les entrees obsoletes `tasks` et `completed`

### Phase 2 : Organisation en Dossiers Collapsibles

**Nouveau composant : `src/components/views/observatory/components/TaskFolders.tsx`**
- Groupement par projet (dossiers collapsibles)
- Groupement secondaire par categorie
- Compteurs et stats par dossier
- Mode compact avec une ligne par tache

**Structure visuelle proposee :**

```text
+------------------------------------------+
| Observatoire                              |
+------------------------------------------+
| [Actives] [Terminees] [Zombies] [Recent] |
+------------------------------------------+
| > Projet Alpha (5 taches - 4h30)         |
|   > Obligations (2)                      |
|     - Revision contrat        30min  Pro |
|     - Appel client           1h     Pro  |
|   > Envies (3)                           |
|     - Design maquette        2h     Perso|
+------------------------------------------+
| > Sans projet (12 taches - 8h)           |
|   > Quotidien (8)                        |
|     - ...                                |
+------------------------------------------+
```

### Phase 3 : Hook de Groupement

**Fichier : `src/hooks/view-data/useObservatoryViewData.ts`**
- Ajouter fonction `groupTasksByProject()` et `groupTasksByCategory()`
- Calculer les stats par groupe (temps total, nombre)
- Gerer l'etat d'expansion des dossiers

## Details Techniques

### Modifications AppContext.tsx

```text
Avant:
  { key: 'tasks', title: 'Taches', icon: '...' },
  ...
  { key: 'completed', title: 'Terminees', icon: '...' }

Apres:
  { key: 'observatory', title: 'Observatoire', icon: '...' }
```

### Structure des Groupes

```text
interface TaskGroup {
  id: string;
  name: string;
  icon: ReactNode;
  tasks: EnrichedTask[];
  totalTime: number;
  completedCount: number;
  isExpanded: boolean;
  subGroups?: TaskGroup[];  // Pour categorie dans projet
}
```

### Composant TaskFolders

Props:
- `groups: TaskGroup[]`
- `onToggleExpand: (groupId: string) => void`
- `onTaskAction: (taskId, action) => void`

Features:
- Chevron pour expand/collapse
- Badge avec compteur
- Temps total par groupe
- Actions bulk sur le groupe

## Fichiers Impactes

| Fichier | Action |
|---------|--------|
| `src/contexts/AppContext.tsx` | Modifier navigation items |
| `src/components/layout/ViewNavigation.tsx` | Ajouter icone observatory |
| `src/hooks/view-data/useObservatoryViewData.ts` | Ajouter groupement |
| `src/components/views/observatory/components/TaskFolders.tsx` | Creer |
| `src/components/views/observatory/components/index.ts` | Exporter |
| `src/components/views/observatory/ObservatoryView.tsx` | Integrer TaskFolders |

## Benefices

1. **Accessibilite** : La vue est enfin accessible depuis la navigation
2. **Organisation** : Les taches sont regroupees logiquement par projet
3. **Compacite** : Vue en accordeon qui ne surcharge pas visuellement
4. **Productivite** : Vision claire du temps par projet/categorie
