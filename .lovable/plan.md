
Objectif validé: corriger le container **Points** pour qu’il n’ait plus de grand vide inutile et que le contenu utile (jauge + infos) occupe intelligemment toute la hauteur/largeur disponibles, sans rendre le texte/jauge minuscules.

### Ce que j’ai observé (image + code)
- Le card `Points` est en `h-full`, donc il prend la hauteur de la rangée (étirée par les autres panneaux).
- À l’intérieur, le contenu est presque fixe (`h-36`, petites tailles, `items-center`), donc il reste collé en haut-gauche et laisse un gros vide.
- La jauge et le texte ne “scalent” pas avec la place disponible, ce qui crée l’effet disproportionné visible sur ta capture.

### Plan d’implémentation

#### 1) Refaire la structure interne de `ProgressOverview` pour utiliser toute la hauteur
**Fichier:** `src/components/rewards/ProgressOverview.tsx`

- Garder un layout en 2 zones claires:
  - **Zone gauche**: jauge + seuils
  - **Zone droite**: texte/statuts
- Transformer le card en:
  - header compact (titre)
  - body en `flex-1 min-h-0` pour remplir la hauteur réelle du container.
- Remplacer le bloc actuel `items-center` par un body qui s’étire:
  - `grid`/`flex` horizontal avec `h-full`
  - plus de centrage vertical global qui “compacte” tout en haut.

#### 2) Faire grandir la jauge avec l’espace disponible (au lieu d’une hauteur figée)
**Fichier:** `src/components/rewards/ProgressOverview.tsx`

- Remplacer `h-36` par une hauteur flexible basée sur le container:
  - ex: `h-full min-h-[190px]` + `max-h` raisonnable.
- Conserver les seuils alignés sur la hauteur réelle de la jauge (même référentiel).
- Ajuster largeur de jauge/labels pour lisibilité (pas minuscule).

#### 3) Faire occuper la colonne texte toute la hauteur disponible
**Fichier:** `src/components/rewards/ProgressOverview.tsx`

- Donner `flex-1 h-full` à la colonne de droite.
- Distribuer les blocs en `justify-between` (ou sections compactes) pour supprimer le “trou” vide.
- Ré-augmenter légèrement les tailles utiles:
  - valeur points plus visible,
  - lignes streak/résumé lisibles,
  - espacement vertical optimisé (compact mais respirant).
- Supprimer les paddings qui décalent inutilement (`pl-6` rigide), remplacer par gap proportionné.

#### 4) Équilibrer la largeur de la carte Points dans la rangée (anti-disproportion)
**Fichier:** `src/components/views/rewards/RewardsView.tsx`

- Revoir la distribution largeur sur desktop pour éviter que `Points` prenne un espace excessif par défaut quand les autres colonnes sont étroites.
- Garder le comportement demandé précédemment (récompenses en colonne), mais poser des bornes de largeur plus équilibrées (`min/max` ou `basis`) afin que la carte Points reste “dense” et visuellement cohérente.

### Résultat attendu
- Plus de grand vide vide dans `Points`.
- Jauge + texte utilisent vraiment la surface du card.
- Lisibilité en hausse (pas de contenu réduit inutilement).
- Carte plus compacte, plus jolie, mieux proportionnée avec le reste de la vue.

### Vérifications après implémentation
1. Desktop large: vérifier que la jauge et le texte occupent la hauteur complète sans trou visuel.
2. Largeur intermédiaire: vérifier que rien ne devient minuscule.
3. Mobile/tablette: vérifier que la structure reste propre et lisible (pas de chevauchement labels/jauge).
4. Contrôle visuel final avec ta capture comme référence (avant/après).

### Détails techniques (section technique)
- Principal problème actuel: combinaison `h-full` (parent étiré) + contenu interne à dimensions fixes.
- Correctif clé: faire passer la hauteur “disponible” du card au body (`flex-1 min-h-0`) puis à la jauge/colonne texte.
- Les tailles de police ne seront pas réduites; elles seront recalibrées à la hausse ou conservées, avec une meilleure répartition spatiale.
