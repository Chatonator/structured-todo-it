

# Plan technique — Vue Récompenses "Laboratoire"

## Résumé

Remplacement complet de la vue Récompenses actuelle par une scène de laboratoire interactive en 2D avec simulation physique de billes. Quatre cuves de catégories (Obligation, Quotidien, Envie, Autres) alimentent une cuve centrale via des tuyaux, avec un bouton "Raffiner" qui déclenche le transfert animé.

---

## Choix technologique

**HTML5 Canvas 2D + moteur physique léger (matter.js)**

Pourquoi ce choix :
- **matter.js** est un moteur physique 2D mature (~16 KB gzip), qui gère nativement la gravité, les collisions, les rebonds et l'empilement — exactement ce qu'il faut pour des billes crédibles sans entrer dans la 3D.
- Pas besoin de Three.js / WebGL : la scène est fondamentalement 2D (cuves vues de face). Cela évite toute complexité liée au rendu 3D, aux caméras, aux shaders.
- Le Canvas permet un rendu propre, semi-réaliste (dégradés, transparences pour le verre, reflets) sans la lourdeur d'un pipeline 3D.
- Parfaite intégration React via un composant Canvas avec refs, sans dépendance lourde.

**Dépendance ajoutée** : `matter-js` + `@types/matter-js`

---

## Architecture des composants

```text
src/components/rewards/
├── lab/
│   ├── LabScene.tsx            ← Composant React principal (canvas + cycle de vie)
│   ├── LabRenderer.ts          ← Rendu canvas : cuves, tuyaux, fond, effets visuels
│   ├── LabPhysics.ts           ← Moteur matter.js : monde, corps, contraintes
│   ├── LabConfig.ts            ← Constantes : dimensions, couleurs, positions des cuves
│   ├── types.ts                ← Types internes (CuveState, BallData, ScenePhase)
│   └── useLabScene.ts          ← Hook : initialisation, boucle render, nettoyage, état
├── ProgressOverview.tsx        ← Conservé mais non utilisé dans la v1 lab
├── RecentActivity.tsx          ← Conservé mais non utilisé dans la v1 lab
```

**Séparation des responsabilités** :
- `LabPhysics.ts` — pur moteur : crée le monde matter.js, les murs des cuves, les billes, les vannes. Aucune dépendance React. Testable isolément.
- `LabRenderer.ts` — pur dessin : prend l'état du monde physique et dessine sur le Canvas. Gère l'esthétique (verre, tuyaux translucides, fond sombre).
- `LabConfig.ts` — toutes les constantes numériques et couleurs, tirées des couleurs de catégorie existantes (`#dc2626`, `#f59e0b`, `#16a34a`, `#8b5cf6`).
- `useLabScene.ts` — orchestre init / animation loop / cleanup. Gère le state React (phase de la scène : idle, refining, done).
- `LabScene.tsx` — JSX minimal : un `<canvas>` plein écran + le bouton "Raffiner" positionné en overlay.

---

## Layout de la scène

```text
┌──────────────────────────────────────────────────┐
│                 FOND SOMBRE (#1a1a2e)            │
│                                                  │
│   ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐       │
│   │ OBL │   │ QUO │   │ ENV │   │ AUT │       │
│   │ ●●● │   │ ●●● │   │ ●●● │   │ ●●● │       │
│   │ ●●● │   │ ●●● │   │ ●●● │   │ ●●● │       │
│   └──┬──┘   └──┬──┘   └──┬──┘   └──┬──┘       │
│      │         │         │         │            │
│      └─────────┴────┬────┴─────────┘            │
│                     │                            │
│                ┌────▼────┐                       │
│                │RÉCOMPENSE│                       │
│                │  (vide)  │                       │
│                └─────────┘                       │
│                                                  │
│              [ ⚗ Raffiner ]                      │
└──────────────────────────────────────────────────┘
```

- 4 cuves en haut, espacées régulièrement
- Tuyaux diagonaux convergent vers la cuve centrale en bas
- Cuve centrale plus grande
- Bouton "Raffiner" sous la cuve centrale

---

## Détail de chaque module

### LabConfig.ts
- Couleurs des 4 catégories (hex, tirées de `tailwind.config.ts` : `category.obligation`, etc.)
- Dimensions relatives (ratios) pour s'adapter à la taille du canvas
- Rayon des billes, coefficient de restitution (rebond ~0.4), friction
- Nombre de billes par cuve (mock : 15-25 par cuve)
- Positions relatives des cuves (pourcentages du canvas)

