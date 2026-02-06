
# Plan de Correction : Bug de Création de Projets (et Decks)

## Problème Identifié

Les fonctions de conversion `projectToItemMetadata` et `deckToItemMetadata` retournent des propriétés explicitement `undefined` qui écrasent les valeurs par défaut lors de la fusion des métadonnées dans `useItems.createItem`.

### Démonstration du Bug

```typescript
// useProjects.ts - projectToItemMetadata
function projectToItemMetadata(project: Partial<ProjectWithKanban>): Partial<ItemMetadata> {
  return {
    color: project.color,    // undefined si non fourni
    status: project.status,  // undefined si non fourni
    // ...
  };
}

// Dans useItems.ts - createItemMutation
const defaultMeta = getDefaultMetadata('project'); 
// → { color: '#a78bfa', status: 'planning' }

const mergedMetadata = { ...defaultMeta, ...data.metadata };
// → Si data.metadata = { color: undefined, status: undefined, ... }
// → mergedMetadata = { color: undefined, status: undefined } ← BUG!

const missingFields = getMissingRequiredFields('project', mergedMetadata);
// → ['color', 'status'] car undefined est considéré comme manquant
// → throw Error("Missing required fields: color, status")
```

### Pourquoi ça fonctionne parfois

Quand `createProject` est appelé avec des valeurs explicites :
```typescript
await createProject('Mon projet', undefined, '📚', '#a78bfa');
// icon = '📚', color = '#a78bfa' sont fournis → pas de undefined
```

Mais si quelque chose passe mal (ex: modale fermée avant soumission complète, appel avec des paramètres manquants), les `undefined` écrasent les defaults.

---

## Solution

Nettoyer les propriétés `undefined` à **deux niveaux** pour une robustesse maximale :

### 1. Dans `projectToItemMetadata` (useProjects.ts)

Ne retourner que les propriétés définies :

```typescript
function projectToItemMetadata(project: Partial<ProjectWithKanban>): Partial<ItemMetadata> {
  const metadata: Partial<ItemMetadata> = {
    // Champs harmonisés obligatoires
    category: 'Projet' as any,
    context: 'Perso' as any,
    estimatedTime: 60,
  };
  
  // Champs requis pour project - toujours avec valeur par défaut
  metadata.color = project.color || '#a78bfa';
  metadata.status = project.status || 'planning';
  
  // Champs optionnels - seulement si définis
  if (project.description !== undefined) metadata.description = project.description;
  if (project.icon !== undefined) metadata.icon = project.icon;
  if (project.targetDate !== undefined) metadata.targetDate = project.targetDate;
  if (project.progress !== undefined) metadata.progress = project.progress;
  if (project.completedAt !== undefined) metadata.completedAt = project.completedAt;
  if (project.showInSidebar !== undefined) metadata.showInSidebar = project.showInSidebar;
  if (project.kanbanColumns !== undefined) metadata.kanbanColumns = project.kanbanColumns;
  
  return metadata;
}
```

### 2. Dans `deckToItemMetadata` (useDecks.ts)

Même logique :

```typescript
function deckToItemMetadata(deck: Partial<Deck>): Partial<ItemMetadata> {
  const metadata: Partial<ItemMetadata> = {
    // Champs harmonisés
    category: deck.category || 'Quotidien',
    context: deck.context || 'Perso',
    estimatedTime: deck.estimatedTime || 30,
  };
  
  // Champs requis pour deck - toujours avec valeur par défaut
  metadata.color = deck.color || '#ec4899';
  metadata.isDefault = deck.isDefault ?? false;
  
  // Champs optionnels - seulement si définis
  if (deck.description !== undefined) metadata.description = deck.description;
  if (deck.icon !== undefined) metadata.icon = deck.icon;
  
  return metadata;
}
```

### 3. Dans `createItemMutation` (useItems.ts)

Ajouter un filtre de sécurité pour nettoyer les `undefined` restants :

```typescript
const createItemMutation = useMutation({
  mutationFn: async (data: CreateItemData) => {
    // ...
    
    const defaultMeta = getDefaultMetadata(data.contextType);
    
    // Nettoyer les undefined des métadonnées fournies
    const cleanMetadata = data.metadata 
      ? Object.fromEntries(
          Object.entries(data.metadata).filter(([_, v]) => v !== undefined)
        )
      : {};
    
    const mergedMetadata = { ...defaultMeta, ...cleanMetadata };
    
    // ... reste du code
  }
});
```

---

## Fichiers à Modifier

| Fichier | Modification |
|---------|--------------|
| `src/hooks/useProjects.ts` | Refactorer `projectToItemMetadata` pour filtrer les undefined |
| `src/hooks/useDecks.ts` | Refactorer `deckToItemMetadata` pour filtrer les undefined |
| `src/hooks/useItems.ts` | Ajouter un filtre de sécurité dans `createItemMutation` |

---

## Diagramme de Flux Corrigé

```text
┌─────────────────────────────────────────────────────────────┐
│  AVANT (BUGUÉ)                                              │
├─────────────────────────────────────────────────────────────┤
│  projectToItemMetadata({ name: 'X' })                       │
│  → { color: undefined, status: undefined, ... }             │
│                                                             │
│  mergedMetadata = { ...defaults, ...metadata }              │
│  → { color: undefined, status: undefined }                  │
│                                                             │
│  getMissingRequiredFields → ['color', 'status']             │
│  → throw Error ❌                                           │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  APRÈS (CORRIGÉ)                                            │
├─────────────────────────────────────────────────────────────┤
│  projectToItemMetadata({ name: 'X' })                       │
│  → { color: '#a78bfa', status: 'planning', ... }            │
│                                                             │
│  cleanMetadata = filtrer undefined                          │
│  mergedMetadata = { ...defaults, ...cleanMetadata }         │
│  → { color: '#a78bfa', status: 'planning' }                 │
│                                                             │
│  getMissingRequiredFields → []                              │
│  → Création réussie ✅                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Avantages de Cette Approche

1. **Double protection** : Les conversions métier ET le hook central sont sécurisés
2. **Rétrocompatibilité** : Aucun changement d'API pour les appelants
3. **Robustesse** : Fonctionne même avec des données incomplètes
4. **Maintenabilité** : Logique claire et prévisible

---

## Impact Attendu

- Les nouveaux utilisateurs pourront créer leur premier projet/deck
- Les utilisateurs existants ne verront aucune différence
- Les appels avec des paramètres partiels fonctionneront correctement
- Les erreurs "Missing required fields" seront éliminées
