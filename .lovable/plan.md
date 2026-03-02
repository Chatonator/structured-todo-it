

## Correction du redirect email de confirmation

### Probleme

Le lien de confirmation par email redirige vers `localhost:3000` au lieu de l'URL publique GitHub Pages. Cela vient de deux sources :

1. **Supabase Dashboard** : La "Site URL" est configuree sur localhost
2. **Code** : `window.location.origin` est dynamique et correct en production, mais Supabase peut l'ignorer si l'URL n'est pas dans la liste des redirections autorisees

---

### Action 1 — Configuration Supabase Dashboard (manuelle)

Vous devez modifier ces parametres dans le dashboard Supabase :

**Authentication > URL Configuration** :

- **Site URL** : `https://chatonator.github.io/structured-todo-it/`
- **Redirect URLs** (ajouter si absents) :
  - `https://chatonator.github.io/structured-todo-it/**`
  - `https://chatonator.github.io/structured-todo-it/#/**`

Lien direct : https://supabase.com/dashboard/project/dqctsbahpxeosufvapln/auth/url-configuration

---

### Action 2 — Securiser le code (petite modification)

Actuellement le code (ligne 139) construit le redirect dynamiquement :

```
const redirectUrl = `${window.location.origin}${import.meta.env.BASE_URL}#/`;
```

Cela fonctionne en production GitHub Pages mais genere `http://localhost:8080/` en dev et des URLs de preview en pre-production. Pour plus de robustesse, ajouter un fallback vers l'URL de production en `.env.production`.

**Fichier** : `.env.production`
- Ajouter `VITE_PUBLIC_URL=https://chatonator.github.io/structured-todo-it/`

**Fichier** : `src/pages/Auth.tsx`
- Ligne 139 : utiliser `import.meta.env.VITE_PUBLIC_URL` si disponible, sinon fallback sur la construction dynamique actuelle
- Ligne 217 : meme correction pour `resetPasswordForEmail`

```typescript
const getRedirectUrl = (path: string = '') => {
  const publicUrl = import.meta.env.VITE_PUBLIC_URL;
  if (publicUrl) return `${publicUrl}#/${path}`;
  return `${window.location.origin}${import.meta.env.BASE_URL}#/${path}`;
};
```

Puis utiliser `getRedirectUrl()` pour le signup et `getRedirectUrl('auth')` pour le reset password.

---

### Fichiers impactes

| Fichier | Action |
|---|---|
| `.env.production` | Ajouter `VITE_PUBLIC_URL` |
| `src/pages/Auth.tsx` | Helper `getRedirectUrl`, l'utiliser aux lignes 139 et 217 |

### Action manuelle requise

Configurer la Site URL et les Redirect URLs dans le dashboard Supabase (lien fourni ci-dessus). Sans cette etape, le fix code seul ne suffira pas car Supabase valide les URLs de redirection contre sa liste autorisee.
