// Game state management for universal card games

import { GameState, GameEvent, Player } from './types.js';

export class StateManager {
  private stateHistory: Map<string, GameState[]> = new Map();
  private maxHistoryLength = 100;

  async saveState(gameState: GameState): Promise<void> {
    // In a real implementation, this would persist to a database
    // For now, we'll just store in memory
    const gameId = gameState.id;
    
    if (!this.stateHistory.has(gameId)) {
      this.stateHistory.set(gameId, []);
    }
    
    const history = this.stateHistory.get(gameId)!;
    history.push(this.cloneState(gameState));
    
    // Limit history size
    if (history.length > this.maxHistoryLength) {
      history.shift();
    }
  }

  async loadState(gameId: string, version?: number): Promise<GameState | null> {
    const history = this.stateHistory.get(gameId);
    if (!history || history.length === 0) {
      return null;
    }
    
    if (version !== undefined) {
      return history[version] || null;
    }
    
    // Return latest state
    return this.cloneState(history[history.length - 1]);
  }

  async getStateHistory(gameId: string): Promise<GameState[]> {
    const history = this.stateHistory.get(gameId);
    return history ? history.map(state => this.cloneState(state)) : [];
  }

  cloneState(gameState: GameState): GameState {
    // Deep clone the game state
    return JSON.parse(JSON.stringify(gameState));
  }

  async revertToState(gameId: string, version: number): Promise<GameState | null> {
    const history = this.stateHistory.get(gameId);
    if (!history || version >= history.length || version < 0) {
      return null;
    }
    
    // Remove states after the target version
    history.splice(version + 1);
    
    return this.cloneState(history[version]);
  }

  validateState(gameState: GameState): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic structure validation
    if (!gameState.id) {
      errors.push('Game state missing ID');
    }

    if (!gameState.players || gameState.players.length === 0) {
      errors.push('Game state missing players');
    }

    if (!gameState.rules) {
      errors.push('Game state missing rules');
    }

    // Player validation
    if (gameState.players) {
      for (let i = 0; i < gameState.players.length; i++) {
        const player = gameState.players[i];
        const playerErrors = this.validatePlayer(player, i);
        errors.push(...playerErrors);
      }
    }

    // Game state consistency checks
    if (gameState.currentPlayerIndex >= gameState.players.length) {
      errors.push('Current player index out of bounds');
    }

