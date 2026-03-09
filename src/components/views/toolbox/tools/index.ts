import { Grid3X3, ListOrdered, Terminal, Timer } from 'lucide-react';
import { ToolDefinition } from './types';
import EisenhowerTool from './eisenhower/EisenhowerTool';
import Rule135Tool from './rule135/Rule135Tool';
import PomodoroTool from './pomodoro/PomodoroTool';
import CommandTerminalTool from './command-terminal/CommandTerminalTool';

// Tool registry - single source of truth for all available tools
export const toolRegistry: ToolDefinition[] = [
  {
    id: 'eisenhower',
    name: 'Matrice Eisenhower',
    description: 'Prioriser par importance et urgence',
    icon: Grid3X3,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    category: 'prioritization',
    component: EisenhowerTool,
    longDescription: "La matrice Eisenhower est un outil de prise de décision qui vous aide à organiser vos tâches selon deux axes : l'urgence et l'importance. En classant vos tâches dans quatre quadrants, vous identifiez rapidement ce qui mérite votre attention immédiate, ce qui peut être planifié, délégué ou simplement éliminé.",
    benefits: [
      "Clarifier vos priorités en quelques minutes",
      "Réduire le stress lié aux tâches urgentes non importantes",
      "Identifier les tâches à déléguer ou éliminer",
      "Vous concentrer sur ce qui compte vraiment"
    ],
    origin: "Attribuée à Dwight D. Eisenhower, 34e président des États-Unis, qui aurait déclaré : « Ce qui est important est rarement urgent et ce qui est urgent est rarement important. »",
    tips: [
      "Commencez par les tâches du quadrant 'Important + Non Urgent'",
      "Limitez le temps passé sur les tâches 'Urgent + Non Important'",
      "Révisez votre matrice chaque matin"
    ],
    learnMoreUrl: "https://fr.wikipedia.org/wiki/Matrice_d%27Eisenhower"
  },
  {
    id: 'rule135',
    name: 'Méthode 1-3-5',
    description: 'Planifier 9 tâches par jour',
    icon: ListOrdered,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    category: 'planning',
    isNew: true,
    component: Rule135Tool,
    longDescription: "La méthode 1-3-5 est une technique de planification quotidienne simple mais efficace. Chaque jour, vous choisissez 1 tâche majeure, 3 tâches moyennes et 5 petites tâches. Ce cadre vous aide à définir des attentes réalistes et à ressentir un sentiment d'accomplissement en fin de journée.",
    benefits: [
      "Éviter la surcharge de travail quotidienne",
      "Équilibrer les tâches lourdes et légères",
      "Terminer chaque journée avec un sentiment de progrès",
      "Structure claire sans rigidité excessive"
    ],
    origin: "Popularisée par The Muse, cette méthode s'inspire des principes de la « liste de priorités limitées » pour éviter l'épuisement.",
    tips: [
      "Choisissez votre tâche 'Big' en premier chaque matin",
      "Les petites tâches peuvent servir de pauses entre les moyennes",
      "Si vous ne finissez pas tout, ce n'est pas grave — l'important est d'avoir avancé sur le 'Big'"
    ],
    learnMoreUrl: "https://www.themuse.com/advice/a-better-todo-list-the-135-rule"
  },
  {
    id: 'command-terminal',
    name: 'Terminal objets',
    description: 'Créer en masse via commandes',
    icon: Terminal,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    category: 'planning',
    isNew: true,
    component: CommandTerminalTool,
    longDescription: "Le terminal objets permet de créer rapidement des tâches, projets et habitudes à l'aide d'un petit langage de commandes. Il est pensé comme une base d'automatisation locale, utile pour saisir plusieurs objets d'un coup ou préparer plus tard des flux pilotés par IA.",
    benefits: [
      "Créer plusieurs objets en quelques lignes",
      "Réutiliser des scripts pour des routines fréquentes",
      "Standardiser la création rapide d'objets",
      "Préparer une future automatisation IA fiable"
    ],
    tips: [
      "Commencez par des scripts courts avant de créer en masse",
      "Utilisez les commentaires # pour documenter vos scripts",
      "Réutilisez un même modèle de lignes pour les routines récurrentes"
    ],
  },
  {
    id: 'pomodoro',
    name: 'Pomodoro',
    description: 'Timer focus par cycles de 25 min',
    icon: Timer,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    category: 'focus',
    isNew: true,
    component: PomodoroTool,
    longDescription: "La technique Pomodoro est une méthode de gestion du temps qui alterne des sessions de travail concentré de 25 minutes (« pomodori ») avec des pauses courtes de 5 minutes. Après quatre sessions, vous prenez une pause longue de 15 à 30 minutes. Ce rythme maintient votre concentration tout en prévenant l'épuisement mental.",
    benefits: [
      "Maintenir une concentration profonde sans fatigue",
      "Réduire la procrastination grâce à des sessions courtes",
      "Mesurer objectivement votre temps de travail effectif",
      "Prévenir l'épuisement avec des pauses régulières"
    ],
    origin: "Inventée par Francesco Cirillo à la fin des années 1980, cette technique tire son nom du minuteur de cuisine en forme de tomate (« pomodoro » en italien) qu'il utilisait pendant ses études.",
    tips: [
      "Pendant un focus, ignorez toute distraction — notez-la pour plus tard",
      "Utilisez les pauses pour bouger, pas pour scroller",
      "Liez une tâche à votre session pour rester centré sur un objectif"
    ],
    learnMoreUrl: "https://fr.wikipedia.org/wiki/Technique_Pomodoro"
  }
];

// Helper to get a tool by ID
export const getToolById = (id: string): ToolDefinition | undefined => {
  return toolRegistry.find(tool => tool.id === id);
};

// Helper to get tools by category
export const getToolsByCategory = (category: string): ToolDefinition[] => {
  return toolRegistry.filter(tool => tool.category === category);
};

// Export types
export * from './types';
