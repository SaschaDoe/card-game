// Universal Rule Parser Tests

import { describe, it, expect, beforeEach } from 'vitest';
import { UniversalRuleParser } from './parser.js';
import { GameType } from './types.js';

describe('Universal Rule Parser', () => {
  let parser: UniversalRuleParser;

  beforeEach(() => {
    parser = new UniversalRuleParser();
  });

  it('parses Risk & Resource rules correctly', async () => {
    const riskResourceRules = `
      # Risk & Resource Card Game
      
      ## Setup
      Players: 2-4
      Each player starts with 7 cards and 3 Energy Points.
      
      ## Turn Structure
      1. Draw Phase: Draw one card
      2. Main Phase: Play cards, activate abilities
      3. End Phase: Discard down to 7 cards
      
      ## Winning
      Victory conditions: Control win condition cards or meet their requirements.
      
      ## Card Types
      - Creatures: Have power and defense, can attack
      - Spells: One-time effects
      - Artifacts: Permanent effects
      
      ## Energy Points (EP)
      Used to play cards. Cards can be pitched for EP equal to pitch value.
    `;

    const result = await parser.parseRules(riskResourceRules, {
      title: 'Risk & Resource',
      source: 'test'
    });

    expect(result.title).toBe('Risk & Resource');
    expect(result.gameType).toBe(GameType.TCG);
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.extractedRules).toBeDefined();
    expect(result.extractedRules.gameSetup.playerCount.min).toBe(2);
    expect(result.extractedRules.gameSetup.playerCount.max).toBe(4);
    expect(result.extractedRules.gameSetup.startingHandSize).toBe(7);
  });

  it('parses poker rules correctly', async () => {
    const pokerRules = `
      # Texas Hold'em Poker
      
      ## Players
      2-10 players
      
      ## Setup
      Deal 2 hole cards to each player face down.
      Post blinds: small blind and big blind.
      
      ## Betting Rounds
      1. Pre-flop: betting after hole cards
      2. Flop: 3 community cards, betting round
      3. Turn: 1 more community card, betting round  
      4. River: final community card, betting round
      
      ## Actions
      Players can: fold, call, raise, all-in
      
      ## Winning
      Best 5-card poker hand wins the pot.
    `;

    const result = await parser.parseRules(pokerRules, {
      title: 'Texas Hold\'em'
    });

    expect(result.gameType).toBe(GameType.POKER);
    expect(result.extractedRules.gameSetup.playerCount.min).toBe(2);
    expect(result.extractedRules.gameSetup.playerCount.max).toBe(10);
    expect(result.extractedRules.actionRules.availableActions.length).toBeGreaterThan(0);
  });

  it('handles multiple input formats', async () => {
    const markdownRules = '# Test Game\nSimple rules here.';
    
    const result = await parser.parseMultipleFormats({
      markdown: markdownRules
    }, { title: 'Multi-format Test' });

    expect(result.title).toBe('Multi-format Test');
    expect(result.metadata.source).toBe('markdown');
  });

  it('validates parsed rules', async () => {
    const simpleRules = `
      # Simple Game
      Players take turns doing actions.
    `;

    const parsed = await parser.parseRules(simpleRules);
    const validation = await parser.validateParsedRules(parsed);

    expect(validation.isValid).toBeDefined();
    expect(Array.isArray(validation.errors)).toBe(true);
    expect(Array.isArray(validation.suggestions)).toBe(true);
  });

  it('handles empty input gracefully', async () => {
    const result = await parser.parseRules('');

    expect(result.gameType).toBe(GameType.CUSTOM);
    expect(result.confidence).toBe(0);
    expect(result.metadata.warnings).toBeDefined();
    expect(result.metadata.warnings!.length).toBeGreaterThan(0);
  });

  it('provides game type information', () => {
    const tcgInfo = parser.getGameTypeInfo(GameType.TCG);
    
    expect(tcgInfo).toBeDefined();
    expect(tcgInfo?.gameType).toBe(GameType.TCG);
  });

  it('lists supported game types', () => {
    const types = parser.getSupportedGameTypes();
    
    expect(types).toContain(GameType.POKER);
    expect(types).toContain(GameType.TCG);
    expect(types).toContain(GameType.DECKBUILDER);
  });

  it('handles JSON input format', async () => {
    const jsonInput = {
      title: 'Test Game',
      rules: 'Players draw cards and play them.',
      description: 'A simple card game'
    };

    const result = await parser.parseMultipleFormats({
      json: jsonInput
    });

    expect(result.metadata.source).toBe('json');
    expect(result.originalText).toContain('draw cards');
  });

  it('preserves original text', async () => {
    const originalRules = 'These are the original rules.';
    
    const result = await parser.parseRules(originalRules);
    
    expect(result.originalText).toBe(originalRules);
  });

  it('includes metadata', async () => {
    const result = await parser.parseRules('Test rules', {
      title: 'Test',
      source: 'unit-test'
    });

    expect(result.metadata.source).toBe('unit-test');
    expect(result.metadata.parseDate).toBeInstanceOf(Date);
    expect(result.metadata.llmProvider).toBeDefined();
  });
});