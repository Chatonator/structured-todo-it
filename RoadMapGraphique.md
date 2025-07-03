
# RoadMap Graphique - Analyse Complète du Système de Couleurs

## 1. INVENTAIRE COMPLET DES ÉLÉMENTS VISUELS ET LEURS COULEURS

### 1.1 Éléments de Navigation et Structure
- **Sidebar (AppSidebar)** : `bg-theme-sidebar` → `rgb(var(--color-sidebar))` - Couleur de fond de la barre latérale
- **Header (AppHeader)** : `bg-theme-background` → `rgb(var(--color-background))` - Fond d'en-tête
- **Navigation items** : `text-theme-foreground` → `rgb(var(--color-foreground))` - Texte de navigation

### 1.2 Boutons et Actions
- **Bouton "Nouvelle tâche"** : 
  - Fond : `bg-primary` → `rgb(var(--color-primary))` → `rgb(99, 102, 241)` (Bleu indigo)
  - Texte : `text-primary-foreground` → `rgb(var(--color-background))` → `rgb(255, 255, 255)` (Blanc)
  - Hover : `hover:bg-primary/90` → Variante transparente du primary
- **Boutons d'actions des tâches** :
  - Diviser : `text-blue-500 hover:text-blue-700`
  - Terminer : `text-green-500 hover:text-green-700`
  - Supprimer : `text-gray-400 hover:text-red-500`

### 1.3 Tâches et Leurs Couleurs Catégorielles
- **Obligation** : `--color-obligation` → `rgb(220, 38, 38)` (Rouge plus prononcé)
- **Quotidien** : `--color-quotidien` → `rgb(251, 191, 36)` (Jaune plus brillant)
- **Envie** : `--color-envie` → `rgb(134, 239, 172)` (Vert plus clair)
- **Autres** : `--color-autres` → `rgb(37, 99, 235)` (Bleu plus prononcé)

### 1.4 Contextes
- **Pro** : `--color-context-pro` → `rgb(59, 130, 246)` (Bleu)
- **Perso** : `--color-context-perso` → `rgb(34, 197, 94)` (Vert)

### 1.5 Priorités
- **Le plus important** : `--color-priority-highest` → `rgb(147, 51, 234)` (Violet)
- **Important** : `--color-priority-high` → `rgb(59, 130, 246)` (Bleu)
- **Peut attendre** : `--color-priority-medium` → `rgb(234, 179, 8)` (Jaune)
- **Si j'ai le temps** : `--color-priority-low` → `rgb(107, 114, 128)` (Gris)

### 1.6 Interfaces et Modales
- **TaskModal (Overlay de création)** :
  - Fond : `bg-card` → `rgb(var(--color-card))` avec overlay sombre
  - Boutons catégories : Utilise `cssVarRGB()` pour les couleurs résolues
  - Boutons contexte : Utilise `cssVarRGB()` pour Pro/Perso
- **Cards et Conteneurs** :
  - Fond : `bg-card` → `rgb(var(--color-card))`
  - Bordures : `border-border` → `rgb(var(--color-border))`

### 1.7 Graphiques et Visualisations
- **Dashboard - Graphique en secteurs** : Utilise les couleurs catégorielles résolues
- **Dashboard - Graphique en barres** : Utilise `cssVarRGB()` pour chaque catégorie
- **Matrice d'Eisenhower** : 4 quadrants avec couleurs catégorielles
- **Vue 1-3-5** : Couleurs par priorité et catégorie

## 2. RÉSUMÉ DES CORRECTIONS APPORTÉES AU SYSTÈME DE COULEURS

### 2.1 Problème Initial
- Utilisation de variables CSS `var(--color-name)` dans les styles inline
- Les navigateurs n'évaluaient pas ces variables dynamiquement
- Résultat : couleurs par défaut ou incorrectes affichées

### 2.2 Solution Implémentée
- **Création de `cssVarRGB()`** dans `src/utils/colors.ts`
- **Fonction de résolution** : Convertit les variables CSS en valeurs RGB réelles
- **Système de fallback** : Couleurs hardcodées si les variables CSS échouent
- **Application globale** : Tous les composants utilisant des couleurs inline

