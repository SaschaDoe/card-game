// AI Player Tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIPlayer, AI_PERSONALITIES, type AIDecisionContext } from './ai-player.js';
import type { LLMClient } from '../llm/client.js';
import type { GameState, GameAction, ActionType } from '../engine/types.js';
import { GameType } from '../parser/types.js';

describe('AI Player', () => {
  let mockLLMClient: LLMClient;
  let aiPlayer: AIPlayer;
  let mockGameState: GameState;
  let mockContext: AIDecisionContext;

  beforeEach(() => {
    // Mock LLM client
    mockLLMClient = {
      call: vi.fn(),
      updateConfiguration: vi.fn(),
      getAvailableProviders: vi.fn(),
      isProviderAvailable: vi.fn()
    } as any;

    aiPlayer = new AIPlayer(mockLLMClient, AI_PERSONALITIES.balanced);

    // Mock game state
    mockGameState = {
      id: 'test-game',
      gameType: 'tcg',
      rules: {
        gameType: GameType.TCG,
        gameSetup: { playerCount: { min: 2, max: 2 }, startingHandSize: 7 },
        playerCount: { min: 2, max: 2 },
        cardProperties: { requiredProperties: ['name'], optionalProperties: [] },
        turnStructure: [
          { name: 'Main', description: 'Main phase', optional: false, actions: ['play'] }
        ],
        actionRules: { availableActions: [], timingRules: [] },
        winConditions: [],
        timingRules: []
      },
      players: [
        {
          id: 'player1',
          name: 'AI Player',
          isAI: true,
          life: 20,
          resources: { mana: 3 },
          zones: {
            hand: [
              {
                id: 'card1',
                name: 'Lightning Bolt',
                gameType: 'tcg',
                cardType: 'spell',
                properties: [
                  { name: 'cost', value: 1, type: 'number', gameSpecific: false }
                ],
                costs: { mana: 1 },
                abilities: [],
                metadata: { gameType: 'tcg', source: 'test', parseDate: new Date() }
              }
            ],
            deck: [],
            graveyard: [],
            inPlay: [],
            exile: []
          },
          statistics: {
            cardsPlayed: 0,
            cardsDrawn: 0,
            damageDealt: 0,
            damageReceived: 0,
            resourcesSpent: 0,
            turnsPlayed: 0,
            gameSpecificStats: {}
          }
        },
        {
          id: 'player2',
          name: 'Opponent',
          isAI: false,
          life: 18,
          resources: { mana: 2 },
          zones: {
            hand: [],
            deck: [],
            graveyard: [],
            inPlay: [],
            exile: []
          },
          statistics: {
            cardsPlayed: 0,
            cardsDrawn: 0,
            damageDealt: 0,
            damageReceived: 0,
            resourcesSpent: 0,
            turnsPlayed: 0,
            gameSpecificStats: {}
          }
        }
      ],
      currentPlayerIndex: 0,
      phase: {
        name: 'Main',
        description: 'Main phase',
        allowedActions: [{ type: 'play_card' as ActionType }],
        priority: null,
        isOptional: false
      },
      turn: 1,
      gameStatus: 'active' as any,
      zones: { shared: [], market: [], supply: [] },
      history: [],
      metadata: {
        startTime: new Date(),
        lastActionTime: new Date(),
        format: 'tcg',
        tournament: false
      }
    };

    const availableActions: GameAction[] = [
      {
        id: 'action1',
        type: 'play_card' as ActionType,
        playerId: 'player1',
        description: 'Play Lightning Bolt',
        targets: [{ type: 'card', value: 'card1', optional: false }],
        costs: { mana: 1 },
        timestamp: new Date()
      },
      {
        id: 'action2',
        type: 'pass_turn' as ActionType,
        playerId: 'player1',
        description: 'Pass turn',
        timestamp: new Date()
      }
    ];

    mockContext = {
      gameState: mockGameState,
      player: mockGameState.players[0],
      availableActions,
      gameHistory: []
    };
  });

  it('creates AI player with personality', () => {
    expect(aiPlayer).toBeDefined();
  });

  it('makes decisions using LLM when available', async () => {
    // Mock successful LLM response
    vi.mocked(mockLLMClient.call).mockResolvedValue({
      success: true,
      content: 'ACTION: 1\nREASONING: Playing Lightning Bolt is efficient\nCONFIDENCE: 85',
      usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      model: 'test-model',
      timestamp: new Date()
    });

    const decision = await aiPlayer.makeDecision(mockContext);

    expect(decision).toBeDefined();
    expect(decision.action.id).toBe('action1');
    expect(decision.reasoning).toContain('Lightning Bolt');
    expect(decision.confidence).toBe(85);
    expect(mockLLMClient.call).toHaveBeenCalled();
  });

  it('falls back to rule-based decision when LLM fails', async () => {
    // Mock LLM failure
    vi.mocked(mockLLMClient.call).mockResolvedValue({
      success: false,
      content: '',
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      model: 'test-model',
      timestamp: new Date(),
      error: 'LLM error'
    });

    const decision = await aiPlayer.makeDecision(mockContext);

    expect(decision).toBeDefined();
    expect(decision.action.type).toBe('play_card'); // Should prefer playing cards
    expect(decision.reasoning.toLowerCase()).toContain('fallback');
    expect(decision.confidence).toBeLessThan(50);
  });

  it('analyzes game state correctly', () => {
    const analysis = aiPlayer.analyzeGameState(mockGameState, 'player1');

    expect(analysis).toContain('Turn 1');
    expect(analysis).toContain('Main phase');
    expect(analysis).toContain('Life: 20');
    expect(analysis).toContain('Hand: 1 cards');
    expect(analysis).toContain('mana: 3');
    expect(analysis).toContain('Opponent: 18 life');
  });

  it('updates game knowledge from actions', () => {
    const action: GameAction = {
      id: 'test-action',
      type: 'attack' as ActionType,
      playerId: 'player2',
      description: 'Attack',
      timestamp: new Date()
    };

    aiPlayer.updateGameKnowledge(mockGameState, action);
    
    // Knowledge should be tracked (private, so we can't directly test, but ensures no errors)
    expect(() => aiPlayer.updateGameKnowledge(mockGameState, action)).not.toThrow();
  });

  it('handles different game types appropriately', async () => {
    // Test TCG
    vi.mocked(mockLLMClient.call).mockResolvedValue({
      success: true,
      content: 'ACTION: 1\nREASONING: TCG strategy\nCONFIDENCE: 75',
      usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      model: 'test-model',
      timestamp: new Date()
    });

    const tcgDecision = await aiPlayer.makeDecision(mockContext);
    expect(tcgDecision.reasoning).toContain('TCG');

    // Test poker
    const pokerGameState = { ...mockGameState, gameType: 'poker' };
    const pokerContext = { ...mockContext, gameState: pokerGameState };
    
    vi.mocked(mockLLMClient.call).mockResolvedValue({
      success: true,
      content: 'ACTION: 1\nREASONING: Poker strategy\nCONFIDENCE: 65',
      usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      model: 'test-model',
      timestamp: new Date()
    });

    const pokerDecision = await aiPlayer.makeDecision(pokerContext);
    expect(pokerDecision.reasoning).toContain('Poker');
  });

  it('respects personality traits in decisions', async () => {
    // Test aggressive personality
    const aggressiveAI = new AIPlayer(mockLLMClient, AI_PERSONALITIES.aggressive);
    
    vi.mocked(mockLLMClient.call).mockResolvedValue({
      success: true,
      content: 'ACTION: 1\nREASONING: Aggressive play\nCONFIDENCE: 90',
      usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      model: 'test-model',
      timestamp: new Date()
    });

    const decision = await aggressiveAI.makeDecision(mockContext);
    expect(decision).toBeDefined();
    
    // Check that LLM was called with high unpredictability (aggressive trait)
    const callArgs = vi.mocked(mockLLMClient.call).mock.calls[0][0];
    expect(callArgs.temperature).toBe(AI_PERSONALITIES.aggressive.traits.unpredictability);
  });

  it('provides fallback for invalid action indices', async () => {
    vi.mocked(mockLLMClient.call).mockResolvedValue({
      success: true,
      content: 'ACTION: 999\nREASONING: Invalid index\nCONFIDENCE: 50',
      usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      model: 'test-model',
      timestamp: new Date()
    });

    const decision = await aiPlayer.makeDecision(mockContext);
    
    expect(decision.action.id).toBe('action1'); // Should default to first action
    expect(decision.confidence).toBeLessThanOrEqual(100);
  });

  it('handles empty available actions gracefully', async () => {
    const emptyContext = {
      ...mockContext,
      availableActions: []
    };

    vi.mocked(mockLLMClient.call).mockResolvedValue({
      success: false,
      content: '',
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      model: 'test-model',
      timestamp: new Date(),
      error: 'No actions available'
    });

    // Should still return a decision, but with undefined action due to empty actions
    const decision = await aiPlayer.makeDecision(emptyContext);
    expect(decision.action).toBeUndefined();
    expect(decision.reasoning).toContain('Emergency fallback');
  });

  it('parses complex AI responses correctly', async () => {
    const complexResponse = `
    I think the best move here is to play Lightning Bolt.
    ACTION: 1
    This will deal damage to the opponent and advance our board state.
    REASONING: Lightning Bolt gives us immediate board impact and follows our aggressive strategy
    CONFIDENCE: 87
    Additional thoughts: We should consider our mana curve for next turn.
    `;

    vi.mocked(mockLLMClient.call).mockResolvedValue({
      success: true,
      content: complexResponse,
      usage: { inputTokens: 100, outputTokens: 80, totalTokens: 180 },
      model: 'test-model',
      timestamp: new Date()
    });

    const decision = await aiPlayer.makeDecision(mockContext);
    
    expect(decision.action.id).toBe('action1');
    expect(decision.reasoning).toContain('Lightning Bolt gives us immediate board impact');
    expect(decision.confidence).toBe(87);
  });
});

