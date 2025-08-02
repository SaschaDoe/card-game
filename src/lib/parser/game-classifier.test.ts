// Game Classifier Tests

import { describe, it, expect, beforeEach } from 'vitest';
import { GameTypeClassifier } from './game-classifier.js';
import { GameType } from './types.js';

describe('Game Type Classifier', () => {
  let classifier: GameTypeClassifier;

  beforeEach(() => {
    classifier = new GameTypeClassifier();
  });

  it('classifies poker games correctly', async () => {
    const pokerRules = `
      Texas Hold'em Poker Rules
      
      Players: 2-10
      Each player gets 2 hole cards face down.
      5 community cards are dealt: flop (3), turn (1), river (1).
      Players make bets in rounds.
      Best 5-card hand wins the pot.
      Betting options: fold, call, raise, all-in.
    `;

    const result = await classifier.classifyGame(pokerRules, 'Texas Hold\'em');
    
    expect(result.gameType).toBe(GameType.POKER);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('classifies TCG games correctly', async () => {
    const tcgRules = `
      Magic-style Card Game
      
      Players start with 20 life.
      Draw a card each turn.
      Play lands to generate mana.
      Cast creatures and spells using mana.
      Creatures can attack and block.
      Reduce opponent's life to 0 to win.
      Cards go to graveyard when destroyed.
    `;

    const result = await classifier.classifyGame(tcgRules, 'Magic Clone');
    
    expect(result.gameType).toBe(GameType.TCG);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('classifies deck-building games correctly', async () => {
    const deckbuilderRules = `
      Dominion-style Game
      
      Players: 2-4
      Start with basic deck of copper and estates.
      Buy cards from the supply using coins.
      Victory points determined by victory cards.
      Game ends when 3 supply piles are empty.
      Trash bad cards to improve deck.
    `;

    const result = await classifier.classifyGame(deckbuilderRules, 'Deck Builder');
    
    expect(result.gameType).toBe(GameType.DECKBUILDER);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('classifies trick-taking games correctly', async () => {
    const trickRules = `
      Hearts Card Game
      
      Players: 4
      Deal 13 cards to each player.
      Players must follow suit if possible.
      Highest card of led suit wins the trick.
      Hearts are worth 1 point each.
      Queen of Spades is worth 13 points.
      Lowest score wins.
    `;

    const result = await classifier.classifyGame(trickRules, 'Hearts');
    
    expect(result.gameType).toBe(GameType.TRICK_TAKING);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('returns custom for unrecognized games', async () => {
    const unknownRules = `
      This is a completely made up game with no recognizable patterns.
      Players do mysterious things with objects.
      Something happens and someone wins somehow.
    `;

    const result = await classifier.classifyGame(unknownRules);
    
    expect(result.gameType).toBe(GameType.CUSTOM);
    expect(result.confidence).toBeLessThan(0.5);
  });

  it('handles empty input gracefully', async () => {
    const result = await classifier.classifyGame('');
    
    expect(result.gameType).toBe(GameType.CUSTOM);
    expect(result.confidence).toBeLessThan(0.3);
  });

  it('provides game type templates', () => {
    const pokerTemplate = classifier.getGameTypeTemplate(GameType.POKER);
    
    expect(pokerTemplate).toBeDefined();
    expect(pokerTemplate?.gameType).toBe(GameType.POKER);
    expect(pokerTemplate?.patterns).toContain('poker');
    expect(pokerTemplate?.requiredElements).toContain('betting');
  });

  it('lists all supported game types', () => {
    const gameTypes = classifier.getAllGameTypes();
    
    expect(gameTypes).toContain(GameType.POKER);
    expect(gameTypes).toContain(GameType.TCG);
    expect(gameTypes).toContain(GameType.DECKBUILDER);
    expect(gameTypes).toContain(GameType.TRICK_TAKING);
    expect(gameTypes.length).toBeGreaterThan(3);
  });

  it('handles mixed game elements', async () => {
    const mixedRules = `
      Hybrid Game
      
      Players build decks by buying cards (like Dominion).
      Then they play a TCG-style battle using those decks.
      Creatures attack and block.
      Players also collect victory points.
    `;

    const result = await classifier.classifyGame(mixedRules);
    
    // Should classify as one of the recognized types
    expect([GameType.DECKBUILDER, GameType.TCG]).toContain(result.gameType);
    expect(result.confidence).toBeGreaterThan(0.3);
  });
});