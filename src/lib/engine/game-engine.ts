// Universal Game Engine Implementation

import {
  GameState,
  GameConfiguration,
  GameAction,
  GameActionResult,
  ActionValidationResult,
  WinConditionResult,
  GameEvent,
  GameEngine,
  Player,
  GamePhase,
  GameStatus,
  ActionType
} from './types.js';
import type { UniversalGameRules } from '../parser/types.js';
import { RuleEngine } from './rule-engine.js';
import { StateManager } from './state-manager.js';

export class UniversalGameEngine implements GameEngine {
  private ruleEngine: RuleEngine;
  private stateManager: StateManager;
  private gameStates: Map<string, GameState> = new Map();

  constructor() {
    this.ruleEngine = new RuleEngine();
    this.stateManager = new StateManager();
  }

  async createGame(config: GameConfiguration): Promise<GameState> {
    const gameId = this.generateGameId();
    
    // Initialize players
    const players: Player[] = config.playerConfigs.map((playerConfig, index) => ({
      id: `player_${index}`,
      name: playerConfig.name,
      isAI: playerConfig.isAI,
      life: config.startingConditions?.startingLife || this.getDefaultStartingLife(config.gameType),
      resources: config.startingConditions?.startingResources || this.getDefaultStartingResources(config.gameType),
      zones: {
        hand: [],
        deck: playerConfig.deck?.cards || [],
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
    }));

    // Initialize game state
    const gameState: GameState = {
      id: gameId,
      gameType: config.gameType,
      rules: config.rules,
      players,
      currentPlayerIndex: 0,
      phase: this.getInitialPhase(config.rules),
      turn: 1,
      gameStatus: GameStatus.SETUP,
      zones: {
        shared: [],
        market: [],
        supply: []
      },
      history: [],
      metadata: {
        startTime: new Date(),
        lastActionTime: new Date(),
        expectedDuration: config.timeControls?.gameTimeLimit,
        format: config.gameType,
        tournament: false
      }
    };

    // Perform initial setup
    await this.performInitialSetup(gameState);
    
    // Cache the game state
    this.gameStates.set(gameId, gameState);
    
    return gameState;
  }

  async loadGame(gameId: string): Promise<GameState> {
    const gameState = this.gameStates.get(gameId);
    if (!gameState) {
      throw new Error(`Game with ID ${gameId} not found`);
    }
    return { ...gameState }; // Return a copy
  }

  async saveGame(gameState: GameState): Promise<void> {
    // Update the cached state
    this.gameStates.set(gameState.id, { ...gameState });
    
    // In a real implementation, this would persist to a database
    await this.stateManager.saveState(gameState);
  }

  async executeAction(gameState: GameState, action: GameAction): Promise<GameActionResult> {
    try {
      // Validate the action
      const validation = await this.validateAction(gameState, action);
      if (!validation.isValid) {
        return {
          success: false,
          newState: gameState,
          events: [],
          errors: validation.errors
        };
      }

      // Create a copy of the game state for modification
      let newState = this.stateManager.cloneState(gameState);
      
      // Execute the action
      const events: GameEvent[] = [];
      
      switch (action.type) {
        case ActionType.PLAY_CARD:
          newState = await this.executePlayCard(newState, action);
          break;
        case ActionType.DRAW_CARD:
          newState = await this.executeDrawCard(newState, action);
          break;
        case ActionType.PASS_TURN:
          newState = await this.executePassTurn(newState, action);
          break;
        case ActionType.ATTACK:
          newState = await this.executeAttack(newState, action);
          break;
        default:
          newState = await this.executeCustomAction(newState, action);
      }

      // Record the event
      const gameEvent: GameEvent = {
        id: this.generateEventId(),
        type: action.type,
        playerId: action.playerId,
        action,
        result: 'success',
        timestamp: new Date()
      };
      
      newState.history.push(gameEvent);
      events.push(gameEvent);

      // Update metadata
      newState.metadata.lastActionTime = new Date();

      // Check for win conditions
      const winResult = await this.checkWinConditions(newState);
      if (winResult?.gameEnded) {
        newState.gameStatus = GameStatus.FINISHED;
      }

      // Apply rule enforcement
      const ruleResult = await this.ruleEngine.enforceRules(newState, action);
      if (ruleResult.additionalEffects) {
        newState = await this.ruleEngine.resolveEffects(newState, ruleResult.additionalEffects);
      }

      return {
        success: true,
        newState,
        events
      };

    } catch (error) {
      return {
        success: false,
        newState: gameState,
        events: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async getAvailableActions(gameState: GameState, playerId: string): Promise<GameAction[]> {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      return [];
    }

    const actions: GameAction[] = [];

    // Basic actions always available
    actions.push({
      id: this.generateActionId(),
      type: ActionType.PASS_TURN,
      playerId,
      description: 'Pass turn to next player',
      timestamp: new Date()
    });

    // Phase-specific actions
    if (gameState.phase.allowedActions.some(a => a.type === ActionType.PLAY_CARD)) {
      // Add play card actions for each playable card
      for (const card of player.zones.hand) {
        if (await this.canPlayCard(gameState, player, card)) {
          actions.push({
            id: this.generateActionId(),
            type: ActionType.PLAY_CARD,
            playerId,
            description: `Play ${card.name}`,
            targets: [{ type: 'card', value: card.id, optional: false }],
            costs: card.costs,
            timestamp: new Date()
          });
        }
      }
    }

    if (gameState.phase.allowedActions.some(a => a.type === ActionType.DRAW_CARD)) {
      actions.push({
        id: this.generateActionId(),
        type: ActionType.DRAW_CARD,
        playerId,
        description: 'Draw a card',
        timestamp: new Date()
      });
    }

    // Attack actions during combat
    if (gameState.phase.name.toLowerCase().includes('combat')) {
      for (const card of player.zones.inPlay) {
        if (this.canAttack(gameState, card)) {
          actions.push({
            id: this.generateActionId(),
            type: ActionType.ATTACK,
            playerId,
            description: `Attack with ${card.name}`,
            targets: [{ type: 'card', value: card.id, optional: false }],
            timestamp: new Date()
          });
        }
      }
    }

    return actions;
  }

  async advancePhase(gameState: GameState): Promise<GameState> {
    const newState = this.stateManager.cloneState(gameState);
    
    // Get the next phase
    const currentPhaseIndex = gameState.rules.turnStructure.findIndex(
      phase => phase.name === gameState.phase.name
    );
    
    if (currentPhaseIndex < gameState.rules.turnStructure.length - 1) {
      // Move to next phase
      const nextPhase = gameState.rules.turnStructure[currentPhaseIndex + 1];
      newState.phase = this.createGamePhase(nextPhase);
    } else {
      // End of turn, move to next player
      newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length;
      newState.turn += newState.currentPlayerIndex === 0 ? 1 : 0;
      newState.phase = this.createGamePhase(gameState.rules.turnStructure[0]);
      
      // Update player statistics
      newState.players[newState.currentPlayerIndex].statistics.turnsPlayed++;
    }

    return newState;
  }

  async checkWinConditions(gameState: GameState): Promise<WinConditionResult | null> {
    // Check defined win conditions first
    for (const winCondition of gameState.rules.winConditions) {
      for (const player of gameState.players) {
        const hasWon = await this.evaluateWinCondition(gameState, player, winCondition);
        if (hasWon) {
          return {
            winner: player,
            condition: winCondition.name,
            description: winCondition.description,
            gameEnded: true
          };
        }
      }
    }

    // Check for elimination conditions (e.g., life <= 0) only if no specific win condition triggered
    const alivePlayers = gameState.players.filter(p => (p.life || 0) > 0);
    if (alivePlayers.length === 1) {
      return {
        winner: alivePlayers[0],
        condition: 'Elimination',
        description: 'Last player standing',
        gameEnded: true
      };
    }

    return null;
  }

  async validateAction(gameState: GameState, action: GameAction): Promise<ActionValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    const player = gameState.players.find(p => p.id === action.playerId);
    if (!player) {
      errors.push(`Player ${action.playerId} not found`);
    }

    // Check if it's the player's turn
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== action.playerId) {
      errors.push('Not your turn');
    }

    // Check if action is allowed in current phase
    const allowedActions = gameState.phase.allowedActions.map(a => a.type);
    const actionAllowed = allowedActions.includes(action.type) || action.type === ActionType.PASS_TURN;
    
    if (!actionAllowed) {
      errors.push(`Action ${action.type} not allowed in phase ${gameState.phase.name}`);
    }

    // Game-specific validation
    const ruleValidation = await this.ruleEngine.enforceRules(gameState, action);
    if (!ruleValidation.allowed) {
      errors.push(...ruleValidation.reasons);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async undoAction(gameState: GameState): Promise<GameState> {
    if (gameState.history.length === 0) {
      throw new Error('No actions to undo');
    }

    // In a full implementation, we would restore from a previous state snapshot
    // For now, we'll just remove the last event
    const newState = this.stateManager.cloneState(gameState);
    newState.history.pop();
    
    return newState;
  }

  getGameHistory(gameState: GameState): GameEvent[] {
    return [...gameState.history];
  }

  async exportGame(gameState: GameState): Promise<string> {
    return JSON.stringify(gameState, null, 2);
  }

  async importGame(gameData: string): Promise<GameState> {
    try {
      const gameState = JSON.parse(gameData) as GameState;
      
      // Validate the imported game state
      if (!gameState.id || !gameState.players || !gameState.rules) {
        throw new Error('Invalid game data format');
      }

      // Cache the imported game
      this.gameStates.set(gameState.id, gameState);
      
      return gameState;
    } catch (error) {
      throw new Error(`Failed to import game: ${error}`);
    }
  }

  // Private helper methods
  private generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultStartingLife(gameType: string): number {
    switch (gameType.toLowerCase()) {
      case 'tcg': return 20;
      case 'poker': return 0;
      case 'deckbuilder': return 0;
      default: return 10;
    }
  }

  private getDefaultStartingResources(gameType: string): { [resourceType: string]: number } {
    switch (gameType.toLowerCase()) {
      case 'tcg': return { mana: 0, energy: 3 };
      case 'deckbuilder': return { coins: 0, buys: 1 };
      default: return {};
    }
  }

  private getInitialPhase(rules: UniversalGameRules): GamePhase {
    const firstPhase = rules.turnStructure[0];
    return this.createGamePhase(firstPhase);
  }

  private createGamePhase(phase: any): GamePhase {
    const actionMapping: { [key: string]: ActionType } = {
      'draw': ActionType.DRAW_CARD,
      'play': ActionType.PLAY_CARD,
      'attack': ActionType.ATTACK,
      'pass': ActionType.PASS_TURN
    };

    return {
      name: phase.name,
      description: phase.description || `${phase.name} phase`,
      allowedActions: phase.actions?.map((action: string) => ({ 
        type: actionMapping[action] || action as ActionType 
      })) || [],
      priority: null,
      isOptional: phase.optional || false
    };
  }

  private async performInitialSetup(gameState: GameState): Promise<void> {
    // Shuffle decks and duplicate cards to ensure sufficient deck size
    for (const player of gameState.players) {
      let deck = [...player.zones.deck];
      
      // If deck is too small, duplicate cards to make it larger
      const minDeckSize = 20; // Minimum deck size
      while (deck.length < minDeckSize && player.zones.deck.length > 0) {
        const additionalCards = player.zones.deck.map(card => ({
          ...card,
          id: `${card.id}_copy_${Math.random().toString(36).substr(2, 9)}`
        }));
        deck.push(...additionalCards);
      }
      
      player.zones.deck = this.shuffleArray(deck);
      
      // Draw starting hand
      const handSize = Math.min(gameState.rules.gameSetup.startingHandSize || 7, player.zones.deck.length);
      for (let i = 0; i < handSize; i++) {
        const card = player.zones.deck.pop()!;
        player.zones.hand.push(card);
        player.statistics.cardsDrawn++;
      }
    }

    gameState.gameStatus = GameStatus.ACTIVE;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private async executePlayCard(gameState: GameState, action: GameAction): Promise<GameState> {
    const player = gameState.players.find(p => p.id === action.playerId)!;
    const cardId = action.targets?.[0]?.value;
    const cardIndex = player.zones.hand.findIndex(c => c.id === cardId);
    
    if (cardIndex === -1) {
      throw new Error('Card not found in hand');
    }

    const card = player.zones.hand[cardIndex];
    
    // Pay costs
    if (action.costs) {
      for (const [resource, cost] of Object.entries(action.costs)) {
        if ((player.resources[resource] || 0) < cost) {
          throw new Error(`Insufficient ${resource}`);
        }
        player.resources[resource] = (player.resources[resource] || 0) - cost;
        player.statistics.resourcesSpent += cost;
      }
    }

    // Move card from hand to play
    player.zones.hand.splice(cardIndex, 1);
    player.zones.inPlay.push(card);
    player.statistics.cardsPlayed++;

    return gameState;
  }

  private async executeDrawCard(gameState: GameState, action: GameAction): Promise<GameState> {
    const player = gameState.players.find(p => p.id === action.playerId)!;
    
    if (player.zones.deck.length === 0) {
      throw new Error('No cards left to draw');
    }

    const card = player.zones.deck.pop()!;
    player.zones.hand.push(card);
    player.statistics.cardsDrawn++;

    return gameState;
  }

  private async executePassTurn(gameState: GameState, action: GameAction): Promise<GameState> {
    return this.advancePhase(gameState);
  }

  private async executeAttack(gameState: GameState, action: GameAction): Promise<GameState> {
    // Basic attack implementation
    const attacker = gameState.players.find(p => p.id === action.playerId)!;
    const cardId = action.targets?.[0]?.value;
    const attackingCard = attacker.zones.inPlay.find(c => c.id === cardId);
    
    if (!attackingCard) {
      throw new Error('Attacking card not found');
    }

    // Simple direct attack - deal damage to next player
    const targetPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    const targetPlayer = gameState.players[targetPlayerIndex];
    
    const damage = attackingCard.stats?.power || 1;
    targetPlayer.life = (targetPlayer.life || 0) - damage;
    
    attacker.statistics.damageDealt += damage;
    targetPlayer.statistics.damageReceived += damage;

    return gameState;
  }

  private async executeCustomAction(gameState: GameState, action: GameAction): Promise<GameState> {
    // Placeholder for custom game-specific actions
    console.warn(`Custom action ${action.type} not implemented`);
    return gameState;
  }

  private async canPlayCard(gameState: GameState, player: Player, card: any): Promise<boolean> {
    // Check if player has enough resources
    if (card.costs) {
      for (const [resource, cost] of Object.entries(card.costs)) {
        if ((player.resources[resource] || 0) < cost) {
          return false;
        }
      }
    }

    return true;
  }

  private canAttack(gameState: GameState, card: any): boolean {
    // Simple check - cards can attack if they have power
    return (card.stats?.power || 0) > 0;
  }

  private async evaluateWinCondition(gameState: GameState, player: Player, winCondition: any): Promise<boolean> {
    // Simple win condition evaluation
    switch (winCondition.type) {
      case 'immediate':
        if (winCondition.requirements.includes('opponent life <= 0')) {
          const opponents = gameState.players.filter(p => p.id !== player.id);
          return opponents.some(opp => (opp.life || 0) <= 0);
        }
        break;
      case 'endgame':
        // Check endgame conditions
        return false;
    }

    return false;
  }
}