describe('AI Personalities', () => {
  it('includes all expected personalities', () => {
    expect(AI_PERSONALITIES.aggressive).toBeDefined();
    expect(AI_PERSONALITIES.control).toBeDefined();
    expect(AI_PERSONALITIES.balanced).toBeDefined();
    expect(AI_PERSONALITIES.chaotic).toBeDefined();
    expect(AI_PERSONALITIES.efficient).toBeDefined();
  });

  it('has valid trait values for all personalities', () => {
    Object.values(AI_PERSONALITIES).forEach(personality => {
      expect(personality.traits.aggressiveness).toBeGreaterThanOrEqual(0);
      expect(personality.traits.aggressiveness).toBeLessThanOrEqual(1);
      expect(personality.traits.patience).toBeGreaterThanOrEqual(0);
      expect(personality.traits.patience).toBeLessThanOrEqual(1);
      expect(personality.traits.efficiency).toBeGreaterThanOrEqual(0);
      expect(personality.traits.efficiency).toBeLessThanOrEqual(1);
      expect(personality.traits.unpredictability).toBeGreaterThanOrEqual(0);
      expect(personality.traits.unpredictability).toBeLessThanOrEqual(1);
    });
  });

  it('has distinct personality characteristics', () => {
    const aggressive = AI_PERSONALITIES.aggressive;
    const control = AI_PERSONALITIES.control;
    
    expect(aggressive.traits.aggressiveness).toBeGreaterThan(control.traits.aggressiveness);
    expect(control.traits.patience).toBeGreaterThan(aggressive.traits.patience);
  });
});