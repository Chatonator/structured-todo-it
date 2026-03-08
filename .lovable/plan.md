

## Refonte : Panel latéral pour création/édition de tâches

### Concept
Remplacer la modale `Dialog` par un **Sheet (slide-over)** qui glisse depuis la droite. L'utilisateur garde le contexte de sa liste de tâches visible à gauche pendant qu'il crée ou modifie une tâche.

Design moderne avec :
- Champs organisés en sections progressives (essentiels visibles, options en accordéon)
- Visuels plus soignés (icônes colorées, badges, animations)
- Largeur fixe ~420px desktop, plein écran mobile

```text
┌──────────────────────┬─────────────────┐
│                      │  ✕  Nouvelle    │
│  Liste des tâches    │     tâche       │
│  (reste visible)     │                 │
│                      │  [Titre...    ] │
│                      │                 │
│                      │  🏠 Perso  💼 Pro│
│                      │                 │
│                      │  ⭐ Important    │
│                      │  ⚡ Urgent       │
│                      │                 │
│                      │  ⏱ 30min  ▾    │
│                      │                 │
│                      │  ▸ Planification│
│                      │  ▸ Récurrence   │
│                      │                 │
│                      │  [  Créer  ]    │
└──────────────────────┴─────────────────┘
```

### Fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `TaskModal.tsx` | Remplacer `Dialog` par `Sheet` (slide-over droite). Reorganiser le layout : titre auto-focus, champs essentiels (nom, contexte, catégorie, temps) toujours visibles, planification et récurrence en `Collapsible`. Design soigné avec séparateurs, icônes, espacement aéré. Supprimer le mode multi-drafts (grille) — on garde un seul formulaire fluide dans le panel |
| `TaskDraftForm.tsx` | Refonte visuelle : sections avec icônes et labels inline, boutons contexte/catégorie en pills colorées, time estimate en chips cliquables au lieu d'un select, espacement généreux. Ajouter un mode `compact` pour le panel |
| `sheet.tsx` | Élargir la variante `right` à `sm:max-w-md` (448px) pour le panel tâche |
| `Index.tsx` | Aucun changement structurel — `TaskModal` utilise déjà `isOpen/onClose`, le Sheet s'y substitue directement |

### Design détaillé du panel

**En-tête** : Titre dynamique ("Nouvelle tâche" / "Modifier X") + bouton fermer intégré au Sheet

**Section 1 — Essentiel** (toujours visible)
- Input titre : plus grand (`text-base`), placeholder engageant, auto-focus
- Contexte : 2 pills côte à côte (Pro/Perso) avec couleurs vives, sélection visuelle forte
- Catégorie Eisenhower : les 2 toggles Important/Urgent (déjà bien designés)
- Temps estimé : chips horizontaux cliquables (15m, 30m, 1h, 2h, 3h, 4h) au lieu d'un dropdown

**Section 2 — Options** (en Collapsible, fermé par défaut)
- Planification (date + heure)
- Récurrence
- Priorité (pour projets)
- Assignation (pour équipes)

**Footer sticky** : Bouton créer/modifier pleine largeur

### Mode édition
Même panel, pré-rempli avec les données de la tâche existante. Le titre change en "Modifier [nom]".

### Mode sous-tâches
Le panel affiche le badge "Contexte hérité" et masque les sections héritées (comme actuellement).

### Mode multi-création
Le bouton "Ajouter une autre tâche" reste disponible sous le bouton créer. Quand on clique, le formulaire se réinitialise après création et le panel reste ouvert (au lieu de se fermer). Un compteur "3 tâches créées" s'affiche en feedback.

