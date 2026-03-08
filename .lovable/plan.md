

## Plan : Harmoniser la modale Projet et vérifier l'édition des tâches

### Constat
La modale de création de tâches utilise un **Sheet** latéral avec des composants partagés (EisenhowerSelector, DurationPicker, context pills avec couleurs sémantiques, Calendar avec restriction de dates). La **ProjectModal** utilise un Dialog classique avec des implémentations inline dupliquées (boutons contexte, toggles important/urgent, input date HTML brut).

### Changements

#### 1. `ProjectModal.tsx` — Harmonisation complète
- **Dialog → Sheet** latéral (même pattern que TaskModal)
- **Contexte** : remplacer les boutons inline par le même pattern que TaskDraftForm (pills avec couleurs `context-pro` / `context-perso`)
- **Eisenhower** : remplacer les toggles inline par le composant partagé `<EisenhowerSelector />`
- **Date cible** : remplacer `<Input type="date">` par le même **Calendar popover** avec `disabled={(date) => date < startOfDay(new Date())}` (cohérence + blocage dates passées)
- **Icônes** : convertir le Select en grille de boutons cliquables (même pattern que HabitModal)
- **Input nom** : style borderless-bottom comme TaskDraftForm
- **Footer** : sticky footer identique à TaskModal

#### 2. Vérification édition de tâches
L'édition (`editingTask`) dans TaskModal charge bien les données de planification via `getEntityEvent` et pré-remplit `scheduledDate`/`scheduledTime` dans le draft. Le slider et le calendrier reçoivent ces valeurs. Pas de bug identifié — le flux fonctionne.

### Fichier modifié
- `src/components/projects/ProjectModal.tsx`

### Ce qui ne change pas
- HabitModal et DeckModal : entités différentes avec des besoins spécifiques (fréquence, challenges), pas de harmonisation nécessaire pour l'instant
- TaskModal / TaskDraftForm : déjà le modèle de référence

