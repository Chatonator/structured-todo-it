
# Plan de Correction du Déploiement GitHub Pages

## Diagnostic des Problèmes

J'ai identifié **5 problèmes critiques** qui causent la page blanche :

### Problème 1 : Chemin de base non appliqué à la production
La variable `GITHUB_PAGES` n'est probablement pas définie lors du build sur GitHub Actions, donc `base: '/'` est utilisé au lieu de `/structured-todo-it/`.

### Problème 2 : BrowserRouter incompatible avec GitHub Pages
`BrowserRouter` nécessite une configuration serveur pour le routing. GitHub Pages ne supporte pas le routing côté serveur - il sert des fichiers statiques uniquement.

**Exemple du problème :**
- URL : `https://chatonator.github.io/structured-todo-it/auth`
- GitHub Pages cherche le fichier `/structured-todo-it/auth/index.html` → 404
- Résultat : page blanche ou erreur

### Problème 3 : Fichier 404.html manquant
GitHub Pages a besoin d'un `404.html` qui redirige vers `index.html` pour les SPA (Single Page Applications).

### Problème 4 : Chemins de redirection dans ErrorBoundary
Le composant `ErrorBoundary` utilise `window.location.href = '/'` au lieu du chemin dynamique.

### Problème 5 : Workflow GitHub Actions inexistant
Aucun workflow de déploiement automatique n'est configuré.

---

## Corrections Prévues

### 1. Forcer le base path en production

**Fichier : `vite.config.ts`**

Simplifier la logique pour utiliser le bon chemin en production :

```typescript
export default defineConfig(({ mode }) => ({
  // Use subdirectory for production, / for development
  base: mode === 'production' ? '/structured-todo-it/' : '/',
  // ...
}))
```

Cela garantit que le build de production utilise toujours le bon chemin.

---

### 2. Utiliser HashRouter pour GitHub Pages

**Fichier : `src/App.tsx`**

GitHub Pages ne peut pas gérer le routing côté serveur. La solution la plus robuste est d'utiliser `HashRouter` :

```typescript
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

// Dans le JSX
<HashRouter>
  <Routes>
    {/* ... routes */}
  </Routes>
</HashRouter>
```

**Résultat des URLs :**
- Avant : `https://chatonator.github.io/structured-todo-it/auth`
- Après : `https://chatonator.github.io/structured-todo-it/#/auth`

Le `#` permet au navigateur de gérer le routing sans requête serveur.

---

### 3. Créer un fichier 404.html de fallback

**Fichier : `public/404.html`**

En backup, créer un fichier qui redirige les 404 vers l'app :

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting...</title>
  <script>
    // Redirect to the main app with the path as a query parameter
    sessionStorage.setItem('redirect', location.pathname);
    location.replace('/structured-todo-it/');
  </script>
</head>
<body>Redirecting...</body>
</html>
```

---

### 4. Corriger les chemins dans ErrorBoundary

**Fichier : `src/components/common/ErrorBoundary.tsx`**

Utiliser le base path dynamique :

```typescript
private handleGoHome = () => {
  window.location.href = import.meta.env.BASE_URL || '/';
};
```

---

### 5. Mettre à jour les redirections Auth

**Fichier : `src/pages/Auth.tsx`**

S'assurer que les redirections utilisent le hash routing :

```typescript
// Pour la navigation
navigate('/'); // HashRouter gère automatiquement

// Pour les redirects Supabase
const redirectUrl = `${window.location.origin}/structured-todo-it/#/`;
```

---

### 6. Créer le workflow GitHub Actions

**Fichier : `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist
      
      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4
```

---

## Fichiers à Modifier

| Fichier | Action |
|---------|--------|
| `vite.config.ts` | **Modifier** - Forcer base path en production |
| `src/App.tsx` | **Modifier** - Remplacer BrowserRouter par HashRouter |
| `public/404.html` | **Créer** - Fallback pour les 404 |
| `src/components/common/ErrorBoundary.tsx` | **Modifier** - Chemin dynamique |
| `src/pages/Auth.tsx` | **Modifier** - Adapter redirects pour HashRouter |
| `src/hooks/useAuth.ts` | **Modifier** - Adapter logout redirect |
| `.github/workflows/deploy.yml` | **Créer** - Workflow de déploiement |

---

## Configuration Supabase Requise

Après le déploiement, mets à jour dans Supabase (Authentication > URL Configuration) :

- **Site URL** : `https://chatonator.github.io/structured-todo-it/`
- **Redirect URLs** : 
  - `https://chatonator.github.io/structured-todo-it/**`
  - `https://chatonator.github.io/structured-todo-it/#/**`

---

## Résumé des Changements

```text
┌────────────────────────────────────────────────────────────┐
│  AVANT                                                     │
├────────────────────────────────────────────────────────────┤
│  base: process.env.GITHUB_PAGES ? '/sub/' : '/'            │
│  BrowserRouter → Nécessite serveur                         │
│  Pas de 404.html                                           │
│  Chemins hardcodés '/'                                     │
│  Pas de workflow CI/CD                                     │
└────────────────────────────────────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────────┐
│  APRÈS                                                     │
├────────────────────────────────────────────────────────────┤
│  base: mode === 'production' ? '/sub/' : '/'               │
│  HashRouter → Fonctionne en statique                       │
│  404.html avec redirection                                 │
│  Chemins dynamiques avec import.meta.env.BASE_URL          │
│  Workflow GitHub Actions automatique                       │
└────────────────────────────────────────────────────────────┘
```

---

## Estimation

| Tâche | Temps |
|-------|-------|
| Modifier vite.config.ts | 2 min |
| Remplacer Router | 5 min |
| Créer 404.html | 2 min |
| Corriger ErrorBoundary | 2 min |
| Adapter Auth.tsx | 5 min |
| Créer workflow | 5 min |

**Total : ~20 minutes**
