

# Système d'invitation multi-canaux pour les équipes

## Résumé

3 modes d'invitation distincts, chacun avec un rôle d'arrivée différent :

| Canal | Rôle attribué | Auth requise | Configurable |
|---|---|---|---|
| **Email personnel** | `member` | Oui (inscription si pas de compte) | Non |
| **Lien générique** | `guest` | Non (lecture seule sans compte) | Non |
| **Code d'invitation** | `guest` par défaut (configurable → `member`) | Oui | Oui (admin) |

## Changements

### 1. Base de données (migration SQL)

Ajouter des colonnes à la table `teams` :
- `invite_link_enabled boolean DEFAULT true` — permet de désactiver le lien/code
- `code_join_role text DEFAULT 'guest'` — rôle attribué quand quelqu'un rejoint via code (`guest` ou `member`)

### 2. Edge Function `join-team` (mise à jour)

- Lire `invite_link_enabled` : si `false`, refuser l'accès via code
- Lire `code_join_role` : attribuer ce rôle au lieu de `'member'` en dur
- Reste : authentification requise (inchangé)

### 3. Edge Function `join-team-public` (nouveau)

Nouvelle Edge Function pour le lien générique :
- Prend un `inviteCode` dans l'URL (query param ou body)
- **Pas d'authentification requise** — retourne les données de l'équipe (nom, tâches, projets) en lecture seule
- Si l'utilisateur est authentifié, l'ajoute automatiquement comme `guest`
- Si `invite_link_enabled === false`, refuse

### 4. Edge Function `regenerate-invite-code` (nouveau)

- Accessible aux admins/owners
- Génère un nouveau code et met à jour la table `teams`

### 5. `src/hooks/useTeams.ts`

- Ajouter `invite_link_enabled` et `code_join_role` à l'interface `Team`
- Nouvelle fonction `regenerateInviteCode(teamId)` → appelle la nouvelle Edge Function
- Nouvelle fonction `updateTeamSettings(teamId, settings)` → update `invite_link_enabled`, `code_join_role` via Supabase direct (admin RLS)

### 6. `src/lib/teamPermissions.ts`

- Rien à changer structurellement

### 7. `src/components/views/teams/TeamTasksView.tsx`

Remplacer la carte "Code d'invitation" par une section plus riche **"Invitations & Accès"** (collapsible, visible si `can('manage_members')` ou `can('view_invite_code')`) :

**Sous-sections :**

1. **Invitation par email** (si `can('manage_members')`) : dialog existant, inchangé. Mention "rejoint en tant que Membre".

2. **Lien partageable** (si `can('view_invite_code')`) :
   - Bouton "Copier le lien" → génère `{origin}/#/join/{invite_code}`
   - Mention "Les visiteurs peuvent consulter sans compte"
   - Toggle "Autoriser les nouvelles inscriptions via lien/code" → `invite_link_enabled`

3. **Code d'invitation** (si `can('view_invite_code')`) :
   - Affichage du code + bouton copier
   - Bouton "Régénérer le code" (avec confirmation)
   - Sélecteur du rôle d'arrivée : Invité (défaut) / Membre
   - Mention "Nécessite un compte"

### 8. Route publique `/join/:code` (nouveau)

- Nouvelle page `src/pages/JoinTeam.tsx`
- Si non authentifié : affiche le nom de l'équipe + bouton "Se connecter / S'inscrire pour rejoindre" → redirige vers `/auth` avec un `?redirect=/join/{code}`
- Si authentifié : appelle `join-team` automatiquement et redirige vers la vue équipe
- Route ajoutée dans `App.tsx` (publique, pas de `ProtectedRoute`)

### 9. Page Auth — gestion du redirect

- Modifier `Auth.tsx` pour lire un `?redirect=` dans l'URL et rediriger après connexion/inscription vers cette URL au lieu de `/`

### 10. `supabase/config.toml`

Ajouter les nouvelles Edge Functions :
```toml
[functions.regenerate-invite-code]
verify_jwt = false

[functions.join-team-public]
verify_jwt = false
```

## Fichiers impactés

| Fichier | Action |
|---|---|
| Migration SQL | `invite_link_enabled`, `code_join_role` sur `teams` |
| `supabase/functions/join-team/index.ts` | Lire config, refuser si désactivé, rôle dynamique |
| `supabase/functions/regenerate-invite-code/index.ts` | Nouveau — régénère le code |
| `src/pages/JoinTeam.tsx` | Nouveau — page d'accueil pour liens d'invitation |
| `src/App.tsx` | Ajouter route `/join/:code` |
| `src/pages/Auth.tsx` | Support `?redirect=` |
| `src/hooks/useTeams.ts` | `regenerateInviteCode`, `updateTeamSettings`, interface `Team` |
| `src/components/views/teams/TeamTasksView.tsx` | Section "Invitations & Accès" refaite |
| `src/hooks/view-data/useTeamViewData.ts` | Exposer les nouvelles actions |
| `supabase/config.toml` | Nouvelles fonctions |

