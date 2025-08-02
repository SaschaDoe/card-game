// Universal Game Engine Tests

import { describe, it, expect, beforeEach } from 'vitest';
import { UniversalGameEngine } from './game-engine.js';
import { GameConfiguration, GameStatus, ActionType } from './types.js';
import { GameType } from '../parser/types.js';

describe('Universal Game Engine', () => {
  let engine: UniversalGameEngine;
  let tcgConfig: GameConfiguration;

  beforeEach(() => {
    engine = new UniversalGameEngine();
    
    // Create a basic TCG configuration for testing
    tcgConfig = {
      gameType: 'tcg',
      rules: {
        gameType: GameType.TCG,
        gameSetup: {
          playerCount: { min: 2, max: 2 },
          startingHandSize: 7
        },
        playerCount: { min: 2, max: 2 },
        cardProperties: {
          requiredProperties: ['name', 'cost'],
          optionalProperties: ['power', 'toughness']
        },
        turnStructure: [
          { name: 'Draw', description: 'Draw a card', optional: false, actions: ['draw'] },
          { name: 'Main', description: 'Play cards', optional: true, actions: ['play'] },
          { name: 'Combat', description: 'Attack with creatures', optional: true, actions: ['attack'] },
          { name: 'End', description: 'End turn', optional: false, actions: ['pass'] }
        ],
        actionRules: {
          availableActions: [
            { name: 'play', description: 'Play a card', timing: 'sorcery' },
            { name: 'attack', description: 'Attack with creature', timing: 'sorcery' }
          ],
          timingRules: ['Actions follow turn order']
        },
        winConditions: [
          {
            name: 'Life Victory',
            description: 'Reduce opponent life to 0',
            type: 'immediate',
            requirements: ['opponent life <= 0']
          }
        ],
        timingRules: []
      },
      playerConfigs: [
        {
          name: 'Player 1',
          isAI: false,
          deck: {
            id: 'deck1',
            name: 'Test Deck 1',
            gameType: 'tcg',
            cards: [
              {
                id: 'card1',
                name: 'Lightning Bolt',
                gameType: 'tcg',
                cardType: 'spell',
                properties: [
                  { name: 'cost', value: 1, type: 'number', gameSpecific: false }
                ],
                costs: { mana: 1 },
                abilities: [
                  {
                    name: 'Deal Damage',
                    description: 'Deal 3 damage to any target',
                    timing: 'instant'
                  }
                ],
                metadata: {
                  gameType: 'tcg',
                  source: 'test',
                  parseDate: new Date()
                }
              },
              {
                id: 'card2',
                name: 'Test Creature',
                gameType: 'tcg',
                cardType: 'creature',
                properties: [
                  { name: 'cost', value: 2, type: 'number', gameSpecific: false },
                  { name: 'power', value: 2, type: 'number', gameSpecific: false },
                  { name: 'toughness', value: 2, type: 'number', gameSpecific: false }
                ],
                costs: { mana: 2 },
                stats: { power: 2, toughness: 2 },
                metadata: {
                  gameType: 'tcg',
                  source: 'test',
                  parseDate: new Date()
                }
              }
            ],
            metadata: {
              totalCards: 2,
              createdDate: new Date(),
              lastModified: new Date()
            }
          }
        },
        {
          name: 'Player 2',
          isAI: false,
          deck: {
            id: 'deck2',
            name: 'Test Deck 2',
            gameType: 'tcg',
            cards: [
              {
                id: 'card3',
                name: 'Fire Elemental',
                gameType: 'tcg',
                cardType: 'creature',
                properties: [
                  { name: 'cost', value: 3, type: 'number', gameSpecific: false },
                  { name: 'power', value: 3, type: 'number', gameSpecific: false },
                  { name: 'toughness', value: 1, type: 'number', gameSpecific: false }
                ],
                costs: { mana: 3 },
                stats: { power: 3, toughness: 1 },
                metadata: {
                  gameType: 'tcg',
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
          }
        }
      ],
      startingConditions: {
        startingLife: 20,
        startingHandSize: 7,
        startingResources: { mana: 1 }
      }
    };
  });

  it('creates a new game successfully', async () => {
    const gameState = await engine.createGame(tcgConfig);

    expect(gameState).toBeDefined();
    expect(gameState.id).toBeTruthy();
    expect(gameState.gameType).toBe('tcg');
    expect(gameState.players).toHaveLength(2);
    expect(gameState.gameStatus).toBe(GameStatus.ACTIVE);
    expect(gameState.turn).toBe(1);
    expect(gameState.currentPlayerIndex).toBe(0);
  });

  it('initializes players correctly', async () => {
    const gameState = await engine.createGame(tcgConfig);

    const player1 = gameState.players[0];
    expect(player1.name).toBe('Player 1');
    expect(player1.life).toBe(20);
    expect(player1.resources.mana).toBe(1);
    expect(player1.zones.hand).toHaveLength(7);
    expect(player1.zones.deck.length).toBeGreaterThan(0);
    expect(player1.zones.graveyard).toHaveLength(0);
    expect(player1.zones.inPlay).toHaveLength(0);
  });

  it('loads and saves games correctly', async () => {
    const gameState = await engine.createGame(tcgConfig);
    const gameId = gameState.id;

    // Save the game
    await engine.saveGame(gameState);

    // Load the game
    const loadedGame = await engine.loadGame(gameId);
    expect(loadedGame.id).toBe(gameId);
    expect(loadedGame.players).toHaveLength(2);
  });

  it('gets available actions for current player', async () => {
    const gameState = await engine.createGame(tcgConfig);
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    const actions = await engine.getAvailableActions(gameState, currentPlayer.id);

    expect(actions).toBeDefined();
    expect(actions.length).toBeGreaterThan(0);
    
    // Should always have pass turn action
    const passAction = actions.find(a => a.type === ActionType.PASS_TURN);
    expect(passAction).toBeDefined();
  });

  it('executes draw card action successfully', async () => {
    const gameState = await engine.createGame(tcgConfig);
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const initialHandSize = currentPlayer.zones.hand.length;
    const initialDeckSize = currentPlayer.zones.deck.length;

    const drawAction = {
      id: 'test_draw',
      type: ActionType.DRAW_CARD,
      playerId: currentPlayer.id,
      description: 'Draw a card',
      timestamp: new Date()
    };

    const result = await engine.executeAction(gameState, drawAction);

    if (!result.success) {
      console.log('Draw action failed:', result.errors);
    }
    expect(result.success).toBe(true);
    expect(result.newState.players[0].zones.hand.length).toBe(initialHandSize + 1);
    expect(result.newState.players[0].zones.deck.length).toBe(initialDeckSize - 1);
    expect(result.events).toHaveLength(1);
  });

  it('validates actions correctly', async () => {
    const gameState = await engine.createGame(tcgConfig);
    const otherPlayer = gameState.players[1]; // Not current player

    const invalidAction = {
      id: 'test_invalid',
      type: ActionType.DRAW_CARD,
      playerId: otherPlayer.id, // Wrong player
      description: 'Invalid draw',
      timestamp: new Date()
    };

    const validation = await engine.validateAction(gameState, invalidAction);

    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('Not your turn');
  });

  it('advances phases correctly', async () => {
    const gameState = await engine.createGame(tcgConfig);
    const initialPhase = gameState.phase.name;

    const newState = await engine.advancePhase(gameState);

    expect(newState.phase.name).not.toBe(initialPhase);
    expect(newState.turn).toBeGreaterThanOrEqual(gameState.turn);
  });

  it('executes play card action with resource costs', async () => {
    const gameState = await engine.createGame(tcgConfig);
    
    // Advance to Main phase where playing cards is allowed
    const mainPhaseState = await engine.advancePhase(gameState);
    const mainPlayer = mainPhaseState.players[mainPhaseState.currentPlayerIndex];
    
    // Give player enough mana to play a card
    mainPlayer.resources.mana = 5;
    
    // Find a card in hand to play
    const cardToPlay = mainPlayer.zones.hand[0];
    
    const playAction = {
      id: 'test_play',
      type: ActionType.PLAY_CARD,
      playerId: mainPlayer.id,
      description: `Play ${cardToPlay.name}`,
      targets: [{ type: 'card' as const, value: cardToPlay.id, optional: false }],
      costs: cardToPlay.costs,
      timestamp: new Date()
    };

    const result = await engine.executeAction(mainPhaseState, playAction);

    if (!result.success) {
      console.log('Play action failed:', result.errors);
      console.log('Current phase:', mainPhaseState.phase.name);
      console.log('Allowed actions:', mainPhaseState.phase.allowedActions);
    }
    expect(result.success).toBe(true);
    
    // Check card moved from hand to play
    const newPlayer = result.newState.players[0];
    expect(newPlayer.zones.hand.find(c => c.id === cardToPlay.id)).toBeUndefined();
    expect(newPlayer.zones.inPlay.find(c => c.id === cardToPlay.id)).toBeDefined();
    
    // Check resources were spent
    const costValue = typeof cardToPlay.costs?.mana === 'number' ? cardToPlay.costs.mana : 0;
    expect(newPlayer.resources.mana).toBe(5 - costValue);
  });

  it('checks win conditions correctly', async () => {
    const gameState = await engine.createGame(tcgConfig);
    
    // Set up a winning condition - reduce opponent life to 0
    gameState.players[1].life = 0;

    const winResult = await engine.checkWinConditions(gameState);

    expect(winResult).toBeDefined();
    expect(winResult!.gameEnded).toBe(true);
    expect(winResult!.winner!.id).toBe(gameState.players[0].id);
    expect(winResult!.condition).toBe('Life Victory');
  });

  it('handles insufficient resources gracefully', async () => {
    const gameState = await engine.createGame(tcgConfig);
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // Set mana to 0
    currentPlayer.resources.mana = 0;
    
    const cardToPlay = currentPlayer.zones.hand.find(c => c.costs?.mana);
    if (!cardToPlay) {
      // Skip test if no card with mana cost
      return;
    }
    
    const playAction = {
      id: 'test_insufficient',
      type: ActionType.PLAY_CARD,
      playerId: currentPlayer.id,
      description: `Play ${cardToPlay.name}`,
      targets: [{ type: 'card' as const, value: cardToPlay.id, optional: false }],
      costs: cardToPlay.costs,
      timestamp: new Date()
    };

    const result = await engine.executeAction(gameState, playAction);

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.some(error => error.includes('Insufficient'))).toBe(true);
  });

  it('exports and imports games correctly', async () => {
    const gameState = await engine.createGame(tcgConfig);
    
    const exportedData = await engine.exportGame(gameState);
    expect(exportedData).toBeTruthy();
    expect(exportedData).toContain(gameState.id);

    const importedGame = await engine.importGame(exportedData);
    expect(importedGame.id).toBe(gameState.id);
    expect(importedGame.players).toHaveLength(gameState.players.length);
  });

  it('maintains game history correctly', async () => {
    const gameState = await engine.createGame(tcgConfig);
    expect(gameState.history).toHaveLength(0);

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const drawAction = {
      id: 'test_history',
      type: ActionType.DRAW_CARD,
      playerId: currentPlayer.id,
      description: 'Draw for history test',
      timestamp: new Date()
    };

    const result = await engine.executeAction(gameState, drawAction);
    
    expect(result.newState.history).toHaveLength(1);
    expect(result.newState.history[0].action?.id).toBe(drawAction.id);
    
    const history = engine.getGameHistory(result.newState);
    expect(history).toHaveLength(1);
  });
});