
## Plan : Amélioration du système de signalement utilisateur

### Analyse de l'état actuel

**Côté utilisateur (BugReportModal) :**
- Pas de champ "type" de signalement → on ne peut pas distinguer bug / amélioration
- Formulaire minimaliste, pas d'indication de priorité ou de sévérité
- Pas de vue "mes réclamations en cours" pour le suivi

**Côté DB :**
- La table `bug_reports` n'a pas de colonne `type` (bug | feature_request) ni `severity`
- Les statuts existants : open, in_progress, resolved, closed

---

### Ce qu'on va faire

**1. Migration SQL**
- Ajouter colonne `type text NOT NULL DEFAULT 'bug'` → valeurs : `'bug'` | `'feature_request'`
- Ajouter colonne `severity text NOT NULL DEFAULT 'medium'` → valeurs : `'low'` | `'medium'` | `'high'` | `'critical'` (uniquement pour bugs)
- Ajouter policy SELECT pour que les utilisateurs puissent lire leurs propres réclamations (déjà en place via "Users can view their own bug reports" ✓)

**2. `BugReportModal.tsx` — refonte visuelle et structurelle**
- Sélecteur de type en haut : **Bug** 🐛 ou **Amélioration** 💡 (deux cartes cliquables, plus visuel qu'un select)
- Si type = bug : afficher un sélecteur de sévérité (Faible / Moyen / Élevé / Critique) avec couleurs
- Titre et description améliorés avec compteur de caractères
- Zone screenshot plus lisible avec drag-and-drop visuel
- Meilleure mise en page générale (plus aéré, icônes)

**3. Nouveau composant `MyReportsPanel.tsx`**
- Modal ou panel affichant les signalements de l'utilisateur connecté
- Filtres par type (Bugs / Améliorations / Tous) et statut
- Chaque item : titre, type badge, statut coloré, date, et note admin si présente
- Accessible via un bouton dans le menu profil "Mes réclamations"

**4. `useBugReports.ts`**
- Mettre à jour `BugReport` interface avec `type` et `severity`
- Mettre à jour `submitBugReport` pour accepter `type` et `severity`
- Ajouter hook `useMyReports()` : query sur `bug_reports` filtrée sur `auth.uid()` (déjà permis par RLS existante)

**5. `BugReportsAdmin.tsx`**
- Ajouter filtre par type (Bugs / Améliorations)
- Afficher le badge de type et sévérité dans chaque card
- Ajouter filtre combiné type + statut

**6. `UserProfileBlock.tsx`**
- Ajouter entrée "Mes réclamations" (visible pour tous les utilisateurs authentifiés) qui ouvre `MyReportsPanel`

---

### Wireframe modal amélioré

```text
┌─────────────────────────────────────────┐
│  Signaler un problème                   │
│─────────────────────────────────────────│
│  Type de signalement                    │
│  ┌──────────────┐  ┌──────────────────┐ │
│  │ 🐛 Bug        │  │ 💡 Amélioration  │ │
│  │ Quelque chose │  │ Une idée ou      │ │
│  │ ne fonctionne │  │ suggestion       │ │
│  └──────────────┘  └──────────────────┘ │
│                                         │
│  [Si bug] Sévérité                      │
│  ○ Faible  ○ Moyen  ● Élevé  ○ Critique │
│                                         │
│  Titre *                    [0/200]     │
│  ┌─────────────────────────────────────┐│
│  │ Résumé court...                     ││
│  └─────────────────────────────────────┘│
│                                         │
│  Description *              [0/2000]    │
│  ┌─────────────────────────────────────┐│
│  │ Décrivez...                         ││
│  └─────────────────────────────────────┘│
│                                         │
│  Capture (optionnel)                    │
│  ┌─ - - - - - - - - - - - - - - - - -┐ │
│  │   📎 Glisser ou cliquer            │ │
│  └─ - - - - - - - - - - - - - - - - -┘ │
│                                         │
│              [Annuler]  [Envoyer →]     │
└─────────────────────────────────────────┘
```

### Fichiers touchés

| Fichier | Action |
|---|---|
| Migration SQL | Ajout colonnes `type` + `severity` |
| `src/hooks/useBugReports.ts` | Mise à jour interface + hooks |
| `src/components/bugs/BugReportModal.tsx` | Refonte complète |
| `src/components/bugs/MyReportsPanel.tsx` | Nouveau composant |
| `src/components/bugs/BugReportsAdmin.tsx` | Filtres type + sévérité |
| `src/components/layout/UserProfileBlock.tsx` | Lien "Mes réclamations" |
