

# Audit de sécurité — Résultats et corrections

## Vulnérabilités trouvées

### 🔴 CRITIQUE — Escalade de privilèges sur `team_members`

La policy INSERT `Users can add themselves when creating team` vérifie uniquement `auth.uid() = user_id` sans restreindre le `team_id` ni le `role`. **N'importe quel utilisateur authentifié peut s'insérer comme `owner` dans n'importe quelle équipe** via un simple appel Supabase côté client.

**Correction** : Supprimer la policy INSERT permissive et la remplacer par une policy qui ne permet l'insertion que via les Edge Functions (service role). Les insertions légitimes passent déjà toutes par des Edge Functions (`create-team`, `join-team`, `respond-to-invitation`) qui utilisent le service role key.

### 🟡 WARN — Emails exposés aux coéquipiers

La policy SELECT sur `profiles` permet à tout coéquipier de lire l'email des autres membres. Ce n'est pas critique pour un outil d'équipe (les admins ont besoin de voir les emails pour inviter), mais on peut restreindre : seuls les admins voient les emails, les autres voient uniquement `display_name`.

**Correction** : Créer une vue `profiles_public` sans email, et restreindre la policy de base. Cependant, cela impacte beaucoup de code existant. Alternative plus simple : accepter ce comportement (les emails sont visibles entre coéquipiers, ce qui est normal dans un contexte d'équipe).

### 🟡 WARN — OTP expiry trop long

Le délai d'expiration OTP dépasse le seuil recommandé. Configurable dans le dashboard Supabase > Auth > Settings.

### 🟡 WARN — Leaked password protection désactivée

À activer dans le dashboard Supabase > Auth > Settings.

### 🟡 WARN — Version Postgres à mettre à jour

Patches de sécurité disponibles. À faire via le dashboard Supabase.

### 🟡 WARN — Extension dans le schema public

Peu critique, mais idéalement les extensions devraient être dans un schema dédié.

## Plan de corrections (code)

### 1. Migration SQL — Corriger la policy INSERT sur `team_members`

```sql
-- Supprimer la policy dangereuse
DROP POLICY "Users can add themselves when creating team" ON public.team_members;

-- Nouvelle policy : personne ne peut INSERT directement
-- Les Edge Functions utilisent le service_role qui bypass RLS
-- Donc aucune policy INSERT n'est nécessaire
```

Cela fonctionne car :
- `create-team` → service role (bypass RLS)
- `join-team` → service role
- `respond-to-invitation` → service role
- `join-team-public` → ne fait pas d'insert (corrigé précédemment)

### 2. Pas de changement côté Edge Functions

Toutes les Edge Functions utilisent déjà le `SUPABASE_SERVICE_ROLE_KEY` pour les insertions dans `team_members`, donc elles bypassent RLS. Aucun changement nécessaire.

### 3. Recommandations dashboard (pas de code)

- Réduire l'expiration OTP (dashboard Auth > Settings)
- Activer la protection leaked passwords (dashboard Auth > Settings)
- Mettre à jour Postgres (dashboard Infrastructure)

## Fichiers impactés

| Fichier | Action |
|---|---|
| Migration SQL | Supprimer policy INSERT dangereuse sur `team_members` |

