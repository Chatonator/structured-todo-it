

## Plan : Signalement de bugs — Table Supabase + Page Admin

### Architecture

```text
┌─────────────────┐       ┌──────────────┐       ┌─────────────────┐
│  BugReportModal  │──────▶│  bug_reports  │◀──────│  AdminBugView   │
│  (formulaire)    │ INSERT│  (Supabase)   │ SELECT│  (lecture/gestion)│
└─────────────────┘       └──────────────┘       └─────────────────┘
                              │
                          storage bucket
                          "bug-screenshots"
```

### 1. Base de données

**Table `bug_reports`** :
- `id` uuid PK
- `user_id` uuid (ref auth.users)
- `title` text NOT NULL
- `description` text NOT NULL
- `screenshot_url` text (nullable, URL du fichier dans le bucket)
- `page_url` text — collecté automatiquement
- `user_agent` text — collecté automatiquement (navigateur + OS)
- `status` text DEFAULT `'open'` — open / in_progress / resolved / closed
- `admin_notes` text (nullable) — pour tes commentaires
- `created_at` timestamptz DEFAULT now()
- `resolved_at` timestamptz (nullable)

**RLS** :
- INSERT : `auth.uid() = user_id` (chaque user peut signaler)
- SELECT : `auth.uid() = user_id` (voit ses propres bugs) — l'admin verra tout via une policy basée sur un rôle ou un user_id hardcodé
- UPDATE : admin uniquement (pour changer status/notes)

**Bucket storage `bug-screenshots`** : public en lecture, INSERT pour les users authentifiés.

### 2. Formulaire — `BugReportModal.tsx`

- Modale ouverte par le bouton Bug du header
- Champs :
  - **Titre** (input text, requis, max 200 chars)
  - **Description** (textarea, requis, max 2000 chars)
  - **Capture d'ecran** (input file, optionnel, image/* uniquement, max 5MB)
- **Contexte auto** (invisible pour l'utilisateur, collecté au submit) :
  - `window.location.href` pour la page
  - `navigator.userAgent` pour navigateur/OS
- Upload du screenshot dans `bug-screenshots/{user_id}/{timestamp}.png` puis insertion dans `bug_reports`
- Toast de confirmation apres envoi

### 3. Hook — `useBugReports.ts`

- `submitBugReport(title, description, file?)` — upload screenshot + insert
- `useBugReportsList()` — pour la vue admin, fetch tous les reports avec filtres status
- `updateBugStatus(id, status, notes?)` — pour l'admin

### 4. Vue Admin — `BugReportsAdmin.tsx`

- Accessible via une route protegee `/admin/bugs` (ou dans le Toolbox comme outil)
- Liste des bugs avec colonnes : date, titre, user, status, page
- Filtre par status (open/in_progress/resolved)
- Detail expandable avec description, screenshot (clic pour agrandir), user agent
- Actions : changer status, ajouter une note admin
- Protection : vérifier que le user connecté est l'admin (par user_id ou role)

### 5. Intégration Header

- Le bouton Bug existant dans `HeaderBar.tsx` ouvre `BugReportModal`
- Un state `isBugModalOpen` geré localement dans le header

### Fichiers créés/modifiés

| Fichier | Action |
|---|---|
| Migration SQL | Créer table `bug_reports` + bucket + RLS |
| `src/components/bugs/BugReportModal.tsx` | Nouveau — formulaire |
| `src/hooks/useBugReports.ts` | Nouveau — logique CRUD |
| `src/components/bugs/BugReportsAdmin.tsx` | Nouveau — vue admin |
| `src/components/layout/HeaderBar.tsx` | Modifier — brancher la modale |
| `src/App.tsx` | Modifier — ajouter route admin |

