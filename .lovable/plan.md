

## Plan : Sélecteur d'heure visuel pour la planification

### Problème
L'input `type="time"` actuel nécessite le clavier. Tout le reste du formulaire fonctionne à la souris (sliders, graduations cliquables, calendrier). Il faut harmoniser.

### Solution
Remplacer l'`<Input type="time">` par un **double slider heure/minute avec graduations cliquables**, identique au pattern du `DurationPicker` :

- **Slider Heures** : 0–23, pas de 1, graduations cliquables tous les 2h (0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22)
- **Slider Minutes** : 0–55, pas de 5, graduations cliquables tous les 5min (0, 5, 10, ..., 55)
- **Affichage** : L'heure sélectionnée s'affiche en temps réel (ex: `14h30`)
- **Boutons rapides créneaux** : Matin (9h), Midi (12h), Après-midi (14h), Soir (18h) — pour positionner rapidement

### Fichier modifié
- `src/components/task/fields/SchedulingSection.tsx` — Remplacement de l'input time par les sliders + graduations + boutons créneaux

### Design
Le calendrier reste en popover. Le sélecteur d'heure s'affiche en dessous, avec le même style compact que le DurationPicker (labels discrets, graduations cliquables, affichage de la valeur courante).