### 2.3 Corrections des Couleurs Catégorielles
- **Rouge (Obligation)** : `239, 68, 68` → `220, 38, 38` (plus prononcé)
- **Jaune (Quotidien)** : `250, 204, 21` → `251, 191, 36` (plus brillant)
- **Vert (Envie)** : `74, 222, 128` → `134, 239, 172` (plus clair)
- **Bleu (Autres)** : `30, 58, 138` → `37, 99, 235` (plus bleu)

### 2.4 Corrections de Mapping Tailwind
- **Synchronisation Shadcn/UI** : Variables HSL → Variables RGB harmonisées
- **Classes `bg-primary`** : Maintenant liées à `--color-primary`
- **Classes `text-primary-foreground`** : Maintenant liées à `--color-background`
- **Cohérence complète** : `tailwind.config.ts` ↔ `colors.css` ↔ Composants

### 2.5 Fichiers Modifiés
1. **`src/styles/colors.css`** : Définition des nouvelles couleurs + ajout `--radius`
2. **`src/utils/colors.ts`** : Utilitaire de résolution + fallbacks harmonisés
3. **`tailwind.config.ts`** : Mapping complet Shadcn/UI → variables RGB
4. **`src/components/TaskModal.tsx`** : Modal de création de tâches
5. **`src/components/task/TaskItemContent.tsx`** : Contenu des éléments de tâche
6. **`src/components/PriorityView.tsx`** : Vue priorité 1-3-5
7. **`src/components/TasksView.tsx`** : Vue globale des tâches
8. **`src/components/EisenhowerView.tsx`** : Matrice d'Eisenhower
9. **`src/components/DashboardView.tsx`** : Tableau de bord et graphiques

## 3. CHEMIN COMPLET DES COULEURS

### 3.1 Couleur d'une Tâche - Chemin Technique Complet

#### A. Définition Source
```css
src/styles/colors.css
:root {
  --color-obligation: 220 38 38;    /* Rouge plus prononcé */
  --color-quotidien: 251 191 36;    /* Jaune plus brillant */
  --color-envie: 134 239 172;       /* Vert plus clair */
  --color-autres: 37 99 235;        /* Bleu plus prononcé */
}
```

#### B. Mapping Technique
```typescript
src/types/task.ts
export const CATEGORY_CSS_NAMES = {
  'Obligation': 'obligation',
  'Quotidien': 'quotidien', 
  'Envie': 'envie',
  'Autres': 'autres'
} as const;

export const CATEGORY_CONFIG = {
  'Obligation': {
    cssName: 'obligation',
    // ...
  }
}
```

#### C. Résolution de Couleur
```typescript
src/utils/colors.ts
export const cssVarRGB = (varName: string): string => {
  // 1. Lecture de la variable CSS depuis le DOM
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(varName).trim();
  
  // 2. Conversion en format RGB
  if (value && value !== '') {
    return `rgb(${value})`;
  }
  
  // 3. Fallback vers couleurs hardcodées harmonisées
  const fallback = COLOR_FALLBACKS[varName];
  return fallback ? `rgb(${fallback})` : 'rgb(0, 0, 0)';
};
```

#### D. Application dans les Composants
```typescript
src/components/task/TaskItem.tsx
const resolvedCategoryColor = useMemo(() => {
  const color = cssVarRGB(`--color-${cssName}`);
  return color;
}, [cssName]);

// Utilisation dans les styles inline
style={{
  borderLeftColor: resolvedCategoryColor,
  boxShadow: `0 8px 25px -5px ${resolvedCategoryColor}40`
}}
```

### 3.2 Bouton "Nouvelle Tâche" - Chemin Technique Complet

#### A. Définition dans les Variables CSS
```css
src/styles/colors.css
:root {
  --color-primary: 99 102 241;    /* Bleu indigo */
  --color-background: 255 255 255; /* Blanc pour contraste */
}
```

#### B. Mapping Tailwind Harmonisé
```typescript
tailwind.config.ts
colors: {
  primary: {
    DEFAULT: 'rgb(var(--color-primary))', // 99, 102, 241
    foreground: 'rgb(var(--color-background))' // 255, 255, 255
  }
}
```

#### C. Utilisation dans le Composant Button
```typescript
src/components/ui/button.tsx
const buttonVariants = cva(
  // ...
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        // bg-primary = rgb(99, 102, 241)
        // text-primary-foreground = rgb(255, 255, 255)
      }
    }
  }
)
```

