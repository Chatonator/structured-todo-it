

# Outils inline + Sheet pour les détails

## Concept

Remplacer le système actuel basé sur une modale par :
1. **Sheet (panneau latéral)** pour les explications de l'outil (détails, origine, conseils)
2. **Rendu inline** de l'outil directement dans la vue ToolboxView quand on le lance

Cela permet d'interagir avec la sidebar et le reste de l'app pendant l'utilisation d'un outil.

## Architecture

```text
ToolboxView
├── Catalogue (grille de cartes)     ← affiché quand aucun outil actif
├── ActiveTool (composant inline)    ← affiché quand un outil est lancé
│   ├── Header avec bouton retour + nom de l'outil
│   └── <ToolComponent />
└── Sheet (panneau droit)            ← détails/explications de l'outil
```

## Changements

### `ToolboxView.tsx`
- Ajouter un state `activeToolId` pour l'outil en cours d'utilisation
- Quand `activeToolId` est set : afficher le composant de l'outil inline (avec un header et bouton retour au catalogue)
- Quand on clique sur une carte : ouvrir le Sheet avec les détails
- Le Sheet contient le bouton "Lancer" qui set `activeToolId` et ferme le Sheet

### `ToolModal.tsx` → Supprimer
- Plus nécessaire, remplacé par le Sheet + rendu inline

### Nouveau : utiliser `Sheet` de `@/components/ui/sheet`
- Contenu = `ToolDetailView` existant (réutilisé tel quel)
- Side = `right`, largeur confortable

### `ToolCatalog.tsx` / `ToolCard.tsx`
- `onSelectTool` → ouvre le Sheet (détails)
- `onQuickLaunch` → lance directement l'outil inline

## Fichiers impactés

| Fichier | Action |
|---|---|
| `src/components/views/toolbox/ToolboxView.tsx` | Refactorer : Sheet + rendu inline |
| `src/components/views/toolbox/components/ToolModal.tsx` | Supprimer le Dialog, exporter juste les helpers (`getLaunchedTools`, `markToolLaunched`) |

