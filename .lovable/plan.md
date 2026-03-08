

## Plan : Boutons rapides alignés sur les tranches horaires de la Timeline

### Problème
Les boutons rapides actuels (Matin=9h, Midi=12h, Après-midi=14h, Soir=18h) ne sont pas dynamiques — un seul horaire fixe par créneau. La Timeline utilise 3 tranches : **Matin 6-12h**, **Après-midi 12-18h**, **Soir 18-22h**. Les boutons devraient proposer plusieurs heures par tranche.

### Solution
Remplacer les 4 boutons fixes par **3 groupes de boutons** correspondant aux tranches de la Timeline, chacun avec plusieurs horaires cliquables :

- **🌅 Matin** : 6h, 7h, 8h, 9h, 10h, 11h
- **☀️ Après-midi** : 12h, 13h, 14h, 15h, 16h, 17h
- **🌙 Soir** : 18h, 19h, 20h, 21h

Chaque tranche est un petit groupe visuel avec un label et des boutons d'heures en dessous. Cliquer sur une heure la sélectionne (minutes restent inchangées). Le slider heure reste disponible pour un réglage fin.

### Fichier modifié
- `src/components/task/fields/SchedulingSection.tsx` — Remplacer `QUICK_SLOTS` par les 3 groupes basés sur `TIME_BLOCKS`, supprimer les `HOUR_TICKS` (redondants avec les nouveaux boutons)

### Design
```text
┌─────────────────────────────────────┐
│ 🌅 Matin                           │
│ [6] [7] [8] [9] [10] [11]          │
├─────────────────────────────────────┤
│ ☀️ Après-midi                       │
│ [12] [13] [14] [15] [16] [17]      │
├─────────────────────────────────────┤
│ 🌙 Soir                            │
│ [18] [19] [20] [21]                │
└─────────────────────────────────────┘
  Minutes: ──────●──────────────────
  0  5  10  15  20  25  30 ...  55
```

Le slider heures est supprimé (les boutons le remplacent). Le slider minutes reste avec ses graduations cliquables.

