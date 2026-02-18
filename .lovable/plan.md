

# Afficher le resume hebdomadaire dans l'Observatoire

## Contexte

Apres verification approfondie, les 7 premiers correctifs de la liste sont deja implementes dans le code et la base de donnees. Le seul point restant est l'affichage du resume hebdomadaire dans l'Observatoire.

## Ce qui est deja fait (verification)

| Correctif | Statut |
|---|---|
| Timeline appelle `toggleTaskCompletion` | Fait (L443-447 de useTimelineScheduling.ts) |
| Index unique anti-farming sur xp_transactions | Fait (idx_xp_transactions_unique_task) |
| Guard code idempotence dans rewardTaskCompletion | Fait (L112-123 de useGamification.ts) |
| Streak basee sur `last_streak_qualified_date` | Fait (colonne DB + logique L239-251) |
| Eisenhower mapping aligne moteur | Fait (L43-48 de useEisenhowerViewData.ts) |
| Planning bonus `starts_at - created_at` | Fait (L138-155 de useGamification.ts) |
| Micro-cap formule coherente | Fait (L178-179 de useGamification.ts) |
| ProgressOverview utilise constante | Fait (L55 utilise STREAK_MIN_IMPORTANT_MINUTES) |

## Correctif restant : Resume hebdo dans l'Observatoire

**Probleme** : Le calcul `getWeeklySummary()` existe dans `useGamification` mais n'est affiche que dans la vue Rewards. La spec demande aussi un affichage dans l'Observatoire.

**Solution** : Ajouter une carte compacte en haut de la section visualisations dans `ObservatoryView.tsx` qui appelle `getWeeklySummary()` via `useGamification()` et affiche les 3 barres de repartition (Important non-urgent / Urgent / Maintenance) + le score d'alignement.

### Etapes techniques

1. Dans `ObservatoryView.tsx` :
   - Importer `useGamification` pour acceder a `getWeeklySummary()`
   - Ajouter un `useEffect` + `useState` pour charger le resume au montage
   - Ajouter une `Card` compacte avant la grille de visualisations, avec les 3 barres et le score d'alignement
   - Reutiliser le meme pattern de barres que dans `ProgressOverview.tsx` (composant `BarRow` inline)

2. Aucune modification de `useGamification.ts` (le calcul existe deja)

3. Aucune migration DB necessaire

