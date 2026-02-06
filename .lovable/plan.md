
# Boite a Outils 2.0 - Catalogue d'Applications de Productivite

## Vision

Transformer la vue Eisenhower actuelle en un veritable catalogue d'outils de productivite. Chaque outil est presente sous forme de carte compacte avec icone. L'utilisateur clique sur un outil pour l'ouvrir dans un modal plein ecran.

## Architecture Proposee

```text
src/components/views/toolbox/
  ├── index.ts                      # Exports
  ├── ToolboxView.tsx               # Vue catalogue principale
  ├── components/
  │   ├── ToolCatalog.tsx           # Grille des outils
  │   ├── ToolCard.tsx              # Carte d'un outil (icone + nom + description)
  │   └── ToolModal.tsx             # Modal plein ecran pour afficher un outil
  └── tools/
      ├── index.ts                  # Registry des outils
      ├── types.ts                  # Types communs aux outils
      ├── eisenhower/
      │   ├── EisenhowerTool.tsx    # Matrice migree
      │   └── useEisenhowerTool.ts  # Hook dedie
      └── rule135/
          ├── Rule135Tool.tsx       # Methode 1-3-5
          └── useRule135Tool.ts     # Hook dedie
```

## Composants Cles

### 1. Systeme de Registry d'Outils

Chaque outil est declare dans un registre central avec ses metadonnees :

```text
interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  category: 'prioritization' | 'time-management' | 'planning' | 'focus';
  component: ComponentType<ToolProps>;
  isNew?: boolean;
  isBeta?: boolean;
}
```

Cela permet d'ajouter facilement de nouveaux outils a l'avenir (Pomodoro, 2 minutes, etc.).

### 2. ToolCard - Carte Compacte

Style app store mobile :
- Icone coloree sur fond pastel (64x64px)
- Nom de l'outil en gras
- Description courte (1 ligne)
- Badge "Nouveau" ou "Beta" optionnel
- Effet hover avec elevation

```text
+------------------------+
|   [Icon]               |
|   Eisenhower          |
|   Prioriser par       |
|   importance/urgence   |
+------------------------+
```

### 3. ToolModal - Modal Plein Ecran

- Header fixe avec titre de l'outil + bouton fermer (X)
- Corps scrollable avec l'outil en question
- Animation d'ouverture fluide (scale + fade)
- Gestion du clavier (Echap pour fermer)

### 4. Outil 1 : Matrice Eisenhower (Migration)

Migration du code existant dans `EisenhowerView.tsx` vers `tools/eisenhower/EisenhowerTool.tsx` :
- Conservation de la logique des 4 quadrants
- Adaptation au contexte modal (pas de ViewLayout)
- Reutilisation du hook `useEisenhowerViewData`

### 5. Outil 2 : Methode 1-3-5 (Nouveau)

Interface permettant de planifier sa journee avec :
- 1 tache prioritaire "Big" (la plus importante)
- 3 taches moyennes "Medium"
- 5 petites taches "Small"

Fonctionnalites :
- Selection de taches existantes ou creation rapide
- Indicateur de temps total estime
- Validation visuelle quand une tache est completee
- Sauvegarde de la planification quotidienne

```text
+------------------------------------------+
| Ma journee 1-3-5                          |
+------------------------------------------+
| BIG (1 tache cruciale)                   |
|   [ ] Finaliser rapport client    2h     |
+------------------------------------------+
| MEDIUM (3 taches importantes)            |
|   [ ] Reunion equipe              1h     |
|   [ ] Review PR                   30min  |
|   [+] Ajouter une tache...               |
+------------------------------------------+
| SMALL (5 petites taches)                 |
|   [ ] Emails                      15min  |
|   [ ] Tri bureau                  10min  |
|   [+] Ajouter une tache...               |
+------------------------------------------+
| Total: 3h55  |  Progres: 0/9             |
+------------------------------------------+
```

## Hook de Donnees

### useToolboxViewData

