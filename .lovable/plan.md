

# Optimisation de la vue Equipe : section taches collapsible et suppression de la redondance

## Probleme

1. La card "Taches de l'equipe" (lignes 336-425) affiche toutes les taches en permanence -- prend beaucoup de place
2. La card "Voir les taches" (lignes 431-446) dans Quick Actions est redondante avec la section ci-dessus

## Solution

- **Supprimer** la card "Voir les taches" des Quick Actions (garder uniquement "Voir les projets")
- **Rendre la section taches collapsible** : par defaut, afficher seulement le header avec le compteur et le filtre membre. Un clic deploie la liste des taches. Utiliser `Collapsible` de Radix.

### Modifications

**`src/components/views/teams/TeamTasksView.tsx`** :

1. **Importer** `Collapsible, CollapsibleContent, CollapsibleTrigger` depuis `@/components/ui/collapsible`
2. **Ajouter un state** `const [tasksOpen, setTasksOpen] = useState(false)`
3. **Wrapper** la Card "Taches de l'equipe" (lignes 337-425) dans un `Collapsible` :
   - Le `CardHeader` devient le trigger (cliquable, avec chevron)
   - Le `CardContent` avec les listes de taches va dans `CollapsibleContent`
   - Ajouter une icone `ChevronDown` qui tourne quand ouvert
4. **Supprimer** la card "Voir les taches" (lignes 431-446) des Quick Actions
5. **Adapter** la grille Quick Actions : passer de `grid-cols-2` a un simple element (la card projets seule), ou garder le layout si d'autres actions existent

| Fichier | Action |
|---------|--------|
| `src/components/views/teams/TeamTasksView.tsx` | Collapsible sur taches + suppression "Voir les taches" |

