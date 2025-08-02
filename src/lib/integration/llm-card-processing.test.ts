// Integration tests for LLM-based card processing with Risk & Resource v1 cards

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UniversalCardParser } from '../cards/card-parser.js';
import { UniversalRuleParser } from '../parser/parser.js';
import { LLMClient } from '../llm/client.js';
import { GameType } from '../parser/types.js';

describe('LLM Card Processing Integration', () => {
  let cardParser: UniversalCardParser;
  let ruleParser: UniversalRuleParser;
  let mockLLMClient: LLMClient;

  beforeEach(() => {
    // Create mock LLM client that simulates real responses
    mockLLMClient = {
      call: vi.fn().mockImplementation(async (request) => {
        // Simulate different responses based on the prompt content
        if (request.prompt.includes('Lightning Dragon')) {
          return {
            content: `GAME_TYPE: tcg
CONFIDENCE: 0.9
REASONING: This is clearly a TCG creature card with mana cost, power/toughness stats, and abilities.`,
            usage: { promptTokens: 50, completionTokens: 30, totalTokens: 80 }
          };
        } else if (request.prompt.includes('Energy Burst')) {
          return {
            content: `GAME_TYPE: tcg
CONFIDENCE: 0.85
REASONING: This is a TCG spell card with mana cost and instant effect.`,
            usage: { promptTokens: 45, completionTokens: 25, totalTokens: 70 }
          };
        } else if (request.prompt.includes('Turn Structure')) {
          return {
            content: `PHASE: Draw - Draw a card from your deck - required - draw
PHASE: Main - Play cards and activate abilities - optional - play,activate
PHASE: Combat - Attack with creatures - optional - attack,block
PHASE: End - End your turn and cleanup - required - cleanup`,
            usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 }
          };
        } else {
          return {
            content: 'GAME_TYPE: custom\nCONFIDENCE: 0.5\nREASONING: Unable to classify clearly.',
            usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 }
          };
        }
      })
    } as any;

    cardParser = new UniversalCardParser(mockLLMClient);
    ruleParser = new UniversalRuleParser(mockLLMClient);
  });

  it('processes Risk & Resource v1 creature cards in batches', async () => {
    const riskResourceCreatureCards = [
      `Lightning Dragon
Creature - Dragon
Cost: 4 Energy Points
Power: 5
Defense: 4
Ability: Flying, Haste
When Lightning Dragon enters the battlefield, deal 2 damage to any target.
Pitch Value: 2 EP`,

      `Steel Guardian
Creature - Construct
Cost: 3 Energy Points  
Power: 2
Defense: 6
Ability: Defender
Steel Guardian can block any number of attacking creatures.
Pitch Value: 1 EP`,

      `Shadow Assassin
Creature - Human Rogue
Cost: 2 Energy Points
Power: 3
Defense: 1
Ability: Stealth
When Shadow Assassin deals combat damage to a player, that player discards a card.
Pitch Value: 1 EP`
    ];

    const results = await cardParser.parseMultipleCards(riskResourceCreatureCards, { 
      gameType: GameType.TCG,
      source: 'risk_resource_v1'
    });

    expect(results).toHaveLength(3);
    expect(results.every(r => r.success)).toBe(true);

    // Verify Lightning Dragon parsing
    const lightningDragon = results[0].card!;
    expect(lightningDragon.name).toBe('Lightning Dragon');
    expect(lightningDragon.cardType).toBe('creature');
    expect(lightningDragon.gameType).toBe(GameType.TCG);

    // Check extracted properties
    const powerProp = lightningDragon.properties.find(p => p.name === 'power');
    expect(powerProp?.value).toBe(5);
    
    const defenseStats = lightningDragon.stats?.toughness || lightningDragon.stats?.defense;
    expect(defenseStats).toBeDefined();

    // Check abilities extraction
    expect(lightningDragon.abilities).toBeDefined();
    expect(lightningDragon.abilities!.length).toBeGreaterThan(0);

    // Check keywords
    expect(lightningDragon.keywords).toContain('flying');

    // Verify costs are extracted
    expect(lightningDragon.costs).toBeDefined();
    expect(Object.keys(lightningDragon.costs!).length).toBeGreaterThan(0);
  });

  it('processes Risk & Resource v1 spell cards', async () => {
    const riskResourceSpellCards = [
      `Energy Burst
Spell - Instant
Cost: 1 Energy Point
Effect: Deal 2 damage to any target. Draw a card.
Pitch Value: 1 EP`,

      `Strategic Planning
Spell - Sorcery  
Cost: 2 Energy Points
Effect: Look at the top 4 cards of your deck. Put 2 into your hand and the rest on the bottom of your deck.
Pitch Value: 1 EP`,

      `Overwhelming Force
Spell - Sorcery
Cost: 5 Energy Points
Effect: Destroy all creatures with defense 3 or less.
Pitch Value: 2 EP`
    ];

    const results = await cardParser.parseMultipleCards(riskResourceSpellCards, {
      gameType: GameType.TCG,
      source: 'risk_resource_v1'
    });

    expect(results).toHaveLength(3);
    expect(results.every(r => r.success)).toBe(true);

    // Verify Energy Burst parsing
    const energyBurst = results[0].card!;
    expect(energyBurst.name).toBe('Energy Burst');
    expect(energyBurst.cardType.toLowerCase()).toContain('spell');
    
    // Check that spell cards have effects/abilities
    expect(energyBurst.abilities || energyBurst.description).toBeDefined();
    
    // Check costs are extracted
    expect(energyBurst.costs).toBeDefined();
  });

  it('processes Risk & Resource v1 artifact cards', async () => {
    const riskResourceArtifactCards = [
      `Crystal Core
Artifact - Equipment
Cost: 3 Energy Points
Effect: Equipped creature gets +2/+2 and has "Tap: Add 1 EP to your pool"
Equip Cost: 1 EP
Pitch Value: 1 EP`,

      `War Machine
Artifact - Vehicle
Cost: 6 Energy Points
Power: 7
Defense: 7
Effect: War Machine can't attack unless you control 3 or more creatures.
Crew Cost: 4 EP
Pitch Value: 2 EP`
    ];

    const results = await cardParser.parseMultipleCards(riskResourceArtifactCards, {
      gameType: GameType.TCG,
      source: 'risk_resource_v1'
    });

    expect(results).toHaveLength(2);
    expect(results.every(r => r.success)).toBe(true);

    const crystalCore = results[0].card!;
    expect(crystalCore.name).toBe('Crystal Core');
    expect(crystalCore.cardType.toLowerCase()).toContain('artifact');
  });

  it('processes Risk & Resource v1 game rules and extracts structure', async () => {
    const riskResourceRules = `# Risk & Resource Card Game Rules

## Game Setup
**Players:** 2-4 players
**Starting Life:** Each player starts with 20 life points
**Starting Hand:** Each player draws 7 cards
**Energy Points:** Each player starts with 3 Energy Points (EP)

## Turn Structure
1. **Draw Phase:** Draw one card from your deck
2. **Main Phase:** Play cards, activate abilities, and attack
3. **End Phase:** Discard down to 7 cards, reset EP

## Energy System
- Cards can be "pitched" (discarded) for Energy Points equal to their pitch value
- Energy Points are used to play cards from your hand
- Unused EP carries over to next turn (max 10 EP)

## Combat
- Creatures can attack players or other creatures
- Attacking creature deals damage equal to its power
- Defending creature/player takes damage equal to attacker's power
- If creatures fight, both deal damage simultaneously

## Win Conditions
- Reduce opponent's life to 0 or less
- Control specific "Victory Condition" cards and meet their requirements
- Opponent runs out of cards to draw

## Card Types
### Creatures
- Have Power (attack) and Defense (health)
- Can attack and block
- Stay in play until destroyed

### Spells
- One-time effects when played
- Go to discard pile after use
- Can be Instant (play anytime) or Sorcery (main phase only)

### Artifacts
- Permanent effects that stay in play
- Can be Equipment, Vehicles, or other types
- Some have activated abilities`;

    const result = await ruleParser.parseRules(riskResourceRules, {
      title: 'Risk & Resource',
      source: 'risk_resource_v1'
    });

    expect(result.title).toBe('Risk & Resource');
    expect(result.gameType).toBe(GameType.TCG);
    expect(result.confidence).toBeGreaterThan(0.7);

    // Check extracted rule components
    expect(result.extractedRules.gameSetup.playerCount.min).toBe(2);
    expect(result.extractedRules.gameSetup.playerCount.max).toBe(4);
    expect(result.extractedRules.gameSetup.startingHandSize).toBe(7);

    // Check turn structure was extracted
    expect(result.extractedRules.turnStructure.length).toBeGreaterThan(0);

    // Check win conditions
    expect(result.extractedRules.winConditions.length).toBeGreaterThan(0);

    // Check that it correctly identifies TCG-specific rules
    expect(result.extractedRules.combatRules).toBeDefined();
    expect(result.extractedRules.resourceSystems).toBeDefined();
  });

  it('generates UI recommendations for card display', async () => {
    const cardForUIAnalysis = `Lightning Dragon
Creature - Dragon
Cost: 4 Energy Points
Power: 5
Defense: 4
Ability: Flying, Haste
When Lightning Dragon enters the battlefield, deal 2 damage to any target.
Pitch Value: 2 EP`;

    const result = await cardParser.parseCard(cardForUIAnalysis, {
      gameType: GameType.TCG,
      source: 'ui_analysis'
    });

    expect(result.success).toBe(true);

    // Verify the card was parsed correctly for UI purposes
    expect(result.card!.name).toBe('Lightning Dragon');
    expect(result.card!.cardType).toBe('creature');
    
    // Check that UI-relevant properties are extracted
    expect(result.card!.properties.some(p => p.name === 'power')).toBe(true);
    expect(result.card!.costs).toBeDefined();
    expect(result.card!.abilities).toBeDefined();
    
    // Verify card has all necessary UI information
    expect(result.card!.keywords).toContain('flying');
    expect(result.card!.stats?.power || result.card!.properties.find(p => p.name === 'power')).toBeTruthy();
  });

  it('handles batch processing with rate limiting simulation', async () => {
    // Simulate processing a large batch of cards with rate limiting
    const largeBatch = Array.from({ length: 10 }, (_, i) => `
      Test Card ${i + 1}
      Creature - Test
      Cost: ${i + 1} Energy Points
      Power: ${i + 1}
      Defense: ${i + 1}
      Ability: Test ability ${i + 1}
    `);

    // Add delay simulation to mock LLM client
    mockLLMClient.call = vi.fn().mockImplementation(async (request) => {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 10));
      return {
        content: 'GAME_TYPE: tcg\nCONFIDENCE: 0.8\nREASONING: Test card',
        usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 }
      };
    });

    const startTime = Date.now();
    const results = await cardParser.parseMultipleCards(largeBatch, {
      gameType: GameType.TCG
    });
    const endTime = Date.now();

    expect(results).toHaveLength(10);
    expect(results.every(r => r.success)).toBe(true);
    
    // Verify each card was processed correctly
    results.forEach((result, index) => {
      expect(result.card!.name).toBe(`Test Card ${index + 1}`);
      expect(result.card!.cardType).toBe('creature');
    });

    // Ensure batch processing completed in reasonable time
    expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
  });

  it('processes mixed card types from Risk & Resource deck', async () => {
    const mixedDeck = [
      `Fire Elemental
Creature - Elemental
Cost: 3 EP
Power: 4, Defense: 2
Ability: Haste
Pitch Value: 1 EP`,

      `Lightning Bolt
Spell - Instant
Cost: 1 EP
Effect: Deal 3 damage to any target
Pitch Value: 1 EP`,

      `Mana Crystal
Artifact - Resource
Cost: 2 EP
Effect: Tap: Add 1 EP to your pool
Pitch Value: 1 EP`,

      `Victory Monument
Artifact - Victory Condition
Cost: 8 EP
Effect: If you control 5 or more artifacts, you win the game
Pitch Value: 3 EP`
    ];

    const results = await cardParser.parseMultipleCards(mixedDeck, {
      gameType: GameType.TCG,
      source: 'risk_resource_v1_deck'
    });

    expect(results).toHaveLength(4);
    expect(results.every(r => r.success)).toBe(true);

    // Verify different card types were identified correctly
    const cardTypes = results.map(r => r.card!.cardType.toLowerCase());
    expect(cardTypes).toContain('creature');
    expect(cardTypes.some(type => type.includes('spell') || type.includes('instant'))).toBe(true);
    expect(cardTypes.some(type => type.includes('artifact'))).toBe(true);

    // Verify all cards have required properties
    results.forEach(result => {
      expect(result.card!.name).toBeTruthy();
      expect(result.card!.gameType).toBe(GameType.TCG);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  it('validates processed cards meet game requirements', async () => {
    const cardToValidate = `Balanced Creature
Creature - Beast
Cost: 3 Energy Points
Power: 3
Defense: 3
Ability: When Balanced Creature enters the battlefield, gain 1 life
Pitch Value: 1 EP`;

    const result = await cardParser.parseCard(cardToValidate, {
      gameType: GameType.TCG
    });

    expect(result.success).toBe(true);
    
    // Verify card has all required TCG elements
    expect(result.card!.costs).toBeDefined();
    expect(result.card!.stats?.power || result.card!.properties.some(p => p.name === 'power')).toBeTruthy();
    expect(result.card!.stats?.toughness || result.card!.stats?.defense || result.card!.properties.some(p => p.name === 'defense')).toBeTruthy();
    expect(result.card!.abilities).toBeDefined();
    
    // Verify metadata is complete
    expect(result.card!.metadata.source).toBe('text_parsing');
    expect(result.card!.metadata.parseDate).toBeInstanceOf(Date);
    expect(result.originalText).toBe(cardToValidate);
  });
});