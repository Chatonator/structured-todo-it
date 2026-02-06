
## Diagnostic (piste alternative / contournement)
Le comportement “je clique sur *Nouveau projet* / *Créer un projet* et absolument rien ne se passe” quand la liste de projets est vide ne vient probablement pas du backend ni de Supabase.

La cause est dans l’UI :

- Dans `src/components/projects/ProjectsView.tsx`, on utilise `ViewLayout` avec :
  ```ts
  state={loading ? 'loading' : projects.length === 0 ? 'empty' : 'success'}
  ```
- Or `ViewLayout` (voir `src/components/layout/view/ViewLayout.tsx`) fait ceci en état `empty` :
  - il **n’affiche pas `children`**
  - il remplace le contenu par `<ViewEmptyState ... />`

Conséquence :
- `ProjectModal` est rendu **dans `children`** de `ViewLayout`.
- Donc **quand `projects.length === 0`**, `ProjectModal` n’est pas monté dans le DOM.
- Tu peux bien faire `setShowModal(true)` via les boutons, mais il n’y a **aucune modale à afficher**, donc “rien ne se passe”.

C’est exactement le même pattern qui a déjà été corrigé dans `HabitsView` (ils ont un commentaire “Modals must be OUTSIDE ViewLayout…” et mettent `DeckManagement` en dehors du `ViewLayout`).

## Objectif
Permettre l’ouverture de la modale “Créer un projet” même quand la vue est en état vide.

---

## Changements proposés (solution simple et robuste)
### 1) Déplacer `ProjectModal` en dehors de `ViewLayout` (comme HabitsView)
**Fichier :** `src/components/projects/ProjectsView.tsx`

- Envelopper le rendu dans un fragment `<>...</>`
- Garder `ViewLayout` pour afficher l’empty state
- Rendre `<ProjectModal ... />` **après** `</ViewLayout>` (donc toujours monté, même quand `state="empty"`)

Résultat attendu :
- Bouton du header “Nouveau projet” fonctionne en vue vide
- Bouton “Créer un projet” de l’empty state fonctionne aussi
- Le flux en mode non-vide ne change pas

### 2) (Optionnel mais recommandé) Corriger `onOpenChange` dans `ProjectModal`
**Fichier :** `src/components/projects/ProjectModal.tsx`

Aujourd’hui :
```tsx
<Dialog open={open} onOpenChange={onClose}>
```

Radix appelle `onOpenChange(boolean)` ; passer directement `onClose` marche souvent “par chance”, mais ce n’est pas la signature attendue.
On sécurise :
```tsx
<Dialog
  open={open}
  onOpenChange={(nextOpen) => {
    if (!nextOpen) onClose();
  }}
>
```

But : éviter tout comportement bizarre (fermeture inattendue, double-trigger, etc.).

---

## Plan de test (end-to-end)
1. Supprimer tous les projets (tu l’as déjà fait).
2. Aller dans **Projets**.
3. Cliquer sur **Nouveau projet** (bouton en haut à droite) :
   - La modale doit s’ouvrir.
4. Cliquer sur **Créer un projet** (bouton de l’empty state) :
   - La modale doit s’ouvrir.
5. Remplir un nom + valider :
   - Un projet doit apparaître immédiatement dans la grille/onglet “Actifs”.
6. Re-tester la création quand il y a déjà au moins 1 projet (vérifier que rien n’a régressé).

---

## Bonus (si tu veux un vrai “contournement” en plus)
Si tu veux une solution “impossible à casser” même si une modale re-bug :
- Ajouter dans l’empty state un mini formulaire inline (champ “Nom du projet” + bouton “Créer”) qui appelle directement `createProject(...)`.
Mais je ne le ferai que si la modale continue à poser problème après le fix ci-dessus, car le déplacement de la modale est le correctif racine le plus propre.

---

## Fichiers impactés
- `src/components/projects/ProjectsView.tsx` (obligatoire)
- `src/components/projects/ProjectModal.tsx` (optionnel mais recommandé)
