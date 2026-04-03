

## Redesign de la vue Habitudes : conteneurs transparents par deck

### Probleme actuel
La vue actuelle utilise des onglets (tabs) pour naviguer entre les decks. On ne voit qu'un seul deck a la fois, ce qui oblige a cliquer pour decouvrir les habitudes. C'est lent et peu pratique.

### Vision
Toutes les habitudes sont visibles d'un coup. Chaque deck est un cadre transparent (bordure subtile, fond semi-transparent) qui regroupe visuellement ses habitudes. Les habitudes sont compactes, avec un checkbox bien visible pour valider rapidement.

```text
┌─ 🏋️ Santé ──────────────────────────────┐
│  ☑ Méditation 15min          🔥 12      │
│  ☐ Sport 30min               🔥 3       │
│  ☐ Boire 2L d'eau                       │
│                          [+ Habitude]   │
└──────────────────────────────────────────┘

┌─ 💼 Productivité ───────────────────────┐
│  ☑ Inbox Zero               🔥 7       │
│  ☐ Lecture 20min             🔥 1       │
│                          [+ Habitude]   │
└──────────────────────────────────────────┘
```

### Etapes

**1. Nouveau hook `useAllHabitsViewData`**
- Appeler `useItems({ contextTypes: ['habit'] })` sans filtre `parentId` pour charger TOUTES les habitudes
- Grouper les habitudes par `deckId` cote client
- Reutiliser la logique de completions/streaks existante

**2. Nouveau composant `HabitDeckContainer`**
- Cadre transparent : `border border-border/40 bg-card/30 backdrop-blur-sm rounded-xl`
- Header avec icone + nom du deck + compteur (ex: "3/5")
- Bouton "+" pour ajouter une habitude dans ce deck
- Les habitudes s'affichent en liste compacte a l'interieur

**3. Nouveau composant `CompactHabitRow`**
- Une ligne par habitude : checkbox | icone | nom | streak badge
- Touch-friendly (min-height 44px)
- Checkbox bien visible, toggle en un clic
- Strikethrough + opacity quand complete
- Menu contextuel (edit/delete) au hover ou long-press

**4. Refonte de `HabitsView`**
- Supprimer les `HabitDeckTabs` (plus de navigation par onglets)
- Afficher tous les `HabitDeckContainer` en colonne
- Conserver les metriques en haut (A faire, Completees, Streak, Semaine)
- Conserver le panneau lateral (TodayProgress, Reperes rapides)
- Conserver la section "Analyses et tendances" en bas

### Fichiers modifies
- `src/hooks/view-data/useHabitsFullViewData.ts` : charger toutes les habitudes sans filtre deck, grouper par deckId
- `src/components/views/habits/HabitsView.tsx` : remplacer tabs + HabitGrid par liste de DeckContainers
- **Nouveau** `src/components/habits/HabitDeckContainer.tsx` : cadre transparent par deck
- **Nouveau** `src/components/habits/CompactHabitRow.tsx` : ligne compacte d'habitude

### Details techniques
- Le hook `useHabits` sera appele avec `deckId = null` et le filtre `parentId` sera rendu optionnel (actuellement il filtre par `parentId: deckId || undefined`, donc passer `null` devrait deja charger toutes les habitudes si on ajuste le hook)
- Alternativement, on peut appeler `useItems({ contextTypes: ['habit'] })` directement dans le hook de vue et grouper cote client par `parentId`
- Les completions et streaks fonctionnent deja par `habitId`, donc pas de changement necessaire

