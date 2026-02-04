
# Refonte complète : Vue "Observatoire des Tâches"

## Analyse de l'existant

### Vues actuelles à fusionner

**TasksView (obsolète)**
- Affiche une simple liste de tâches actives
- 3 stats basiques (actives, terminées, temps total)
- Aucune valeur ajoutée par rapport à la sidebar

**CompletedTasksView (obsolète)**
- Historique plat des tâches terminées
- Tri basique (date, durée, nom)
- Aucune analyse ou insight

### Problème central
Ces vues dupliquent ce que fait déjà la sidebar sans apporter de fonctionnalités distinctives. Il n'y a pas de valeur ajoutée en termes d'analyse, de métadonnées enrichies ou de visualisation.

---

## Proposition : "Observatoire des Tâches"

Une vue analytique et introspective qui offre une perspective unique sur vos tâches - impossible à obtenir depuis la sidebar ou les autres vues.

### Concept clé
Transformer les vues "liste de tâches" en un **tableau de bord analytique** avec :
- **Métriques temporelles** : ancienneté, vélocité, tendances
- **Visualisations** : heatmap de création, graphiques de complétion
- **Insights** : tâches "zombies", patterns de productivité
- **Vue table enrichie** : toutes les métadonnées visibles et triables

---

## Fonctionnalités détaillées

### 1. Section "Insights" (haut de page)

**Cartes d'alerte intelligentes :**
- **Tâches zombies** : tâches non complétées depuis > 7 jours (avec liste déroulante)
- **Vélocité** : tâches complétées cette semaine vs semaine dernière (+ %)
- **Temps récupéré** : minutes économisées grâce aux tâches terminées
- **Tâches en croissance** : nouvelles tâches créées vs complétées (ratio santé)

### 2. Section "Visualisations" (graphiques)

**Graphique 1 - Heatmap de création (style GitHub)**
- Grille 7x5 (5 semaines)
- Couleur = nombre de tâches créées ce jour
- Tooltip : détail du jour

**Graphique 2 - Courbe de complétion (7/30 jours)**
- Ligne : tâches complétées par jour
- Aire : tendance moyenne mobile
- Comparaison avec objectif quotidien (si défini)

**Graphique 3 - Répartition par catégorie (donut)**
- Segments : Obligation, Quotidien, Envie, Autres
- Centre : total actif

### 3. Section "Table enrichie" (coeur de la vue)

**Onglets de filtrage :**
- `Actives` - Tâches en cours
- `Terminées` - Historique
- `Zombies` - Non complétées > 7 jours
- `Récentes` - Créées cette semaine

**Colonnes de la table :**
| Colonne | Description |
|---------|-------------|
| Nom | Titre de la tâche (avec indicateur épinglé) |
| Catégorie | Badge coloré |
| Contexte | Pro / Perso |
| Âge | "3j", "2sem", "1mois" depuis création |
| Durée estimée | Temps prévu |
| Projet | Lien vers le projet (si assignée) |
| Statut | Active / Terminée / Zombie |
| Actions | Compléter, Éditer, Supprimer |

**Fonctionnalités table :**
- Tri par toutes les colonnes (clic sur header)
- Recherche textuelle
- Filtres multiples combinables
- Sélection multiple pour actions groupées

### 4. Section "Activité récente" (timeline)

Liste chronologique des 20 dernières actions :
- Tâche créée
- Tâche complétée
- Tâche modifiée
- Tâche supprimée

Avec horodatage relatif ("Il y a 5min", "Hier à 14h")

---

## Architecture technique

### Nouveaux fichiers

```
src/components/views/observatory/
├── ObservatoryView.tsx           # Vue principale orchestratrice
├── components/
│   ├── InsightsCards.tsx         # Cartes d'alertes/insights
│   ├── CreationHeatmap.tsx       # Heatmap style GitHub
│   ├── CompletionChart.tsx       # Graphique de complétion
│   ├── CategoryDonut.tsx         # Répartition par catégorie
│   ├── TasksTable.tsx            # Table enrichie avec tri/filtres
│   ├── TaskTableRow.tsx          # Ligne de la table
│   └── ActivityTimeline.tsx      # Timeline des actions récentes
└── index.ts

src/hooks/view-data/
├── useObservatoryViewData.ts     # Hook de données pour la vue
```

### Fichiers à modifier

