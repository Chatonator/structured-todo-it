

# Systeme de changelog / "Quoi de neuf" via les notifications

## Concept

Creer une table `app_updates` accessible a tous (lecture seule pour les users) ou toi seul (admin) peut inserer des entrees. Au login ou au chargement de l'app, le hook verifie les updates que l'utilisateur n'a pas encore vues et les injecte automatiquement comme notifications de type `update` dans le panneau de notifications existant.

## Architecture

```text
app_updates (table Supabase)        useNotifications (hook existant)
┌──────────────────────┐            ┌──────────────────────┐
│ id, version, title,  │──inject──▶│ notifications[] avec  │
│ message, created_at  │           │ type "update" + ✨     │
└──────────────────────┘           └──────────────────────┘
        ▲                                    │
        │ INSERT (admin only)                ▼
     Edge function               NotificationPanel (existant)
     ou insertion SQL             affiche deja le type "update"
```

## Modifications

### 1. Migration SQL — Table `app_updates` + table pivot `user_seen_updates`

- `app_updates` : `id`, `version` (text), `title`, `message`, `type` (feature/fix/improvement), `created_at`. RLS : SELECT pour tous les authenticated, INSERT/UPDATE/DELETE uniquement pour l'admin (via `user_id = ADMIN_UUID` ou une fonction `has_role`).
- `user_seen_updates` : `user_id`, `update_id`, `seen_at`. Permet de tracker quelles updates chaque user a deja vues. RLS : chaque user peut lire/inserer ses propres lignes.

### 2. Hook `useAppUpdates.ts` — Detection des nouvelles updates

- Au montage, requete `app_updates` LEFT JOIN `user_seen_updates` pour trouver les updates non vues par l'utilisateur courant.
- Pour chaque update non vue : insere une notification de type `update` dans la table `notifications` (titre = update.title, message = update.message, metadata = `{ updateId, version }`).
- Marque ensuite l'update comme vue dans `user_seen_updates`.
- Ce hook est appele une fois dans `App.tsx` ou `Index.tsx`.

### 3. `NotificationPanel.tsx` — Deja pret

Le panneau affiche deja le type `update` avec l'icone Sparkles amber. Aucune modification necessaire.

### 4. Outil d'insertion pour l'admin

Deux options possibles :
- **Option A** : Ajouter un petit formulaire dans la page `/admin/bugs` (deja protegee admin) avec un onglet "Changelog" pour inserer des updates.
- **Option B** : Inserer directement via Supabase Dashboard.

Je recommande l'**Option A** pour rester autonome.

## Details techniques

### Migration SQL
```sql
CREATE TABLE public.app_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text,
  title text NOT NULL,
  message text,
  update_type text NOT NULL DEFAULT 'feature', -- feature, fix, improvement
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_seen_updates (
  user_id uuid NOT NULL,
  update_id uuid NOT NULL REFERENCES app_updates(id) ON DELETE CASCADE,
  seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, update_id)
);
```

### Hook useAppUpdates
```typescript
// 1. Fetch unseen updates
const { data: unseenUpdates } = await supabase
  .from('app_updates')
  .select('*')
  .not('id', 'in', seenUpdateIds);

// 2. For each unseen: insert notification + mark seen
for (const update of unseenUpdates) {
  await supabase.from('notifications').insert({
    user_id, type: 'update',
    title: `✨ ${update.title}`,
    message: update.message,
    metadata: { updateId: update.id, version: update.version }
  });
  await supabase.from('user_seen_updates').insert({
    user_id, update_id: update.id
  });
}
```

### Admin UI (dans /admin/bugs)
Un onglet supplementaire "Changelog" avec un formulaire : version, titre, message, type (feature/fix/improvement). Bouton "Publier" qui insere dans `app_updates`.

