

# Correction creation projet + Amelioration modale projet

## Probleme de creation

Le `handleCreateProject` dans `useProjectsFullViewData.ts` (ligne 46) appelle `createProject(data.name, data.description, data.icon, data.color)` — il ne transmet que 4 arguments. Mais la modale envoie un objet avec plus de champs. Le probleme probable est que `onSave` dans `ProjectModal` appelle aussi `onClose()` (ligne 79) immediatement apres `onSave()`, et le `handleCreateProject` ferme aussi le modal. Double fermeture + possible race condition. A verifier en debug, mais le fix principal est de s'assurer que le flux de donnees est correct.

De plus, `projectToItemMetadata` dans `useProjects.ts` hardcode `context: 'Perso'` et `category: 'Projet'` — les nouveaux champs contexte/importance devront etre passes.

---

## Modifications prevues

### 1. `src/components/projects/ProjectModal.tsx` — Refonte de la modale

**Couleur libre** :
- Remplacer le `Select` de couleurs predefinies par un `<input type="color">` natif avec preview du cercle colore.

**Contexte Pro/Perso** :
- Ajouter un selecteur Pro/Perso identique aux taches (deux boutons toggle avec emojis).

**Boutons Important/Urgent** :
- Ajouter les memes boutons toggle que dans `SidebarQuickAdd` (etoile Important + eclair Urgent).
- Stocker en interne `isImportant` et `isUrgent` (booleans).

**Date cible** :
- Garder le champ existant, inchange.

**Enrichir le type `onSave`** :
- Ajouter `context?: TaskContext`, `isImportant?: boolean`, `isUrgent?: boolean` au type de retour du `onSave`.

### 2. `src/hooks/useProjects.ts` — Passer contexte et Eisenhower

- Modifier `createProject` pour accepter `context`, `isImportant`, `isUrgent` en parametres optionnels.
- Dans `projectToItemMetadata`, utiliser le contexte et les flags passes au lieu des valeurs hardcodees.
- Modifier `updateProject` pour supporter ces nouveaux champs.

### 3. `src/hooks/useUnifiedProjects.ts` — Propager les nouveaux params

- Etendre la signature de `createProject` pour inclure `context`, `isImportant`, `isUrgent`.

### 4. `src/hooks/view-data/useProjectsFullViewData.ts` — Passer les nouvelles donnees

- Modifier `handleCreateProject` pour transmettre `context`, `isImportant`, `isUrgent` depuis les donnees du formulaire.

### 5. `src/types/project.ts` — Nettoyer

- Supprimer `PROJECT_COLORS` (plus necessaire avec le color picker libre).
- Ajouter `context?: TaskContext` et `isImportant/isUrgent` optionnels au type `Project`.

### 6. Date cible dans la Timeline

- Dans `useTimelineViewData.ts` ou le hook de time events, detecter les projets avec `targetDate` definie et les injecter comme evenements de type deadline dans la timeline a la date concernee. Creer un `TimeEvent` de type `reminder` avec le nom du projet et la date cible.

---

## Details techniques

### Color picker
```
<div className="flex items-center gap-2">
  <input type="color" value={color} onChange={e => setColor(e.target.value)} />
  <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: color }} />
</div>
```

### Boutons Important/Urgent (meme pattern que SidebarQuickAdd)
Deux boutons toggle avec classes conditionnelles `bg-category-envie/15` pour Important et `bg-category-quotidien/15` pour Urgent.

### Timeline — injection des deadlines projet
Recuperer tous les projets actifs avec `targetDate`, les convertir en occurrences affichees comme marqueurs visuels (badge "Deadline") sur le jour concerne.

