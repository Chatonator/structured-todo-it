

# Plan de correction des bugs Timeline

## Problèmes identifiés

### Bug 1 : Tâches non planifiées manquantes
**Cause racine** : Incohérence entre deux convertisseurs `itemToTask` :
- `useTasks.ts` lit `projectId` depuis `metadata.projectId`
- `itemConverters.ts` lit `projectId` depuis `item.parentId`

Cela provoque une exclusion incorrecte des tâches dans le filtre `mainTasks` de la sidebar, où `!task.projectId` ne fonctionne pas correctement.

### Bug 2 : Tâches qui sortent des projets / duplication
**Cause racine** : Le même problème d'incohérence. Quand `assignTaskToProject` est appelé :
- Il met à jour `parentId` avec le projectId
- Il met aussi à jour `metadata.projectId`
- Mais les lectures sont différentes selon le fichier

Résultat : une tâche peut apparaître comme "hors projet" dans un contexte et "dans un projet" dans un autre.

### Bug 3 : Tâches dépassées ne retournant pas à "À planifier"
**Cause** : Pas de mécanisme automatique pour déplanifier les événements dont la date est passée et qui n'ont pas été complétés.

---

## Solutions proposées

### 1. Unifier le convertisseur itemToTask

**Fichier** : `src/utils/itemConverters.ts`

Modifier la logique pour :
- Utiliser `item.parentId` comme source de vérité pour les `project_task`
- Garder `meta.projectId` comme fallback pour compatibilité ascendante
- Ajouter une vérification de l'`item_type` pour déterminer si c'est une tâche de projet

```typescript
export function itemToTask(item: Item): Task {
  const meta = item.metadata || {};
  const isProjectTask = item.contextType === 'project_task';
  
  return {
    id: item.id,
    name: item.name,
    // ... autres champs ...
    
    // projectId: utiliser parentId pour project_task, sinon meta.projectId
    projectId: isProjectTask 
      ? item.parentId 
      : (meta.projectId as string | undefined),
    projectStatus: (meta.projectStatus as Task['projectStatus']) || 
      (isProjectTask ? 'todo' : undefined),
  };
}
```

### 2. Supprimer le convertisseur dupliqué dans useTasks.ts

**Fichier** : `src/hooks/useTasks.ts`

- Importer `itemToTask` depuis `@/utils/itemConverters`
- Supprimer la fonction locale `itemToTask` dupliquée
- Cela garantit une source unique de conversion

### 3. Ajouter un mécanisme de nettoyage des événements dépassés

**Fichier** : `src/hooks/useTimelineScheduling.ts`

Ajouter une fonction `cleanupOverdueEvents` qui :
1. Détecte les événements passés non complétés
2. Supprime automatiquement le `time_event` correspondant
3. La tâche réapparaît dans les tâches non planifiées

```typescript
const cleanupOverdueEvents = useCallback(async () => {
  if (!user) return;
  
  const now = new Date();
  const today = startOfDay(now);
  
  for (const event of overdueEvents) {
    // Ne pas toucher aux événements d'aujourd'hui
    if (isToday(event.startsAt)) continue;
    
    // Supprimer l'événement planifié pour les tâches (pas les habitudes)
    if (event.entityType === 'task') {
      await deleteEntityEvent('task', event.entityId);
      logger.debug('Auto-unscheduled overdue task', { 
        taskId: event.entityId, 
        originalDate: event.startsAt 
      });
    }
  }
  
  await loadEvents();
}, [user, overdueEvents, deleteEntityEvent, loadEvents]);
```

### 4. Ajouter une sécurité dans assignTaskToProject

**Fichier** : `src/hooks/useProjects.ts`

Vérification avant assignation :
- Récupérer l'état actuel de la tâche depuis la base de données (pas du state React)
- Éviter les mutations si la tâche est déjà dans le projet cible
- Ajouter un guard contre les appels multiples

```typescript
const assignTaskToProject = useCallback(async (
  taskId: string,
  projectId: string | null,
  existingMetadata?: Record<string, unknown>
) => {
  // Guard: vérifier l'état actuel dans la DB
  const { data: currentItem } = await supabase
    .from('items')
    .select('parent_id, item_type, metadata')
    .eq('id', taskId)
    .single();
    
  // Éviter les mutations redondantes
  if (currentItem?.parent_id === projectId) {
    return true;
  }
  
  // ... reste de la logique ...
}, [updateItem]);
```

### 5. Améliorer le filtrage des tâches dans useTimelineScheduling

**Fichier** : `src/hooks/useTimelineScheduling.ts`

Le filtre actuel :
```typescript
const unscheduledTasks = useMemo(() => {
  const scheduledTaskIds = new Set(
    events.filter(e => e.entityType === 'task').map(e => e.entityId)
  );
  
  return tasks.filter(t => 
    !t.isCompleted && 
    !scheduledTaskIds.has(t.id) &&
    t.level === 0
  );
}, [tasks, events]);
```

Amélioration pour inclure les project_tasks :
```typescript
const unscheduledTasks = useMemo(() => {
  const scheduledTaskIds = new Set(
    events.filter(e => e.entityType === 'task').map(e => e.entityId)
  );
  
  return tasks.filter(t => 
    !t.isCompleted && 
    !scheduledTaskIds.has(t.id) &&
    t.level === 0 // Tâches principales uniquement
    // Retirer le filtre sur projectId pour inclure les tâches de projet
  );
}, [tasks, events]);
```

---

## Fichiers à modifier

| Fichier | Modification |
|---------|-------------|
| `src/utils/itemConverters.ts` | Unifier la logique de conversion avec support `project_task` |
| `src/hooks/useTasks.ts` | Supprimer le convertisseur dupliqué, utiliser l'import centralisé |
| `src/hooks/useTimelineScheduling.ts` | Ajouter `cleanupOverdueEvents` + appel automatique |
| `src/hooks/useProjects.ts` | Ajouter validation DB avant assignation |

---

## Étapes d'implémentation

1. **Corriger itemConverters.ts** - Source unique de vérité pour la conversion
2. **Mettre à jour useTasks.ts** - Utiliser le convertisseur centralisé
3. **Ajouter le nettoyage automatique** - Dans useTimelineScheduling
4. **Sécuriser les assignations** - Validation DB dans useProjects
5. **Tests** - Vérifier que les tâches apparaissent correctement

---

## Résultat attendu

- Toutes les tâches non planifiées (personnelles ET projet) apparaissent dans le panneau Timeline
- Les tâches restent dans leur projet après assignation
- Les tâches dont la date est dépassée retournent automatiquement dans "À planifier"
- Plus de duplication ou de déplacement inattendu de tâches

