

## Deux problemes identifies

### 1. Noms d'utilisateurs inconnus

Le `display_name` dans `profiles` est `null` quand l'utilisateur ne l'a pas renseigne a l'inscription, ou quand le profil n'est pas charge correctement. Le fallback actuel dans `TeamMembersList` est juste `'Membre'`, ce qui est generique.

**Cause racine** : Dans `Auth.tsx`, le `display_name` est passe via `raw_user_meta_data` lors du signup, puis le trigger `handle_new_user` l'insere dans `profiles`. Mais si l'utilisateur n'a pas renseigne de nom, ou si le profil existe sans `display_name`, tout le systeme affiche "Membre" ou "?".

**Corrections** :
- Dans `getDisplayName()` : fallback vers l'email de l'utilisateur (extraire la partie avant `@`) plutot que "Membre"
- Ajouter `email` au chargement des profils dans `useTeams.loadTeamMembers()` (via `auth.users` n'est pas possible, mais on peut stocker l'email dans `profiles`)
- Alternative plus simple : stocker l'email dans le champ `display_name` lors de la creation du profil si aucun nom n'est fourni (modifier le trigger `handle_new_user`)

**Solution retenue** : 
1. Modifier le trigger `handle_new_user` pour utiliser l'email comme fallback si `display_name` est vide
2. Ajouter une migration pour mettre a jour les profils existants sans `display_name`
3. Adapter `getDisplayName()` pour afficher le mail tronque si `display_name` est toujours absent

### 2. Invitation par email au lieu du code

Remplacer le systeme de code d'invitation par un systeme de demande d'adhesion par email :

**Nouveau flux** :
1. L'admin/owner saisit l'email d'un utilisateur a inviter
2. Une edge function `invite-to-team` :
   - Verifie que l'invitant est admin/owner
   - Cherche l'utilisateur par email dans `profiles` (necessite d'ajouter un champ `email` a `profiles`)
   - Cree une entree dans une nouvelle table `team_invitations` (status: pending)
   - Envoie une notification in-app a l'utilisateur invite
3. L'utilisateur invite voit la notification et peut accepter/refuser
4. S'il accepte, il est ajoute comme membre

**Fichiers et changements** :

| Element | Action |
|---------|--------|
| Migration SQL | Ajouter `email` a `profiles`, creer table `team_invitations`, mettre a jour trigger `handle_new_user` |
| `supabase/functions/invite-to-team/index.ts` | Nouvelle edge function : cherche user par email, cree invitation + notification |
| `supabase/functions/respond-to-invitation/index.ts` | Nouvelle edge function : accepter/refuser une invitation |
| `src/hooks/useTeams.ts` | Ajouter `inviteByEmail()`, `getInvitations()`, `respondToInvitation()` |
| `src/components/team/TeamMembersList.tsx` | Remplacer le champ "code d'invitation" par un champ email |
| `src/components/views/teams/TeamTasksView.tsx` | Adapter le bouton Inviter pour ouvrir un dialog email |
| `src/components/team/TeamManagement.tsx` | Adapter le dialog de join pour afficher les invitations recues |
| `src/components/notifications/NotificationPanel.tsx` | Ajouter un type de notification "invitation equipe" avec boutons Accepter/Refuser |
| `src/contexts/TeamContext.tsx` | Exposer les nouvelles fonctions d'invitation |

**Table `team_invitations`** :
```sql
CREATE TABLE team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL,
  invited_email text NOT NULL,
  invited_user_id uuid,
  status text NOT NULL DEFAULT 'pending', -- pending, accepted, declined
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);
```

**Note** : Le code d'invitation existant est conserve comme methode alternative (utile pour les liens publics), mais la methode par email devient la methode principale et recommandee dans l'UI.

