// AI Manager Tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIManager } from './ai-manager.js';
import { AI_PERSONALITIES } from './ai-player.js';
import type { LLMClient } from '../llm/client.js';
import type { GameEngine, GameState, GameAction, ActionType } from '../engine/types.js';
import { GameType } from '../parser/types.js';

describe('AI Manager', () => {
  let mockLLMClient: LLMClient;
  let mockGameEngine: GameEngine;
  let aiManager: AIManager;
  let mockGameState: GameState;

  beforeEach(() => {
    // Mock LLM client
    mockLLMClient = {
      call: vi.fn().mockResolvedValue({
        success: true,
        content: 'ACTION: 1\nREASONING: Test reasoning\nCONFIDENCE: 75',
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
        model: 'test-model',
        timestamp: new Date()
      }),
      updateConfiguration: vi.fn(),
      getAvailableProviders: vi.fn(),
      isProviderAvailable: vi.fn()
    } as any;

    // Mock game engine
    mockGameEngine = {
      getAvailableActions: vi.fn().mockResolvedValue([
        {
          id: 'action1',
          type: 'play_card' as ActionType,
          playerId: 'ai_player',
          description: 'Play card',
          timestamp: new Date()
        }
      ]),
      executeAction: vi.fn().mockResolvedValue({
        success: true,
        newState: mockGameState,
        events: []
      }),
      loadGame: vi.fn(),
      saveGame: vi.fn(),
      createGame: vi.fn(),
      advancePhase: vi.fn(),
      checkWinConditions: vi.fn(),
      validateAction: vi.fn(),
      undoAction: vi.fn(),
      getGameHistory: vi.fn(),
      exportGame: vi.fn(),
      importGame: vi.fn()
    } as any;

    aiManager = new AIManager(mockLLMClient);

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
          id: 'ai_player',
          name: 'AI Player',
          isAI: true,
          life: 20,
          resources: { mana: 3 },
          zones: {
            hand: [
              {
                id: 'card1',
                name: 'Test Card',
                gameType: 'tcg',
                cardType: 'spell',
                properties: [],
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
          id: 'human_player',
          name: 'Human Player',
          isAI: false,
          life: 20,
          resources: { mana: 3 },
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

    vi.mocked(mockGameEngine.loadGame).mockResolvedValue(mockGameState);
  });

  it('creates AI player with specified personality', () => {
    const aiPlayer = aiManager.createAIPlayer('aggressive');
    expect(aiPlayer).toBeDefined();
  });

  it('creates AI player with custom personality object', () => {
    const customPersonality = {
      name: 'Custom AI',
      description: 'Test personality',
      traits: {
        aggressiveness: 0.7,
        patience: 0.3,
        efficiency: 0.8,
        unpredictability: 0.2
      }
    };

    const aiPlayer = aiManager.createAIPlayer(customPersonality);
    expect(aiPlayer).toBeDefined();
  });

  it('starts AI game session successfully', async () => {
    const sessionId = await aiManager.startAIGame(
      mockGameEngine,
      mockGameState,
      [{ playerId: 'ai_player', personality: 'balanced' }]
    );

    expect(sessionId).toBeTruthy();
    expect(sessionId).toMatch(/^ai_session_/);
    expect(aiManager.isPlayerAI(sessionId, 'ai_player')).toBe(true);
    expect(aiManager.isPlayerAI(sessionId, 'human_player')).toBe(false);
  });

  it('executes AI turn successfully', async () => {
    const sessionId = await aiManager.startAIGame(
      mockGameEngine,
      mockGameState,
      [{ playerId: 'ai_player', personality: 'balanced' }]
    );

    const turnResult = await aiManager.executeAITurn(sessionId, mockGameState);

    expect(turnResult.success).toBe(true);
    expect(turnResult.playerId).toBe('ai_player');
    expect(turnResult.action).toBeDefined();
    expect(turnResult.reasoning).toContain('Test reasoning');
    expect(turnResult.confidence).toBe(75);
    expect(mockGameEngine.getAvailableActions).toHaveBeenCalled();
    expect(mockGameEngine.executeAction).toHaveBeenCalled();
  });

  it('handles AI turn errors gracefully', async () => {
    const sessionId = await aiManager.startAIGame(
      mockGameEngine,
      mockGameState,
      [{ playerId: 'ai_player', personality: 'balanced' }]
    );

    // Mock game engine to throw error
    vi.mocked(mockGameEngine.getAvailableActions).mockRejectedValue(new Error('Test error'));

    const turnResult = await aiManager.executeAITurn(sessionId, mockGameState);

    expect(turnResult.success).toBe(false);
    expect(turnResult.error).toContain('Test error');
  });

  it('fails AI turn for non-AI player', async () => {
    const sessionId = await aiManager.startAIGame(
      mockGameEngine,
      mockGameState,
      [{ playerId: 'ai_player', personality: 'balanced' }]
    );

    // Change current player to human
    const humanGameState = {
      ...mockGameState,
      currentPlayerIndex: 1
    };

    await expect(aiManager.executeAITurn(sessionId, humanGameState))
      .rejects.toThrow('No AI configured for player human_player');
  });

  it('starts and stops auto play', async () => {
    const sessionId = await aiManager.startAIGame(
      mockGameEngine,
      mockGameState,
      [{ playerId: 'ai_player', personality: 'balanced' }],
      { autoPlay: true, turnDelay: 0 }
    );

    // Auto play should start automatically
    const stats = aiManager.getSessionStats(sessionId);
    expect(stats.autoPlay).toBe(true);

    // Stop auto play
    aiManager.stopAutoPlay(sessionId);
    
    // Give it a moment to stop
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updatedStats = aiManager.getSessionStats(sessionId);
    expect(updatedStats.isRunning).toBe(false);
  });

  it('provides AI analysis', async () => {
    const sessionId = await aiManager.startAIGame(
      mockGameEngine,
      mockGameState,
      [{ playerId: 'ai_player', personality: 'balanced' }]
    );

    const analysis = await aiManager.getAIAnalysis(sessionId, mockGameState, 'ai_player');
    
    expect(analysis).toBeTruthy();
    expect(typeof analysis).toBe('string');
  });

  it('fails AI analysis for non-AI player', async () => {
    const sessionId = await aiManager.startAIGame(
      mockGameEngine,
      mockGameState,
      [{ playerId: 'ai_player', personality: 'balanced' }]
    );

    await expect(aiManager.getAIAnalysis(sessionId, mockGameState, 'human_player'))
      .rejects.toThrow('No AI configured for player human_player');
  });

  it('returns AI personalities', () => {
    const personalities = aiManager.getAIPersonalities();
    
    expect(personalities).toBeDefined();
    expect(personalities.aggressive).toBeDefined();
    expect(personalities.balanced).toBeDefined();
    expect(personalities.control).toBeDefined();
  });

  it('closes session properly', async () => {
    const sessionId = await aiManager.startAIGame(
      mockGameEngine,
      mockGameState,
      [{ playerId: 'ai_player', personality: 'balanced' }]
    );

    expect(aiManager.getSessionStats(sessionId)).toBeTruthy();
    
    aiManager.closeSession(sessionId);
    
    expect(aiManager.getSessionStats(sessionId)).toBeNull();
  });

  it('simulates complete AI vs AI game', async () => {
    // Setup two AI players
    const bothAIGameState = {
      ...mockGameState,
      players: [
        { ...mockGameState.players[0], id: 'ai_player_1', isAI: true },
        { ...mockGameState.players[1], id: 'ai_player_2', isAI: true }
      ]
    };

    // Mock game to end after a few turns
    let turnCount = 0;
    vi.mocked(mockGameEngine.loadGame).mockImplementation(async () => ({
      ...bothAIGameState,
      gameStatus: turnCount++ > 3 ? 'finished' as any : 'active' as any,
      turn: turnCount
    }));

    const finalState = await aiManager.simulateGame(
      mockGameEngine,
      bothAIGameState,
      [
        { playerId: 'ai_player_1', personality: 'aggressive' },
        { playerId: 'ai_player_2', personality: 'control' }
      ],
      { maxTurns: 10, verbose: false }
    );

    expect(finalState).toBeDefined();
    expect(mockGameEngine.getAvailableActions).toHaveBeenCalled();
    expect(mockGameEngine.executeAction).toHaveBeenCalled();
  });

  it('gets session statistics', async () => {
    const sessionId = await aiManager.startAIGame(
      mockGameEngine,
      mockGameState,
      [{ playerId: 'ai_player', personality: 'balanced' }]
    );

    const stats = aiManager.getSessionStats(sessionId);
    
    expect(stats).toBeDefined();
    expect(stats.gameId).toBe('test-game');
    expect(stats.aiPlayerCount).toBe(1);
    expect(stats.aiPlayerIds).toContain('ai_player');
  });

  it('lists active sessions', async () => {
    const sessionId1 = await aiManager.startAIGame(
      mockGameEngine,
      mockGameState,
      [{ playerId: 'ai_player', personality: 'balanced' }]
    );

    const sessionId2 = await aiManager.startAIGame(
      mockGameEngine,
      { ...mockGameState, id: 'game2' },
      [{ playerId: 'ai_player', personality: 'aggressive' }]
    );

    const activeSessions = aiManager.getActiveSessions();
    
    expect(activeSessions).toHaveLength(2);
    expect(activeSessions).toContain(sessionId1);
    expect(activeSessions).toContain(sessionId2);
  });

  it('handles session not found errors', async () => {
    expect(aiManager.getSessionStats('nonexistent')).toBeNull();
    
    await expect(aiManager.executeAITurn('nonexistent', mockGameState))
      .rejects.toThrow('AI session nonexistent not found');
    
    await expect(aiManager.getAIAnalysis('nonexistent', mockGameState, 'ai_player'))
      .rejects.toThrow('AI session nonexistent not found');
  });
});