### LabPhysics.ts
- `createWorld()` → matter.js Engine + World avec gravité
- `createCuve(position, dimensions)` → corps statiques formant les parois (rectangles)
- `createBalls(cuve, count, color)` → corps circulaires avec restitution, placés aléatoirement au-dessus de la cuve pour qu'ils tombent naturellement à l'init
- `openValve(cuveIndex)` → supprime le corps statique du fond de la cuve source
- `createPipeGuides(from, to)` → corps statiques inclinés formant les parois des tuyaux (les billes glissent dedans par gravité)
- Pas de contraintes complexes : les tuyaux sont simplement des "gouttières" physiques (deux murs inclinés)

### LabRenderer.ts
- `drawBackground(ctx)` → dégradé sombre (#1a1a2e → #0f0f23)
- `drawCuve(ctx, position, dimensions, color, label)` → rectangles avec bordures semi-transparentes (effet verre : stroke blanc à 15% opacité, fill très légèrement teinté)
- `drawPipes(ctx, fromPositions, toPosition)` → lignes/rectangles avec fill semi-transparent, léger dégradé
- `drawBalls(ctx, bodies)` → cercles avec dégradé radial (highlight blanc en haut-gauche pour l'effet sphérique)
- `drawButton` n'est pas dans le canvas : c'est un vrai bouton HTML superposé
- Labels des cuves : texte canvas (nom de catégorie + nom d'affichage)

### useLabScene.ts
```
Phase: 'initializing' | 'idle' | 'refining' | 'done'
```
- **initializing** : crée le monde, spawne les billes, attend qu'elles se stabilisent (~1-2s)
- **idle** : boucle de rendu tourne, billes immobiles dans les cuves, bouton actif
- **refining** : ouvre les vannes séquentiellement (léger délai entre chaque cuve), billes tombent dans les tuyaux. Bouton désactivé. Détecte la fin quand toutes les billes sont dans la cuve centrale et au repos.
- **done** : animation terminée, billes accumulées dans la cuve récompense

Nettoyage : `useEffect` cleanup détruit le monde matter.js et annule le `requestAnimationFrame`.

### LabScene.tsx
- `<canvas ref={canvasRef}>` avec `width`/`height` liés à la taille du conteneur (ResizeObserver)
- Bouton "Raffiner" en position absolute sous le canvas, stylé avec les classes existantes
- Affiche les labels des cuves (noms de catégorie via `CATEGORY_DISPLAY_NAMES`)

---

## Cycle de vie détaillé

1. **Montage** : `useEffect` crée le monde matter.js, les cuves, spawne les billes. Lance `requestAnimationFrame` loop.
2. **Billes tombent** dans leurs cuves respectives (gravité naturelle). Rebonds crédibles (restitution 0.3-0.5).
3. **Stabilisation** : après ~1.5s les billes sont au repos. Phase → `idle`.
4. **Clic "Raffiner"** : phase → `refining`. Le fond de chaque cuve est supprimé (staggeré, 200ms entre chaque). Les corps-guides des tuyaux sont déjà en place. Les billes glissent par gravité.
5. **Accumulation** : les billes arrivent dans la cuve centrale, s'empilent.
6. **Détection fin** : quand la vélocité moyenne de toutes les billes < seuil, phase → `done`.

---

## Données mock

Pour cette phase, aucun calcul métier. Les données sont en dur dans `LabConfig.ts` :
- Obligation : 20 billes rouges
- Quotidien : 15 billes orange
- Envie : 18 billes vertes
- Autres : 10 billes violettes

---

## Modifications sur les fichiers existants

- **`RewardsView.tsx`** : remplacé entièrement pour afficher `<LabScene />` au lieu de ProgressOverview/RecentActivity
- **`useRewardsViewData.ts`** : simplifié (ou conservé tel quel, le hook lab n'en dépend pas encore)
- **`package.json`** : ajout de `matter-js`
- Les composants `ProgressOverview.tsx` et `RecentActivity.tsx` sont conservés mais non utilisés (réintégrables plus tard)

---

## Responsive

- Le canvas s'adapte au conteneur via ResizeObserver
- Les positions des cuves sont en pourcentages relatifs
- Sur mobile (< 640px) : les 4 cuves passent en 2x2 au lieu de 1x4, tuyaux ajustés
- Le bouton reste centré sous la cuve

---

## Risques et mitigations

| Risque | Mitigation |
|--------|-----------|
| Performance avec beaucoup de billes | Limiter à ~80 billes total, rayon suffisant pour réduire les contacts |
| matter.js non tree-shakable | ~16 KB gzip, acceptable |
| Canvas flou sur Retina | `devicePixelRatio` scaling standard |
| Cleanup mémoire | Destroy engine dans useEffect cleanup |

