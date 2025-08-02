// Universal card system types

export interface BaseCard {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  metadata: CardMetadata;
}

export interface CardMetadata {
  gameType: string;
  source: string;
  parseDate: Date;
  originalText?: string;
  llmProvider?: string;
  warnings?: string[];
}

// Card properties that can exist across different game types
export interface CardProperty {
  name: string;
  value: string | number | boolean;
  type: 'string' | 'number' | 'boolean' | 'enum';
  gameSpecific: boolean;
}

// Poker-specific card interface
export interface PokerCard extends BaseCard {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
  value: number; // Numeric value for comparison
}

// TCG-specific card interface
export interface TCGCard extends BaseCard {
  cost?: number | string; // Mana cost, energy points, etc.
  cardType: 'creature' | 'spell' | 'artifact' | 'land' | 'enchantment' | 'planeswalker' | 'other';
  subtypes?: string[];
  
  // Combat stats (for creatures)
  power?: number;
  toughness?: number;
  defense?: number;
  
  // Abilities
  abilities?: Ability[];
  keywords?: string[];
  
  // Resource generation
  resourceGeneration?: ResourceGeneration[];
  
  // Rarity and set info
  rarity?: 'common' | 'uncommon' | 'rare' | 'mythic' | 'legendary';
  setCode?: string;
}

export interface Ability {
  name: string;
  description: string;
  cost?: string;
  timing: 'activated' | 'triggered' | 'static' | 'mana' | 'instant' | 'sorcery';
  conditions?: string[];
}

export interface ResourceGeneration {
  type: string; // 'mana', 'energy', 'gold', etc.
  amount: number;
  color?: string; // For colored mana systems
}

// Deck-building game cards
export interface DeckBuilderCard extends BaseCard {
  cost: number;
  cardType: 'action' | 'victory' | 'treasure' | 'curse' | 'reaction' | 'attack' | 'other';
  victoryPoints?: number;
  coinValue?: number;
  effects?: CardEffect[];
  duration?: 'immediate' | 'ongoing' | 'next_turn';
}

export interface CardEffect {
  type: 'draw' | 'gain' | 'trash' | 'attack' | 'defend' | 'modify' | 'other';
  description: string;
  target?: 'self' | 'opponent' | 'all' | 'choice';
  magnitude?: number;
}

// Universal card that can represent any type
export interface UniversalCard extends BaseCard {
  gameType: string;
  cardType: string;
  properties: CardProperty[];
  
  // Flexible stats system
  stats?: { [key: string]: number | string | boolean };
  
  // Flexible abilities system
  abilities?: Ability[];
  
  // Cost system (flexible for different games)
  costs?: { [resourceType: string]: number | string };
  
  // Tags for categorization
  tags?: string[];
  keywords?: string[];
}

// Card parsing result
export interface CardParseResult {
  success: boolean;
  card?: UniversalCard;
  confidence: number;
  errors?: string[];
  warnings?: string[];
  originalText: string;
  gameType: string;
  extractedProperties: CardProperty[];
}

// Card collection/deck representation
export interface CardCollection {
  id: string;
  name: string;
  gameType: string;
  cards: UniversalCard[];
  metadata: {
    totalCards: number;
    createdDate: Date;
    lastModified: Date;
    description?: string;
    format?: string; // Tournament format, etc.
  };
}

// Card parsing options
export interface CardParseOptions {
  gameType?: string;
  expectedCardType?: string;
  source?: string;
  strictParsing?: boolean;
  includeImages?: boolean;
  customProperties?: CardProperty[];
}

// Card validation result
export interface CardValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  missingRequiredProperties: string[];
}