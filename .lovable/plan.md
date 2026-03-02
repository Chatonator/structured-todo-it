
## Plan : Sécurisation de la vue Admin Bug Reports

### Problème actuel
- La route `/admin/bugs` est accessible à n'importe quel utilisateur authentifié (DEV_BYPASS_AUTH = true rend même ça inutile)
- La RLS `bug_reports` n'autorise le SELECT que sur ses propres rapports → l'admin ne voit rien des autres utilisateurs
- Pas de vérification d'identité côté client ni côté DB

### Ce qu'on va faire

**1. RLS Supabase — migration SQL**
- Ajouter une politique SELECT admin sur `bug_reports` : autoriser la lecture de tous les rapports si `auth.uid() = '5bc43bb8-0880-4631-bc01-174543461bb8'`
- Ajouter une politique UPDATE admin sur `bug_reports` : autoriser la mise à jour de tous les rapports (notes, status) si admin
- Hardcoder l'UUID admin directement dans les politiques RLS (côté DB, inviolable)

**2. Hook `useAdminCheck`** (nouveau, simple)
- Vérifie côté client que `user.id === ADMIN_USER_ID` 
- Utilisé uniquement pour l'affichage UI (redirection), la vraie sécurité est en RLS

**3. Route `/admin/bugs` dans `App.tsx`**
- Créer un `AdminRoute` qui :
  1. Désactive `DEV_BYPASS_AUTH` pour cette route spécifique
  2. Vérifie l'auth ET que `user.id === ADMIN_USER_ID`
  3. Redirige vers `/` si non-admin

**4. `BugReportsAdmin.tsx`**
- Supprimer la dépendance au contexte DEV, route déjà protégée
- Aucun autre changement UI nécessaire

### Architecture de sécurité

```text
Requête vers /admin/bugs
        │
        ▼
AdminRoute (client)
  ├─ Non authentifié → redirect /auth
  ├─ user.id ≠ ADMIN_ID → redirect /
  └─ OK → affiche BugReportsAdmin
               │
               ▼
        useBugReportsList()
               │
               ▼
        Supabase RLS
  ├─ user = admin → SELECT * bug_reports ✓
  └─ user ≠ admin → SELECT uniquement ses propres ✗
```

### Fichiers touchés

| Fichier | Action |
|---|---|
| Migration SQL | Ajouter politiques RLS admin SELECT + UPDATE sur `bug_reports` |
| `src/App.tsx` | Créer `AdminRoute`, protéger `/admin/bugs` |
| `src/hooks/useBugReports.ts` | Aucun changement nécessaire (RLS fait le travail) |

### Constante admin
L'UUID admin `5bc43bb8-0880-4631-bc01-174543461bb8` sera stocké dans une constante dans `src/App.tsx` uniquement, jamais exposé dans un fichier accessible à l'utilisateur via le réseau.
