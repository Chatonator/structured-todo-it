

# Regrouper signalement et suivi des bugs dans un seul panneau

## Approche

Creer un panneau unifie `BugHub` qui combine les deux modales existantes (BugReportModal + MyReportsPanel) dans un seul Dialog avec des onglets (Tabs). Le dropdown utilisateur n'aura plus qu'un seul bouton "Signaler / Mes demandes" au lieu de deux.

## Modifications

### 1. `src/components/bugs/BugHub.tsx` — Nouveau composant unifie

Un Dialog unique avec deux onglets :
- **Signaler** : contenu actuel de `BugReportModal` (formulaire de signalement)
- **Mes demandes** : contenu actuel de `MyReportsPanel` (liste filtrable avec compteur de demandes en cours)

Le composant reutilise directement le code existant des deux modales, reorganise en onglets via `Tabs` de Radix.

### 2. `src/components/layout/UserProfileBlock.tsx` — Simplifier le menu

- Supprimer les deux `DropdownMenuItem` separees ("Signaler / Suggérer" et "Mes réclamations")
- Les remplacer par un seul item "Signaler / Mes demandes" avec icone `MessageSquarePlus`
- Remplacer les deux etats `isBugReportOpen` + `isMyReportsOpen` par un seul `isBugHubOpen`
- Importer `BugHub` au lieu des deux composants separees

Le menu admin `/admin/bugs` reste intact et inchange.

### 3. Fichiers existants conserves

`BugReportModal.tsx` et `MyReportsPanel.tsx` restent en place (potentiellement utilises ailleurs ou par admin). Le nouveau `BugHub` compose a partir de leur logique interne.