| Fichier | Modification |
|---------|-------------|
| `src/components/routing/viewRegistry.ts` | Remplacer `tasks` et `completed` par `observatory` |
| `src/hooks/view-data/index.ts` | Exporter `useObservatoryViewData` |
| `src/lib/formatters.ts` | Ajouter `formatAge()` pour l'ancienneté des tâches |

### Fichiers à supprimer

- `src/components/views/tasks/TasksView.tsx`
- `src/components/views/tasks/CompletedTasksView.tsx`
- `src/hooks/view-data/useCompletedViewData.ts`

---

## Hook de données : useObservatoryViewData

```typescript
interface ObservatoryData {
  // Insights
  insights: {
    zombieTasks: Task[];           // > 7 jours sans complétion
    velocityThisWeek: number;      // Tâches complétées cette semaine
    velocityLastWeek: number;      // Tâches complétées semaine dernière
    velocityChange: number;        // % de changement
    timeRecovered: number;         // Minutes des tâches terminées
    createdVsCompleted: number;    // Ratio santé
  };
  
  // Visualisations
  charts: {
    creationHeatmap: HeatmapDay[]; // 35 jours de données
    completionTrend: TrendPoint[]; // 30 jours
    categoryBreakdown: CategoryStat[];
  };
  
  // Table
  tasks: EnrichedTask[];           // Toutes les tâches avec métadonnées
  
  // Activité
  recentActivity: ActivityItem[];  // 20 dernières actions
}

interface EnrichedTask extends Task {
  age: number;                     // Jours depuis création
  ageLabel: string;                // "3j", "2sem", etc.
  isZombie: boolean;               // > 7 jours actif
  projectName?: string;            // Nom du projet si assignée
}
```

---

## Composants UI détaillés

### InsightsCards

4 cartes en grille responsive (2x2 ou 4x1) :
- Icône + valeur principale + label + tendance (flèche haut/bas)
- Couleur selon criticité (zombies = rouge, vélocité+ = vert)
- Clic sur "Zombies" filtre la table

### CreationHeatmap

Inspiré de `HabitCalendarHeatmap` existant :
- 5 semaines x 7 jours
- Dégradé de couleur selon nombre de créations
- Tooltip avec date + détail

### TasksTable

Composant table avec :
- Header avec tri (icône flèche)
- Corps scrollable virtualisé (si > 50 items)
- Ligne avec toutes les métadonnées
- Actions au hover (icônes)
- Checkbox pour sélection multiple

### ActivityTimeline

Liste verticale avec :
- Icône d'action (création, complétion, suppression)
- Description de l'action
- Horodatage relatif
- Limite à 20 items avec "Voir plus"

---

## Valeur ajoutée par rapport aux autres vues

| Aspect | Sidebar | Observatory |
|--------|---------|-------------|
| Liste des tâches | Simple | Enrichie avec métadonnées |
| Ancienneté | Non visible | Colonne "Âge" |
| Zombies | Non identifiées | Alertées + filtrables |
| Tendances | Aucune | Graphiques de vélocité |
| Patterns | Invisibles | Heatmap de création |
| Actions groupées | Non | Sélection multiple |
| Recherche | Basique | Avancée multi-critères |

---

## Étapes d'implémentation

1. **Créer le hook `useObservatoryViewData`**
   - Calcul des insights (zombies, vélocité, ratios)
   - Préparation des données de graphiques
   - Enrichissement des tâches avec métadonnées

2. **Créer les composants de visualisation**
   - `InsightsCards` avec les 4 métriques clés
   - `CreationHeatmap` basé sur le modèle habits
   - `CompletionChart` avec recharts
   - `CategoryDonut` pour la répartition

3. **Créer la table enrichie**
   - `TasksTable` avec tri/filtres/recherche
   - `TaskTableRow` avec toutes les colonnes
   - Système de sélection multiple

4. **Créer la timeline d'activité**
   - `ActivityTimeline` avec les actions récentes

5. **Assembler dans `ObservatoryView`**
   - Layout responsive avec sections
   - Onglets pour filtrer la table
   - Intégration des composants

6. **Mettre à jour le routing**
   - Remplacer les anciennes vues dans `viewRegistry`
   - Supprimer les fichiers obsolètes

7. **Ajouter les formatters nécessaires**
   - `formatAge()` pour l'ancienneté

---

## Résultat attendu

- **Vue analytique complète** : insights, graphiques, table enrichie
- **Identification proactive** : tâches zombies mises en avant
- **Visualisation des patterns** : heatmap et tendances
- **Table puissante** : tri, filtres, recherche, actions groupées
- **Valeur unique** : impossible à obtenir depuis la sidebar
