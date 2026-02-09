import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { Deck } from '@/types/habit';

interface HabitDeckTabsProps {
  decks: Deck[];
  selectedDeckId: string | null;
  onSelectDeck: (deckId: string) => void;
  onManageDecks: () => void;
}

/**
 * Navigation par tabs entre les decks d'habitudes
 * Style similaire aux onglets de la vue Projets
 */
const HabitDeckTabs: React.FC<HabitDeckTabsProps> = ({
  decks,
  selectedDeckId,
  onSelectDeck,
  onManageDecks
}) => {
  if (decks.length === 0) return null;

  return (
    <div className="flex items-center gap-3">
      <Tabs 
        value={selectedDeckId || decks[0]?.id} 
        onValueChange={onSelectDeck}
        className="flex-1"
      >
        <TabsList className="h-auto flex-wrap">
          {decks.map(deck => (
            <TabsTrigger 
              key={deck.id} 
              value={deck.id}
              className="gap-2 data-[state=active]:bg-habit/10 data-[state=active]:text-habit"
            >
              {deck.icon && <span className="text-base">{deck.icon}</span>}
              <span>{deck.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onManageDecks}
        className="text-muted-foreground hover:text-foreground shrink-0"
      >
        <Settings className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default HabitDeckTabs;
