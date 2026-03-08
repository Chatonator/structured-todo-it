

# Nettoyage et factorisation du code

## Constat

Après analyse complète, voici les zones de code mort et de nettoyage identifiées :

### 1. Composants morts (à supprimer)

| Fichier | Raison |
|---------|--------|
| `src/components/task/QuickAddTask.tsx` | Ancien formulaire de création rapide, jamais importé (remplacé par le Sheet) |
| `src/components/common/TimeEstimateSelector.tsx` | Ancien select de durée, jamais utilisé (remplacé par `DurationPicker`) |
| `src/components/common/CategorySelector.tsx` | Simple wrapper passthrough vers `EisenhowerSelector`, jamais importé directement |
| `src/components/common/ContextSelector.tsx` | Ancien sélecteur de contexte, jamais utilisé (remplacé par `ContextPillSelector`) |

### 2. Barrel exports à nettoyer

| Fichier | Action |
|---------|--------|
| `src/components/common/index.ts` | Retirer `CategorySelector`, `ContextSelector`, `TimeEstimateSelector` |
| `src/components/task/fields/index.ts` | Retirer les ré-exports morts (`CategorySelector`, `ContextSelector`, `TimeEstimateSelector`) |
| `src/components/task/index.ts` | Retirer l'export de `QuickAddTask` |
| `src/components/routing/index.ts` | Barrel jamais importé — conserver par cohérence mais noter qu'il est inutilisé |

### 3. Nettoyage mineur

- **`src/types/index.ts`** : Barrel jamais utilisé (tous les imports vont directement vers `@/types/task`, `@/types/project`, etc.) — conserver comme documentation mais pas de nettoyage bloquant.

### Plan d'exécution

1. Supprimer les 4 fichiers morts
2. Nettoyer les 3 barrel exports
3. Vérifier qu'aucun import cassé ne subsiste

Pas de changement fonctionnel — uniquement du ménage.

