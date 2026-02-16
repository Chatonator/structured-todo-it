
# Surcouche visuelle Eisenhower : deux switchs Important / Urgent

## Principe

On ne touche pas au coeur du systeme (categories Obligation/Quotidien/Envie/Autres). On remplace uniquement l'UI de selection par deux toggles qui, en coulisses, appellent le meme `onChange(category)` avec la categorie correspondante.

Le mapping est deja code dans `src/types/task.ts` :
- Important ON + Urgent ON = Obligation
- Important OFF + Urgent ON = Quotidien  
- Important ON + Urgent OFF = Envie
- Important OFF + Urgent OFF = Autres

## Fichiers modifies

### 1. Nouveau composant : `src/components/common/EisenhowerSelector.tsx`
- Deux switchs (composant Switch de Radix deja installe) : "Important" et "Urgent"
- Recoit `value: ItemCategory | ''` et `onChange: (value: ItemCategory) => void` -- meme interface que `CategorySelector`
- En interne, derive les booleens via `eisenhowerFromCategory(value)`, puis au toggle, recalcule la categorie via `categoryFromEisenhower(flags)` et appelle `onChange`
- Affiche un petit badge colore sous les switchs montrant le quadrant resultant (ex: "Cruciales" en rouge)
- Drop-in replacement : aucun changement necessaire dans les parents

### 2. Mise a jour : `src/components/common/CategorySelector.tsx`
- Remplacer le contenu par le nouveau `EisenhowerSelector` (ou simplement rediriger vers lui)
- Ainsi, `TaskDraftForm` et tout composant qui importe `CategorySelector` obtient automatiquement la nouvelle UI sans aucun changement

### 3. Mise a jour : `src/components/sidebar/SidebarQuickAdd.tsx`
- Remplacer le `<Select>` de categorie (lignes 142-172) par les deux switchs Important/Urgent
- Meme logique : on stocke toujours `category` en state, mais on le modifie via les toggles

### 4. Mise a jour : `src/components/common/index.ts`
- Ajouter l'export de `EisenhowerSelector`

## Ce qui ne change PAS
- Aucun hook modifie
- Aucun filtre modifie
- Aucune logique metier modifiee
- Les couleurs, badges, et tout le reste continuent de fonctionner sur les categories existantes
- La base de donnees n'est pas impactee (les colonnes `is_important`/`is_urgent` existent deja mais ne sont pas utilisees ici -- on passe toujours par `category`)

## Details techniques

Le composant `EisenhowerSelector` ressemblera a :

```text
+-----------------------------------------+
|  Important  [===OFF===]  [====ON====]   |
|  Urgent     [===OFF===]  [====ON====]   |
+-----------------------------------------+
|  -> Badge colore : "Cruciales"          |
+-----------------------------------------+
```

Chaque switch utilise le composant `Switch` de `@radix-ui/react-switch` deja present dans `src/components/ui/switch.tsx`. Le badge utilise `CategoryBadge` existant pour afficher le resultat.