    // Zone consistency checks
    if (gameState.players) {
      for (const player of gameState.players) {
        if (player.zones) {
          const zoneWarnings = this.validatePlayerZones(player);
          warnings.push(...zoneWarnings);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validatePlayer(player: Player, index: number): string[] {
    const errors: string[] = [];

    if (!player.id) {
      errors.push(`Player ${index} missing ID`);
    }

    if (!player.name) {
      errors.push(`Player ${index} missing name`);
    }

    if (!player.zones) {
      errors.push(`Player ${index} missing zones`);
    }

    if (!player.statistics) {
      errors.push(`Player ${index} missing statistics`);
    }

    if (!player.resources) {
      errors.push(`Player ${index} missing resources`);
    }

    return errors;
  }

  private validatePlayerZones(player: Player): string[] {
    const warnings: string[] = [];

    if (!player.zones.hand) {
      warnings.push(`Player ${player.name} missing hand zone`);
    }

    if (!player.zones.deck) {
      warnings.push(`Player ${player.name} missing deck zone`);
    }

    if (!player.zones.graveyard) {
      warnings.push(`Player ${player.name} missing graveyard zone`);
    }

    if (!player.zones.inPlay) {
      warnings.push(`Player ${player.name} missing in-play zone`);
    }

    // Check for duplicate cards
    const allCards = [
      ...player.zones.hand,
      ...player.zones.deck,
      ...player.zones.graveyard,
      ...player.zones.inPlay,
      ...(player.zones.exile || [])
    ];

    const cardIds = allCards.map(card => card.id);
    const duplicateIds = cardIds.filter((id, index) => cardIds.indexOf(id) !== index);
    
    if (duplicateIds.length > 0) {
      warnings.push(`Player ${player.name} has duplicate cards: ${duplicateIds.join(', ')}`);
    }

    return warnings;
  }

  createSnapshot(gameState: GameState): StateSnapshot {
    return {
      gameId: gameState.id,
      timestamp: new Date(),
      turn: gameState.turn,
      phase: gameState.phase.name,
      currentPlayer: gameState.players[gameState.currentPlayerIndex].id,
      playerStates: gameState.players.map(player => ({
        id: player.id,
        life: player.life,
        resources: { ...player.resources },
        handSize: player.zones.hand.length,
        deckSize: player.zones.deck.length,
        inPlayCount: player.zones.inPlay.length
      })),
      gameStatus: gameState.gameStatus,
      eventCount: gameState.history.length
    };
  }

  compareStates(state1: GameState, state2: GameState): StateDifference {
    const differences: string[] = [];

    // Compare basic properties
    if (state1.turn !== state2.turn) {
      differences.push(`Turn changed: ${state1.turn} → ${state2.turn}`);
    }

    if (state1.phase.name !== state2.phase.name) {
      differences.push(`Phase changed: ${state1.phase.name} → ${state2.phase.name}`);
    }

    if (state1.currentPlayerIndex !== state2.currentPlayerIndex) {
      differences.push(`Current player changed: ${state1.currentPlayerIndex} → ${state2.currentPlayerIndex}`);
    }

    // Compare player states
    for (let i = 0; i < Math.max(state1.players.length, state2.players.length); i++) {
      const player1 = state1.players[i];
      const player2 = state2.players[i];

      if (!player1 || !player2) {
        differences.push(`Player count changed`);
        continue;
      }

      if (player1.life !== player2.life) {
        differences.push(`${player1.name} life: ${player1.life} → ${player2.life}`);
      }

      // Compare resources
      const allResources = new Set([
        ...Object.keys(player1.resources),
        ...Object.keys(player2.resources)
      ]);

      for (const resource of allResources) {
        const value1 = player1.resources[resource] || 0;
        const value2 = player2.resources[resource] || 0;
        if (value1 !== value2) {
          differences.push(`${player1.name} ${resource}: ${value1} → ${value2}`);
        }
      }

      // Compare zone sizes
      const zones = ['hand', 'deck', 'graveyard', 'inPlay', 'exile'];
      for (const zone of zones) {
        const size1 = (player1.zones as any)[zone]?.length || 0;
        const size2 = (player2.zones as any)[zone]?.length || 0;
        if (size1 !== size2) {
          differences.push(`${player1.name} ${zone}: ${size1} → ${size2} cards`);
        }
      }
    }

    return {
      hasDifferences: differences.length > 0,
      differences,
      significantChanges: differences.filter(diff => 
        diff.includes('life') || 
        diff.includes('Turn') || 
        diff.includes('Phase')
      ).length
    };
  }

  optimizeState(gameState: GameState): GameState {
    const optimized = this.cloneState(gameState);

    // Remove unnecessary history entries (keep only last N events)
    const maxHistoryEntries = 50;
    if (optimized.history.length > maxHistoryEntries) {
      optimized.history = optimized.history.slice(-maxHistoryEntries);
    }

    // Clean up empty or undefined properties
    for (const player of optimized.players) {
      // Remove empty zones
      for (const [zoneName, cards] of Object.entries(player.zones)) {
        if (Array.isArray(cards) && cards.length === 0) {
          // Keep essential zones even if empty
          const essentialZones = ['hand', 'deck', 'graveyard', 'inPlay'];
          if (!essentialZones.includes(zoneName)) {
            delete (player.zones as any)[zoneName];
          }
        }
      }

      // Clean up zero resources
      for (const [resource, amount] of Object.entries(player.resources)) {
        if (amount === 0) {
          delete player.resources[resource];
        }
      }
    }

    return optimized;
  }
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface StateSnapshot {
  gameId: string;
  timestamp: Date;
  turn: number;
  phase: string;
  currentPlayer: string;
  playerStates: {
    id: string;
    life?: number;
    resources: { [key: string]: number };
    handSize: number;
    deckSize: number;
    inPlayCount: number;
  }[];
  gameStatus: string;
  eventCount: number;
}

interface StateDifference {
  hasDifferences: boolean;
  differences: string[];
  significantChanges: number;
}