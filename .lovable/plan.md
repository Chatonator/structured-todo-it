

## Héritage automatique du contexte parent pour les sous-tâches

### Problème
Quand on crée une sous-tâche, le sélecteur de contexte (Pro/Perso) est toujours affiché et modifiable. Une tâche Perso ne devrait pas pouvoir avoir de sous-tâche Pro.

### Solution

**1. `TaskDraftForm.tsx`** — Masquer le contexte, la planification et la récurrence pour les sous-tâches
- Si `parentTask` existe : ne PAS afficher le `ContextSelector` (le contexte est hérité, déjà fait dans `createEmptyDraft`)
- Si `parentTask` existe : ne PAS afficher `SchedulingSection` ni `RecurrenceSection` (héritées du parent)
- Afficher un badge informatif "Contexte hérité : Perso" en lecture seule

**2. `TaskModal.tsx`** — Renforcer l'héritage dans `createEmptyDraft` et `handleFinish`
- `createEmptyDraft` : déjà OK pour `context` et `category` (lignes 49-51)
- `handleFinish` (ligne 174) : forcer `context: parentTask.context` au lieu de laisser le draft potentiellement modifié
- Hériter aussi `scheduledDate`, `scheduledTime`, `isRecurring`, `recurrenceInterval` du parent quand disponible

### Fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `TaskDraftForm.tsx` | Masquer ContextSelector, SchedulingSection, RecurrenceSection quand `parentTask` existe. Afficher un badge lecture seule pour le contexte hérité |
| `TaskModal.tsx` | Forcer `context = parentTask.context` dans `handleFinish` pour les sous-tâches |

