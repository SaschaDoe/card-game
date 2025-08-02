// Card Validator Tests

import { describe, it, expect, beforeEach } from 'vitest';
import { CardValidator } from './card-validator.js';
import { UniversalCard, CardCollection, CardProperty } from './types.js';
import { GameType } from '../parser/types.js';

describe('Card Validator', () => {
  let validator: CardValidator;

  beforeEach(() => {
    validator = new CardValidator();
  });

  it('validates basic card properties', () => {
    const validCard: UniversalCard = {
      id: 'test_card_001',
      name: 'Test Card',
      description: 'A test card',
      gameType: GameType.TCG,
      cardType: 'creature',
      properties: [],
      metadata: {
        gameType: GameType.TCG,
        source: 'test',
        parseDate: new Date()
      }
    };

    const result = validator.validateCard(validCard);

    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('detects missing required properties', () => {
    const invalidCard: UniversalCard = {
      id: '',
      name: '',
      gameType: '',
      cardType: '',
      properties: [],
      metadata: {
        gameType: '',
        source: '',
        parseDate: new Date()
      }
    };

    const result = validator.validateCard(invalidCard);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.includes('ID'))).toBe(true);
    expect(result.errors.some(e => e.includes('name'))).toBe(true);
  });

  it('validates TCG creature cards', () => {
    const tcgCard: UniversalCard = {
      id: 'tcg_creature_001',
      name: 'Lightning Dragon',
      gameType: GameType.TCG,
      cardType: 'creature',
      properties: [
        { name: 'power', value: 5, type: 'number', gameSpecific: false },
        { name: 'toughness', value: 4, type: 'number', gameSpecific: false }
      ],
      costs: { mana: 4 },
      stats: { power: 5, toughness: 4 },
      metadata: {
        gameType: GameType.TCG,
        source: 'test',
        parseDate: new Date()
      }
    };

    const result = validator.validateCard(tcgCard, GameType.TCG);

    expect(result.isValid).toBe(true);
    expect(result.warnings.length).toBeLessThanOrEqual(1); // May warn about abilities
  });

  it('detects missing creature stats', () => {
    const incompleteCreature: UniversalCard = {
      id: 'incomplete_creature',
      name: 'Incomplete Creature',
      gameType: GameType.TCG,
      cardType: 'creature',
      properties: [],
      metadata: {
        gameType: GameType.TCG,
        source: 'test',
        parseDate: new Date()
      }
    };

    const result = validator.validateCard(incompleteCreature, GameType.TCG);

    expect(result.missingRequiredProperties).toContain('power');
    expect(result.missingRequiredProperties).toContain('toughness');
    expect(result.warnings.some(w => w.includes('power'))).toBe(true);
    expect(result.warnings.some(w => w.includes('toughness'))).toBe(true);
  });

  it('validates poker cards', () => {
    const pokerCard: UniversalCard = {
      id: 'poker_ace_spades',
      name: 'Ace of Spades',
      gameType: GameType.POKER,
      cardType: 'playing_card',
      properties: [
        { name: 'suit', value: 'spades', type: 'enum', gameSpecific: true },
        { name: 'rank', value: 'A', type: 'enum', gameSpecific: true }
      ],
      metadata: {
        gameType: GameType.POKER,
        source: 'test',
        parseDate: new Date()
      }
    };

    const result = validator.validateCard(pokerCard, GameType.POKER);

    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('detects invalid poker card properties', () => {
    const invalidPokerCard: UniversalCard = {
      id: 'invalid_poker',
      name: 'Invalid Card',
      gameType: GameType.POKER,
      cardType: 'playing_card',
      properties: [
        { name: 'suit', value: 'invalid_suit', type: 'enum', gameSpecific: true },
        { name: 'rank', value: 'Z', type: 'enum', gameSpecific: true }
      ],
      metadata: {
        gameType: GameType.POKER,
        source: 'test',
        parseDate: new Date()
      }
    };

    const result = validator.validateCard(invalidPokerCard, GameType.POKER);

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Invalid suit'))).toBe(true);
    expect(result.errors.some(e => e.includes('Invalid rank'))).toBe(true);
  });

  it('validates deck-building cards', () => {
    const deckBuilderCard: UniversalCard = {
      id: 'deck_builder_card',
      name: 'Village Market',
      gameType: GameType.DECKBUILDER,
      cardType: 'action',
      properties: [
        { name: 'cost', value: 3, type: 'number', gameSpecific: false },
        { name: 'coinValue', value: 2, type: 'number', gameSpecific: true }
      ],
      costs: { gold: 3 },
      abilities: [
        {
          name: 'Coin Generation',
          description: '+2 Coins',
          timing: 'immediate'
        }
      ],
      metadata: {
        gameType: GameType.DECKBUILDER,
        source: 'test',
        parseDate: new Date()
      }
    };

    const result = validator.validateCard(deckBuilderCard, GameType.DECKBUILDER);

    expect(result.isValid).toBe(true);
  });

  it('validates ability timing', () => {
    const cardWithAbilities: UniversalCard = {
      id: 'ability_card',
      name: 'Ability Card',
      gameType: GameType.TCG,
      cardType: 'creature',
      properties: [],
      abilities: [
        {
          name: 'Triggered Ability',
          description: 'When this enters the battlefield, draw a card',
          timing: 'static' // Incorrect timing
        }
      ],
      metadata: {
        gameType: GameType.TCG,
        source: 'test',
        parseDate: new Date()
      }
    };

    const result = validator.validateCard(cardWithAbilities);

    expect(result.suggestions.some(s => s.includes('triggered'))).toBe(true);
  });

  it('detects negative stats', () => {
    const cardWithNegativeStats: UniversalCard = {
      id: 'negative_stats',
      name: 'Negative Card',
      gameType: GameType.TCG,
      cardType: 'creature',
      properties: [],
      stats: { power: -1, toughness: 2 },
      metadata: {
        gameType: GameType.TCG,
        source: 'test',
        parseDate: new Date()
      }
    };

    const result = validator.validateCard(cardWithNegativeStats);

    expect(result.warnings.some(w => w.includes('negative'))).toBe(true);
  });

  it('validates card collections', () => {
    const collection: CardCollection = {
      id: 'test_collection',
      name: 'Test Collection',
      gameType: GameType.TCG,
      cards: [
        {
          id: 'card_1',
          name: 'Card 1',
          gameType: GameType.TCG,
          cardType: 'creature',
          properties: [],
          metadata: {
            gameType: GameType.TCG,
            source: 'test',
            parseDate: new Date()
          }
        }
      ],
      metadata: {
        totalCards: 1,
        createdDate: new Date(),
        lastModified: new Date()
      }
    };

    const result = validator.validateCollection(collection);

    expect(result.isValid).toBe(true);
    expect(result.cardValidations['card_1']).toBeDefined();
  });

  it('detects duplicate card IDs in collection', () => {
    const collection: CardCollection = {
      id: 'duplicate_collection',
      name: 'Duplicate Collection',
      gameType: GameType.TCG,
      cards: [
        {
          id: 'duplicate_id',
          name: 'Card 1',
          gameType: GameType.TCG,
          cardType: 'creature',
          properties: [],
          metadata: { gameType: GameType.TCG, source: 'test', parseDate: new Date() }
        },
        {
          id: 'duplicate_id', // Same ID
          name: 'Card 2',
          gameType: GameType.TCG,
          cardType: 'spell',
          properties: [],
          metadata: { gameType: GameType.TCG, source: 'test', parseDate: new Date() }
        }
      ],
      metadata: {
        totalCards: 2,
        createdDate: new Date(),
        lastModified: new Date()
      }
    };

    const result = validator.validateCollection(collection);

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Duplicate card IDs'))).toBe(true);
  });

  it('validates empty collection', () => {
    const emptyCollection: CardCollection = {
      id: 'empty_collection',
      name: 'Empty Collection',
      gameType: GameType.TCG,
      cards: [],
      metadata: {
        totalCards: 0,
        createdDate: new Date(),
        lastModified: new Date()
      }
    };

    const result = validator.validateCollection(emptyCollection);

    expect(result.isValid).toBe(true);
    expect(result.warnings.some(w => w.includes('no cards'))).toBe(true);
  });

  it('detects inconsistent property values', () => {
    const inconsistentCard: UniversalCard = {
      id: 'inconsistent_card',
      name: 'Inconsistent Card',
      gameType: GameType.TCG,
      cardType: 'creature',
      properties: [
        { name: 'power', value: 3, type: 'number', gameSpecific: false }
      ],
      stats: { power: 5 }, // Different value
      metadata: {
        gameType: GameType.TCG,
        source: 'test',
        parseDate: new Date()
      }
    };

    const result = validator.validateCard(inconsistentCard);

    expect(result.warnings.some(w => w.includes('Inconsistent values'))).toBe(true);
  });

  it('validates collection size for different game types', () => {
    const smallTCGCollection: CardCollection = {
      id: 'small_tcg',
      name: 'Small TCG Collection',
      gameType: GameType.TCG,
      cards: new Array(30).fill(null).map((_, i) => ({
        id: `card_${i}`,
        name: `Card ${i}`,
        gameType: GameType.TCG,
        cardType: 'creature',
        properties: [],
        metadata: { gameType: GameType.TCG, source: 'test', parseDate: new Date() }
      })),
      metadata: {
        totalCards: 30,
        createdDate: new Date(),
        lastModified: new Date()
      }
    };

    const result = validator.validateCollection(smallTCGCollection);

    expect(result.warnings.some(w => w.includes('small for constructed'))).toBe(true);
  });
});