

# Paramètres de filtres : masquer Pro + configurer "Toutes"

## Fonctionnalités

1. **Mode "Perso only"** : Un toggle qui masque complètement le pill "Pro" des filtres contextuels. Si le filtre actif est "Pro" au moment de l'activation, on bascule sur "all". Activé = Pro visible (défaut).
2. **Filtre "Toutes" : inclure les équipes** : Un toggle + sélecteur d'équipes pour contrôler si le filtre "Toutes" inclut aussi les tâches d'équipe, et lesquelles. Par défaut : tout inclus.

## Changements

### `src/types/preferences.ts`
Ajouter dans `UserPreferences` :
- `showProContext: boolean` (défaut `true`) — affiche/masque le pill Pro
- `allFilterIncludeTeams: boolean` (défaut `true`) — "Toutes" inclut les équipes
- `allFilterTeamIds: string[]` (défaut `[]` = toutes) — liste des équipes incluses (vide = toutes)

Mettre à jour `DEFAULT_PREFERENCES`.

### `src/components/settings/sections/InterfaceSettings.tsx`
Nouvelle section "Filtres contextuels" avec :
- Toggle "Afficher le contexte Pro" (description : "Désactivez si vous utilisez l'app uniquement pour le perso")
- Toggle "Inclure les équipes dans 'Toutes'" 
- Si activé : liste des équipes avec checkboxes pour choisir lesquelles (nécessite `useTeamContext`)

### `src/components/layout/ContextPills.tsx`
- Lire `preferences.showProContext` : si `false`, filtrer le pill "Pro" hors du tableau `contexts`
- Lire `preferences.allFilterIncludeTeams` : potentiellement masquer le dropdown équipes quand on est sur "Toutes" si désactivé

### `src/components/layout/UnifiedContextSelector.tsx`
- Même logique : masquer le bouton "Pro" si `showProContext === false`

| Etape | Fichier |
|-------|---------|
| 1 | `preferences.ts` : nouveaux champs |
| 2 | `InterfaceSettings.tsx` : nouvelle section filtres |
| 3 | `ContextPills.tsx` : conditionner Pro + équipes |
| 4 | `UnifiedContextSelector.tsx` : conditionner Pro |

