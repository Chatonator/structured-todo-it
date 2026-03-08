

## Plan : Convertir les modales restantes en Sheet latéral

### Modales a convertir (4)

| Modale | Complexité | Notes |
|--------|-----------|-------|
| **HabitModal** | Élevée | 547 lignes, 3 onglets (Base/Fréquence/Avancé), conserve les Tabs |
| **DeckModal** | Simple | Formulaire court (nom, description, icône, checkbox) |
| **DeckManagement** | Moyenne | Liste de decks + actions edit/delete, ouvre DeckModal |
| **BugReportModal** | Moyenne | Type selector, sévérité, titre, description, screenshot upload |

### Modales qui restent en Dialog (justifié)
- **SettingsModal** : panneau large (max-w-5xl) avec sidebar de navigation -- pas un formulaire de création
- **ToolModal** : plein écran (95vw/95vh) pour lancer des outils -- pattern différent

### Pattern appliqué (identique à TaskModal/ProjectModal)

Pour chaque modale :
1. `Dialog` → `Sheet` + `SheetContent side="right"`
2. Structure : `SheetHeader` (sticky) → zone scrollable `flex-1 overflow-y-auto` → footer sticky `border-t`
3. Input nom : style borderless-bottom (`border-0 border-b rounded-none px-0`)
4. Classes container : `w-full sm:max-w-md p-0 flex flex-col gap-0 overflow-hidden`
5. Bouton principal avec icône `Check`

### Fichiers modifiés
- `src/components/habits/HabitModal.tsx`
- `src/components/habits/DeckModal.tsx`
- `src/components/habits/DeckManagement.tsx`
- `src/components/bugs/BugReportModal.tsx`

### Vérification bout en bout
Après conversion, vérifier que :
- Création + édition de tâches fonctionne (TaskModal existant)
- Création + édition de projets fonctionne (ProjectModal existant)
- Création + édition d'habitudes fonctionne (HabitModal converti)
- Création + édition de decks fonctionne (DeckModal converti)
- Gestion des decks fonctionne (DeckManagement converti)
- Signalement de bugs fonctionne (BugReportModal converti)

