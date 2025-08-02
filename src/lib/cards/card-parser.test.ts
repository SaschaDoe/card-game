// Universal Card Parser Tests

import { describe, it, expect, beforeEach } from 'vitest';
import { UniversalCardParser } from './card-parser.js';
import { GameType } from '../parser/types.js';

describe('Universal Card Parser', () => {
  let parser: UniversalCardParser;

  beforeEach(() => {
    parser = new UniversalCardParser();
  });

  it('parses TCG creature card correctly', async () => {
    const cardText = `
      Lightning Dragon
      Creature - Dragon
      Cost: 4 mana
      Power: 5
      Toughness: 4
      Ability: Flying, haste
      Description: When Lightning Dragon enters the battlefield, deal 2 damage to any target.
    `;

    const result = await parser.parseCard(cardText, { gameType: GameType.TCG });

    expect(result.success).toBe(true);
    expect(result.card).toBeDefined();
    expect(result.card!.name).toBe('Lightning Dragon');
    expect(result.card!.cardType).toBe('creature');
    expect(result.card!.gameType).toBe(GameType.TCG);
    expect(result.confidence).toBeGreaterThan(0.5);

    // Check extracted properties
    const powerProp = result.card!.properties.find(p => p.name === 'power');
    expect(powerProp?.value).toBe(5);

    const toughnessProp = result.card!.properties.find(p => p.name === 'toughness');
    expect(toughnessProp?.value).toBe(4);

    // Check abilities
    expect(result.card!.abilities).toBeDefined();
    expect(result.card!.abilities!.length).toBeGreaterThan(0);

    // Check costs
    expect(result.card!.costs).toBeDefined();
    expect(Object.keys(result.card!.costs!).length).toBeGreaterThan(0);
  });

  it('parses deck-building card correctly', async () => {
    const cardText = `
      Village Market
      Action Card
      Cost: 3 gold
      Effect: +1 Buy, +2 Coins
      Description: Gain a card costing up to 4.
    `;

    const result = await parser.parseCard(cardText, { gameType: GameType.DECKBUILDER });

    expect(result.success).toBe(true);
    expect(result.card).toBeDefined();
    expect(result.card!.name).toBe('Village Market');
    expect(result.card!.gameType).toBe(GameType.DECKBUILDER);

    // Check for cost extraction
    expect(result.card!.costs).toBeDefined();
    expect(result.card!.costs!.gold || result.card!.costs!.generic).toBeDefined();
  });

  it('parses poker card correctly', async () => {
    const cardText = `
      Ace of Spades
      Suit: Spades
      Rank: A
      Value: 14
    `;

    const result = await parser.parseCard(cardText, { gameType: GameType.POKER });

    expect(result.success).toBe(true);
    expect(result.card).toBeDefined();
    expect(result.card!.name).toBe('Ace of Spades');
    expect(result.card!.gameType).toBe(GameType.POKER);

    // Check poker-specific properties
    const suitProp = result.card!.properties.find(p => p.name === 'suit');
    expect(suitProp?.value).toBe('spades');

    const rankProp = result.card!.properties.find(p => p.name === 'rank');
    expect(rankProp?.value).toBe('A');
  });

  it('handles simple card descriptions', async () => {
    const cardText = `
      Fire Bolt
      Deal 3 damage to any target.
    `;

    const result = await parser.parseCard(cardText);

    expect(result.success).toBe(true);
    expect(result.card).toBeDefined();
    expect(result.card!.name).toBe('Fire Bolt');
    expect(result.card!.description).toContain('damage');
  });

  it('extracts abilities from card text', async () => {
    const cardText = `
      Mystic Scholar
      Creature - Human Wizard
      When Mystic Scholar enters the battlefield, draw a card.
      Whenever you cast a spell, scry 1.
    `;

    const result = await parser.parseCard(cardText, { gameType: GameType.TCG });

    expect(result.success).toBe(true);
    expect(result.card!.abilities).toBeDefined();
    expect(result.card!.abilities!.length).toBeGreaterThan(0);

    // Check for triggered abilities
    const triggeredAbilities = result.card!.abilities!.filter(a => a.timing === 'triggered');
    expect(triggeredAbilities.length).toBeGreaterThan(0);
  });

  it('parses multiple cards from bulk text', async () => {
    const bulkText = `
      Card 1: Lightning Bolt
      Deal 3 damage to any target.
      
      Card 2: Giant Spider
      Creature - Spider
      Power: 2, Toughness: 4
      Reach
    `;

    const results = await parser.parseBulkText(bulkText, { gameType: GameType.TCG });

    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results.every(r => r.success)).toBe(true);
  });

  it('handles malformed card text gracefully', async () => {
    const cardText = 'Invalid card text with no structure';

    const result = await parser.parseCard(cardText);

    expect(result.success).toBe(true); // Should still succeed with basic parsing
    expect(result.card).toBeDefined();
    expect(result.confidence).toBeLessThan(0.7); // But with low confidence
  });

  it('detects game type automatically', async () => {
    const tcgCardText = `
      Goblin Warrior
      Creature with 2 power and 1 toughness
      Costs 2 mana
    `;

    const result = await parser.parseCard(tcgCardText); // No gameType specified

    expect(result.success).toBe(true);
    expect(result.gameType).toBe(GameType.TCG);
  });

  it('extracts keywords correctly', async () => {
    const cardText = `
      Angel of Victory
      Creature - Angel
      Flying, vigilance, lifelink
      Power: 4, Toughness: 4
    `;

    const result = await parser.parseCard(cardText, { gameType: GameType.TCG });

    expect(result.success).toBe(true);
    expect(result.card!.keywords).toContain('flying');
    expect(result.card!.keywords).toContain('vigilance');
    expect(result.card!.keywords).toContain('lifelink');
  });

  it('extracts costs in different formats', async () => {
    const cardText = `
      Expensive Spell
      Mana Cost: {3}{R}{R}
      Effect: Deal 5 damage
    `;

    const result = await parser.parseCard(cardText, { gameType: GameType.TCG });

    expect(result.success).toBe(true);
    expect(result.card!.costs).toBeDefined();
    expect(Object.keys(result.card!.costs!).length).toBeGreaterThan(0);
  });

  it('validates card metadata', async () => {
    const cardText = `
      Test Card
      A simple test card
    `;

    const result = await parser.parseCard(cardText, { source: 'unit-test' });

    expect(result.success).toBe(true);
    expect(result.card!.metadata).toBeDefined();
    expect(result.card!.metadata.source).toBe('text_parsing');
    expect(result.card!.metadata.parseDate).toBeInstanceOf(Date);
  });

  it('handles empty input gracefully', async () => {
    const result = await parser.parseCard('');

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it('extracts stats correctly', async () => {
    const cardText = `
      Battle Tank
      Artifact Creature - Vehicle
      Power: 6
      Toughness: 8
      Loyalty: 3
    `;

    const result = await parser.parseCard(cardText, { gameType: GameType.TCG });

    expect(result.success).toBe(true);
    expect(result.card!.stats).toBeDefined();
    expect(result.card!.stats!.power).toBe(6);
    expect(result.card!.stats!.toughness).toBe(8);
    expect(result.card!.stats!.loyalty).toBe(3);
  });

  it('preserves original text', async () => {
    const originalText = 'Test card with original text';
    
    const result = await parser.parseCard(originalText);

    expect(result.originalText).toBe(originalText);
  });
});