Hook central qui fournit :
- Liste des outils disponibles
- Outil actuellement ouvert
- Actions : openTool, closeTool
- Statistiques d'utilisation (optionnel)

### useRule135Tool

Hook specifique pour la methode 1-3-5 :
- Taches selectionnees par categorie (big, medium, small)
- Actions : addTask, removeTask, toggleComplete
- Calcul du temps total
- Sauvegarde/chargement de la planification du jour

## Modifications du Routing

### viewRegistry.ts

```text
// Avant
eisenhower: {
  id: 'eisenhower',
  title: 'Matrice Eisenhower',
  ...
}

// Apres
toolbox: {
  id: 'toolbox',
  title: 'Boite a outils',
  subtitle: 'Methodes de productivite',
  icon: Wrench,
  component: ToolboxView,
  order: 7,
  group: 'productivity',
  loadingVariant: 'grid',
}
```

### AppContext.tsx

```text
// Mettre a jour la navigation
{ key: 'toolbox', title: 'Boite a outils', icon: 'wrench' }
```

### ViewNavigation.tsx

```text
// Ajouter l'icone
toolbox: Wrench
```

## Fichiers a Creer

| Fichier | Description |
|---------|-------------|
| `src/components/views/toolbox/index.ts` | Exports |
| `src/components/views/toolbox/ToolboxView.tsx` | Vue principale |
| `src/components/views/toolbox/components/ToolCatalog.tsx` | Grille des outils |
| `src/components/views/toolbox/components/ToolCard.tsx` | Carte outil |
| `src/components/views/toolbox/components/ToolModal.tsx` | Modal plein ecran |
| `src/components/views/toolbox/tools/types.ts` | Types des outils |
| `src/components/views/toolbox/tools/index.ts` | Registry |
| `src/components/views/toolbox/tools/eisenhower/EisenhowerTool.tsx` | Matrice migree |
| `src/components/views/toolbox/tools/rule135/Rule135Tool.tsx` | Methode 1-3-5 |
| `src/components/views/toolbox/tools/rule135/useRule135Tool.ts` | Hook 1-3-5 |
| `src/hooks/view-data/useToolboxViewData.ts` | Hook donnees vue |

## Fichiers a Modifier

| Fichier | Modification |
|---------|--------------|
| `src/components/routing/viewRegistry.ts` | Remplacer eisenhower par toolbox |
| `src/contexts/AppContext.tsx` | Mettre a jour navigation |
| `src/components/layout/ViewNavigation.tsx` | Ajouter icone toolbox |
| `src/hooks/view-data/index.ts` | Exporter nouveaux hooks |
| `src/components/views/index.ts` | Exporter ToolboxView |

## Fichiers a Supprimer (apres migration)

| Fichier | Raison |
|---------|--------|
| `src/components/views/eisenhower/EisenhowerView.tsx` | Remplace par ToolboxView + EisenhowerTool |
| `src/components/views/eisenhower/index.ts` | Plus necessaire |

## Details Techniques

### Animation du Modal

Utilisation de Radix Dialog avec animations CSS :
- Entree : scale 0.95 -> 1, opacity 0 -> 1 (200ms)
- Sortie : inverse (150ms)
- Backdrop : blur + opacity

### Persistence 1-3-5

Les selections de taches pour la methode 1-3-5 seront stockees :
- En local (localStorage) pour le prototype
- Possibilite future de synchroniser avec time_events

### Responsive

- Desktop : grille 3-4 colonnes
- Tablet : grille 2 colonnes
- Mobile : grille 2 colonnes (cartes plus petites)

## Benefices

1. **Extensibilite** : Ajouter un nouvel outil = creer un composant + l'enregistrer
2. **Separation** : Chaque outil est autonome dans son dossier
3. **UX** : Modal plein ecran offre une experience immersive
4. **Performance** : Lazy loading des outils via le registry
5. **Coherence** : Toutes les methodes de productivite au meme endroit
