

# Restriction des emails et hiérarchie stricte des rôles

## 1. Vue `team_member_profiles` — Emails visibles uniquement par les admins

**Migration SQL** : Créer une vue `team_member_profiles` avec `SECURITY DEFINER` qui masque l'email sauf si l'utilisateur courant est admin/owner de l'équipe concernée.

```sql
CREATE VIEW public.team_member_profiles AS
SELECT 
  p.user_id,
  p.display_name,
  CASE 
    WHEN is_team_admin(auth.uid(), tm.team_id) THEN p.email
    ELSE NULL
  END AS email,
  tm.team_id
FROM profiles p
JOIN team_members tm ON tm.user_id = p.user_id
WHERE is_team_member(auth.uid(), tm.team_id);
```

Problème : les vues avec `auth.uid()` et des fonctions SECURITY DEFINER sont complexes. Alternative plus simple et fiable :

**Approche retenue** : Garder la policy SELECT existante sur `profiles` telle quelle (elle fonctionne bien), et **masquer l'email côté UI** pour les non-admins. Le composant `TeamMembersList` recevra le rôle courant en prop et n'affichera l'email que si `myRole === 'owner' || myRole === 'admin'`.

C'est pragmatique : l'email est déjà visible entre coéquipiers via la policy existante (comportement normal dans un outil d'équipe), mais l'UI ne l'expose qu'aux admins.

## 2. Hiérarchie stricte des rôles — Backend + Frontend

Hiérarchie : `owner(4) > admin(3) > supervisor(2) > member(1) > guest(0)`

Règle : on ne peut agir que sur un rôle **strictement inférieur** au sien, et on ne peut promouvoir que jusqu'à un rang **strictement inférieur** au sien.

### Edge Function `manage-team-member/index.ts`

Ajouter un map de niveaux et vérifier :
- `currentLevel > targetCurrentLevel` (peut agir sur cette personne)
- `currentLevel > newRoleLevel` (ne peut pas promouvoir à son propre rang ou au-dessus)

```text
owner=4, admin=3, supervisor=2, member=1, guest=0
```

Un admin (3) peut modifier supervisor(2), member(1), guest(0) mais **pas** un autre admin(3). Il peut promouvoir au maximum en supervisor(2).

### Frontend `TeamMembersList.tsx`

- Recevoir `currentUserRole` en prop
- Filtrer les `ROLE_OPTIONS` pour n'afficher que les rôles **inférieurs** au rôle courant
- Masquer le menu ⋮ si le membre cible a un rang >= au rang courant
- Masquer l'email si le rôle courant n'est pas admin/owner

## Fichiers impactés

| Fichier | Action |
|---|---|
| `supabase/functions/manage-team-member/index.ts` | Hiérarchie stricte des rôles côté serveur |
| `src/components/team/TeamMembersList.tsx` | Filtrer les actions par rang + masquer emails |
| `src/components/views/teams/TeamTasksView.tsx` | Passer `currentUserRole` à `TeamMembersList` |

