

# Fix: Pauses de recuperation reactives et coherentes

## Probleme identifie

`recalculateBreaks()` utilise `getBlockEvents()` qui lit l'etat React `events` — mais cet etat est **perime** au moment de l'appel car `loadEvents()` n'a pas encore ete execute. Les pauses sont donc calculees sur les anciennes donnees et n'apparaissent qu'a l'action suivante.

Meme probleme a la suppression : les pauses restent car le recalcul se fait sur des donnees obsoletes.

## Solution

Modifier `recalculateBreaks()` pour **lire directement depuis la base de donnees** au lieu de l'etat React. Cela garantit que le calcul utilise toujours les donnees les plus fraiches, y compris la tache qui vient juste d'etre ajoutee ou supprimee.

## Changements techniques

### Fichier : `src/hooks/useTimelineScheduling.ts`

**Modifier `recalculateBreaks`** :
- Remplacer l'appel a `getBlockEvents(date, block)` par une requete directe `supabase.from('time_events').select(...)` filtree sur la date, le user_id, et optionnellement le block
- Convertir les rows DB en objets `TimeEvent` pour les passer a `computeBlockBreaks()`
- Cela supprime la dependance a l'etat React perime

Sequence corrigee dans `scheduleTask` / `scheduleTaskToBlock` :
1. Creer l'evenement tache (syncTaskEventWithSchedule) 
2. Appeler `recalculateBreaks(date, block)` — lit la DB directement, voit la nouvelle tache
3. Appeler `loadEvents()` — met a jour l'etat React avec taches + pauses

Pour `unscheduleEvent` :
1. Supprimer l'evenement tache
2. Appeler `recalculateBreaks(date, block)` — lit la DB, la tache n'y est plus, donc pas de pause orpheline
3. Appeler `loadEvents()`

### Detail de la requete DB dans recalculateBreaks

```text
1. DELETE recovery events pour cette date/block (deja fait)
2. SELECT * FROM time_events 
   WHERE user_id = X 
   AND entity_type = 'task' 
   AND status != 'cancelled'
   AND starts_at entre debut et fin du jour
   AND (time_block = block si specifie)
3. Convertir en TimeEvent[]
4. computeBlockBreaks(freshEvents, taskInfos)
5. INSERT les nouvelles pauses
```

Cela remplace simplement la source de donnees (etat React perime -> requete DB fraiche) sans changer la logique de calcul.

### Fichier unique modifie

| Fichier | Modification |
|---|---|
| `src/hooks/useTimelineScheduling.ts` | `recalculateBreaks` lit la DB directement au lieu de `getBlockEvents` |

