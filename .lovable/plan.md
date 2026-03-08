

## Simplification : bouton sidebar ouvre le Sheet

Le bouton "Nouvelle tâche" dans la sidebar ne dépliera plus de formulaire inline. Il ouvrira directement le même Sheet (TaskModal) que le bouton du header, via `useApp().setIsModalOpen(true)`.

### Modifications

**`src/components/sidebar/SidebarQuickAdd.tsx`** — Remplacement complet :
- Supprimer tout le formulaire Collapsible (inputs, chips durée, selects)
- Garder uniquement un `Button` qui appelle `setIsModalOpen(true)` depuis `useApp()`
- Conserver le style actuel du bouton (primary, icône Plus, texte contextuel)
- Le prop `onAddTask` et `isCollapsed` deviennent inutiles — le composant n'a plus de props

**`src/components/sidebar/AppSidebar.tsx`** — Nettoyage :
- Retirer le passage de `onAddTask` et `isCollapsed` à `SidebarQuickAdd`
- Simplifier l'import (plus besoin de Collapsible, Select, etc. dans QuickAdd)

| Fichier | Action |
|---------|--------|
| `src/components/sidebar/SidebarQuickAdd.tsx` | Remplacer par un simple bouton ouvrant le Sheet |
| `src/components/sidebar/AppSidebar.tsx` | Retirer les props inutiles |

