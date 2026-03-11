# Système visuel

## Ordre de responsabilité
- `tokens.css`: valeurs globales et attributs DOM (`data-theme`, `data-text-size`, `data-contrast`, `data-motion`)
- `theme-light.css` / `theme-dark.css`: palette et variables de thème
- `motion.css`: keyframes et règles de réduction d'animation
- `recipes.css`: rôles visuels réutilisables et hiérarchie typographique
- `components/primitives/visual`: primitives React/CVA pour surfaces, chips et badges de layout

## Règles de contribution
- Ajouter une nouvelle couleur dans les tokens ou variables de thème, pas dans un composant métier.
- Réutiliser une primitive visuelle existante avant d'ajouter des classes locales.
- Les états actif/inactif de navigation, filtres ou header passent par les recipes partagées.
- Éviter les hex/rgb inline dans les composants applicatifs, sauf exception métier clairement justifiée.
- Si un réglage utilisateur impacte le rendu, il doit passer par `AppearanceProvider` et le DOM racine.

## Quand créer une variante
- Créer une variante si le comportement visuel est réutilisable sur au moins 2 zones.
- Garder les variantes orientées intention (`active`, `inactive`, `accent`, `mobile`) plutôt que par écran spécifique.
