/**
 * Deck Types - Extends BaseItem for deck-specific properties
 */
import { BaseItem, ItemCategory, ItemContext } from './item';

// Interface Deck étendant BaseItem
export interface Deck extends BaseItem {
  description?: string;
  icon?: string;
  color: string;
  isDefault: boolean;
  order: number;
}

// Type pour la création d'un deck
export interface DeckInput {
  name: string;
  category: ItemCategory;
  context: ItemContext;
  estimatedTime: number;
  description?: string;
  icon?: string;
  color?: string;
  isDefault?: boolean;
}
