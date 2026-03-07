

## Diagnostic

Les tâches planifiées depuis la modale n'apparaissent pas dans la Timeline car **l'information de planification (`_scheduleInfo`) est ignorée lors de la création**.

Le flux actuel :
```text
TaskModal (attache _scheduleInfo)
    → handleAddTask (Index.tsx)
        → viewData.addTask
            → useTasks.addTask
                → createItem (stocke seulement les métadonnées item)
                    ❌ _scheduleInfo n'est jamais lu
                    ❌ syncTaskEventWithSchedule n'est jamais appelé
```

Résultat : aucun `time_event` n'est créé en base, donc la Timeline ne voit rien.

## Plan

### 1. `src/hooks/useTasks.ts` — Appeler `syncTaskEventWithSchedule` apres la creation

Dans `addTask`, apres l'appel a `createItem` :
- Extraire `_scheduleInfo` du `taskData`
- Si `_scheduleInfo` contient une date + heure, appeler `syncTaskEventWithSchedule` avec la tache nouvellement creee et les infos de planification
- Necessaire : recuperer l'ID de la tache creee (via le retour de `createItem` ou en cherchant la tache juste creee)

### 2. `src/hooks/useTasks.ts` — Meme chose pour `updateTask`

Quand `onUpdateTask` est appele depuis la modale d'edition, extraire `_scheduleInfo` des updates et appeler `syncTaskEventWithSchedule`.

### 3. Verification du retour de `createItem`

Verifier si `createItem` dans `useItems.ts` retourne l'item cree (avec son ID). Si non, adapter pour pouvoir recuperer l'ID necessaire a la synchronisation du time_event.

### Details techniques

Dans `useTasks.ts`, le `addTask` deviendrait :

```typescript
const addTask = useCallback(async (taskData) => {
  // ... existing guards ...
  
  const scheduleInfo = (taskData as any)._scheduleInfo;
  
  const newItem = await createItem({ ... });
  
  // Sync time_event si planification
  if (newItem && scheduleInfo?.date && scheduleInfo?.time) {
    const newTask = { ...taskData, id: newItem.id } as Task;
    await syncTaskEventWithSchedule(newTask, scheduleInfo);
  }
}, [createItem, syncTaskEventWithSchedule, ...]);
```

Meme pattern pour `updateTask` : extraire `_scheduleInfo` des updates avant de les passer a `updateItem`, puis appeler `syncTaskEventWithSchedule`.

