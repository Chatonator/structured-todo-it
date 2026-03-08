

## Compilation de changelogs pour publications

### Concept

Ajouter dans l'historique du changelog la possibilité de sélectionner plusieurs entrées via des checkboxes, puis les regrouper dans un bloc formaté prêt à copier-coller. Le bloc sera généré en Markdown avec groupement par type (Features / Fixes / Améliorations) et la plage de versions.

### Modifications — `ChangelogAdmin` dans `BugReportsAdmin.tsx`

1. **Checkboxes de sélection** sur chaque entrée de l'historique + bouton "Tout sélectionner / Désélectionner"

2. **Barre d'actions flottante** quand des entrées sont sélectionnées :
   - Compteur "X sélectionné(s)"
   - Bouton "Générer le rapport"

3. **Bloc de compilation** (affiché au clic) :
   - Titre auto-généré : `Mise à jour v{min} → v{max} — {date}`
   - Contenu groupé par type avec emojis :
     ```
     ## ✨ Nouveautés
     - Titre 1 (v1.2.0)
     - Titre 2 (v1.3.0)
     
     ## 🔧 Corrections
     - Fix 1 (v1.2.1)
     
     ## ⚡ Améliorations
     - Amélioration 1 (v1.3.0)
     ```
   - Zone de texte éditable (pour ajuster avant copie)
   - Bouton **"Copier"** (`navigator.clipboard`) avec feedback toast
   - Bouton **"Fermer"**

4. **Bonus QOL** :
   - Filtre par type dans l'historique (Feature / Fix / Amélioration / Tous)
   - Filtre par plage de dates (mois courant / 3 derniers mois / tout)

### Fichier modifié

| Fichier | Changement |
|---------|-----------|
| `src/components/bugs/BugReportsAdmin.tsx` | Ajout sélection multiple + génération de rapport dans `ChangelogAdmin` |

Aucune migration DB nécessaire — tout est côté client.