#### D. Instanciation du Bouton
```typescript
Quelque part dans l'application (TaskList ou similaire)
<Button variant="default">
  Nouvelle tâche
</Button>
// Résultat : Fond bleu indigo (99, 102, 241), texte blanc (255, 255, 255)
```

## 4. INTERACTIONS ET FLUX DE DONNÉES

### 4.1 Flux de Résolution des Couleurs
1. **Définition** : `colors.css` → Variables CSS globales au format RGB
2. **Mapping Tailwind** : `tailwind.config.ts` → `rgb(var(--color-xxx))` pour toutes les classes
3. **Mapping Types** : `task.ts` → Association catégorie ↔ nom CSS
4. **Résolution Runtime** : `colors.ts` → Conversion var CSS → RGB réel
5. **Mémorisation** : `useMemo()` dans composants → Évite recalculs
6. **Application** : Styles inline avec couleurs résolues

### 4.2 Thèmes et Variations
- **Mode sombre** : `[data-theme="dark"]` surcharge les variables RGB
- **Mode daltonien** : `[data-theme="colorblind"]` couleurs optimisées
- **Contraste élevé** : `[data-theme="high-contrast"]` couleurs pures

### 4.3 Points d'Extension
- **Nouveaux thèmes** : Ajouter dans `colors.css` avec sélecteur `[data-theme="nom"]`
- **Nouvelles catégories** : Étendre `CATEGORY_CONFIG` et ajouter variables CSS
- **Nouvelles couleurs système** : Ajouter dans les variables `--color-*`

## 5. FICHIERS ET DOSSIERS IMPLIQUÉS

### 5.1 Configuration des Couleurs
- **`src/styles/colors.css`** : Source de vérité pour toutes les couleurs + `--radius`
- **`src/utils/colors.ts`** : Utilitaires de résolution + fallbacks harmonisés
- **`src/types/task.ts`** : Configuration des catégories et mapping
- **`tailwind.config.ts`** : Configuration Tailwind harmonisée avec variables RGB

### 5.2 Composants Utilisant les Couleurs
- **`src/components/task/`** : Tous les composants de tâches
- **`src/components/TaskModal.tsx`** : Modal de création
- **`src/components/*View.tsx`** : Toutes les vues (Dashboard, Priority, etc.)
- **`src/components/ui/badge.tsx`** : Badges avec couleurs catégorielles
- **`src/components/ui/button.tsx`** : Boutons utilisant `bg-primary`

### 5.3 Système de Thèmes
- **`src/hooks/useTheme.ts`** : Hook de gestion des thèmes
- **`src/index.css`** : Classes Tailwind étendues pour les thèmes

## 6. COHÉRENCE COMPLÈTE ASSURÉE

### 6.1 Synchronisation Totale
- **Variables CSS** : Toutes au format RGB `--color-*`
- **Classes Tailwind** : Toutes mappées via `rgb(var(--color-*))`
- **Fallbacks** : Harmonisés avec les vraies valeurs
- **Composants** : Utilisent soit les classes Tailwind, soit `cssVarRGB()`

### 6.2 Tests de Cohérence
- ✅ `bg-primary` → `rgb(var(--color-primary))` → `rgb(99, 102, 241)`
- ✅ `text-primary-foreground` → `rgb(var(--color-background))` → `rgb(255, 255, 255)`
- ✅ `cssVarRGB('--color-obligation')` → `rgb(220, 38, 38)`
- ✅ Fallbacks alignés avec les vraies valeurs CSS

### 6.3 Recommandations et Améliorations

#### 6.3.1 Optimisations Possibles
- **Contexte React** pour les couleurs résolues (éviter useMemo répétés)
- **Cache des couleurs** pour améliorer les performances
- **TypeScript strict** pour les noms de couleurs

#### 6.3.2 Maintenance
- **Centralisation** : Toutes les couleurs dans `colors.css`
- **Documentation** : Ce document comme référence
- **Tests** : Vérifier la résolution des couleurs dans différents navigateurs

#### 6.3.3 Extensibilité
- **API de couleurs** : Fonction pour générer de nouvelles couleurs
- **Thèmes personnalisés** : Interface pour créer des thèmes utilisateur
- **Export/Import** : Sauvegarde des préférences de couleurs

---

**Date de création** : 2025-07-03  
**Date de mise à jour** : 2025-07-03  
**Version** : 1.1  
**Statut** : Système de couleurs entièrement harmonisé et cohérent
