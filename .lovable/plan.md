

# Correcteur orthographique français

## Approche

Bonne nouvelle : les navigateurs modernes (Chrome, Firefox, Safari, Edge) intègrent déjà un correcteur orthographique natif qui supporte le français. Il suffit d'activer les bons attributs HTML sur les champs de saisie.

Aucun module supplémentaire n'est nécessaire. On va simplement ajouter `spellcheck` et `lang="fr"` aux composants `Input` et `Textarea` utilisés partout dans l'application. Ainsi, tous les champs texte (titre de tâche, description de projet, etc.) bénéficieront automatiquement de la correction orthographique française avec soulignement rouge et suggestions au clic droit.

## Modifications

### 1. Composant `Input` (`src/components/ui/input.tsx`)
- Ajouter `lang="fr"` et `spellCheck={true}` par défaut sur l'élément `<input>`.

### 2. Composant `Textarea` (`src/components/ui/textarea.tsx`)
- Ajouter `lang="fr"` et `spellCheck={true}` par défaut sur l'élément `<textarea>`.

### 3. Balise `<html>` (`index.html`)
- Ajouter `lang="fr"` sur la balise `<html>` pour indiquer globalement que l'application est en français.

## Remarques
- Le correcteur utilise le dictionnaire français du navigateur de l'utilisateur, donc rien a telecharger.
- Les mots mal orthographiés seront soulignés en rouge, et un clic droit proposera des corrections.
- Si un champ specifique ne doit pas avoir de correction (ex: un champ de code), on pourra toujours passer `spellCheck={false}` ponctuellement.

