// Rule enforcement engine for universal card games

import {
  GameState,
  GameAction,
  GameEvent,
  ActionEffect,
  RuleEngine as IRuleEngine,
  RuleEnforcementResult
} from './types.js';

export class RuleEngine implements IRuleEngine {
  async enforceRules(gameState: GameState, action: GameAction): Promise<RuleEnforcementResult> {
    const reasons: string[] = [];
    let allowed = true;
    const additionalEffects: ActionEffect[] = [];

    // Check timing rules
    const timingValid = await this.checkTimingRules(gameState, action);
    if (!timingValid) {
      allowed = false;
      reasons.push('Action not allowed at this time');
    }

    // Check resource requirements
    const player = gameState.players.find(p => p.id === action.playerId);
    if (player && action.costs) {
      for (const [resource, cost] of Object.entries(action.costs)) {
        if ((player.resources[resource] || 0) < cost) {
          allowed = false;
          reasons.push(`Insufficient ${resource}: need ${cost}, have ${player.resources[resource] || 0}`);
        }
      }
    }

    // Check action requirements
    if (action.requirements) {
      for (const requirement of action.requirements) {
        const requirementMet = await this.checkRequirement(gameState, requirement, action.playerId);
        if (!requirementMet) {
          allowed = false;
          reasons.push(`Requirement not met: ${requirement.condition}`);
        }
      }
    }

    // Game-specific rule checks
    const gameSpecificResult = await this.checkGameSpecificRules(gameState, action);
    if (!gameSpecificResult.allowed) {
      allowed = false;
      reasons.push(...gameSpecificResult.reasons);
    }

    return {
      allowed,
      reasons,
      additionalEffects
    };
  }

  async checkTimingRules(gameState: GameState, action: GameAction): Promise<boolean> {
    // Check if it's the correct player's turn
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== action.playerId) {
      return false;
    }

    // Check if action is allowed in current phase
    const allowedActionTypes = gameState.phase.allowedActions.map(a => a.type);
    const actionAllowed = allowedActionTypes.includes(action.type) || action.type === 'pass_turn';
    
    if (!actionAllowed) {
      return false;
    }

    // Check game-specific timing rules
    return await this.checkGameSpecificTiming(gameState, action);
  }

  async processTriggers(gameState: GameState, event: GameEvent): Promise<GameEvent[]> {
    const triggeredEvents: GameEvent[] = [];

    // Look for triggered abilities on cards in play
    for (const player of gameState.players) {
      for (const card of player.zones.inPlay) {
        if (card.abilities) {
          for (const ability of card.abilities) {
            if (ability.timing === 'triggered' && this.matchesTrigger(ability, event)) {
              // Create triggered ability event
              const triggeredEvent: GameEvent = {
                id: this.generateEventId(),
                type: 'triggered_ability',
                playerId: player.id,
                result: {
                  card: card,
                  ability: ability,
                  trigger: event
                },
                timestamp: new Date()
              };
              triggeredEvents.push(triggeredEvent);
            }
          }
        }
      }
    }

    return triggeredEvents;
  }

  async resolveEffects(gameState: GameState, effects: ActionEffect[]): Promise<GameState> {
    let newState = { ...gameState };

    for (const effect of effects) {
      switch (effect.type) {
        case 'modify_resource':
          newState = await this.resolveResourceModification(newState, effect);
          break;
        case 'move_card':
          newState = await this.resolveCardMovement(newState, effect);
          break;
        case 'modify_stats':
          newState = await this.resolveStatModification(newState, effect);
          break;
        case 'trigger_ability':
          newState = await this.resolveTriggerAbility(newState, effect);
          break;
        case 'custom':
          newState = await this.resolveCustomEffect(newState, effect);
          break;
      }
    }

    return newState;
  }

  // Private helper methods
  private async checkRequirement(gameState: GameState, requirement: any, playerId: string): Promise<boolean> {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return false;

    switch (requirement.type) {
      case 'resource':
        return (player.resources[requirement.condition] || 0) >= requirement.value;
      
      case 'zone':
        const zone = player.zones[requirement.condition];
        return zone ? zone.length >= requirement.value : false;
      
      case 'card_type':
        const hand = player.zones.hand;
        const cardTypeCount = hand.filter(card => 
          card.cardType.toLowerCase() === requirement.condition.toLowerCase()
        ).length;
        return cardTypeCount >= requirement.value;
      
      case 'player_state':
        if (requirement.condition === 'life') {
          return (player.life || 0) >= requirement.value;
        }
        return true;
      
      default:
        return true;
    }
  }

  private async checkGameSpecificRules(gameState: GameState, action: GameAction): Promise<RuleEnforcementResult> {
    const reasons: string[] = [];
    let allowed = true;

    // TCG-specific rules
    if (gameState.gameType === 'tcg') {
      allowed = await this.checkTCGRules(gameState, action, reasons);
    }
    
    // Poker-specific rules
    else if (gameState.gameType === 'poker') {
      allowed = await this.checkPokerRules(gameState, action, reasons);
    }
    
    // Deck-builder specific rules
    else if (gameState.gameType === 'deckbuilder') {
      allowed = await this.checkDeckBuilderRules(gameState, action, reasons);
    }

    return { allowed, reasons };
  }

  private async checkGameSpecificTiming(gameState: GameState, action: GameAction): Promise<boolean> {
    switch (gameState.gameType) {
      case 'tcg':
        return this.checkTCGTiming(gameState, action);
      case 'poker':
        return this.checkPokerTiming(gameState, action);
      default:
        return true;
    }
  }

  private async checkTCGRules(gameState: GameState, action: GameAction, reasons: string[]): Promise<boolean> {
    const player = gameState.players.find(p => p.id === action.playerId);
    if (!player) return false;

    switch (action.type) {
      case 'play_card':
        // Check if card can be played during this phase
        if (gameState.phase.name === 'Combat' && action.targets) {
          const cardId = action.targets[0]?.value;
          const card = player.zones.hand.find(c => c.id === cardId);
          if (card && card.cardType !== 'instant') {
            reasons.push('Only instant spells can be played during combat');
            return false;
          }
        }
        break;
      
      case 'attack':
        // Check if creature can attack
        if (gameState.phase.name !== 'Combat') {
          reasons.push('Can only attack during combat phase');
          return false;
        }
        break;
    }

    return true;
  }

  private async checkPokerRules(gameState: GameState, action: GameAction, reasons: string[]): Promise<boolean> {
    // Poker-specific validation logic
    return true;
  }

  private async checkDeckBuilderRules(gameState: GameState, action: GameAction, reasons: string[]): Promise<boolean> {
    const player = gameState.players.find(p => p.id === action.playerId);
    if (!player) return false;

    // Check buy actions
    if (action.type === 'play_card') {
      const buys = player.resources['buys'] || 0;
      if (buys <= 0) {
        reasons.push('No buys remaining');
        return false;
      }
    }

    return true;
  }

  private checkTCGTiming(gameState: GameState, action: GameAction): boolean {
    // TCG timing rules - spells can be played in main phase, instants any time
    if (action.type === 'play_card') {
      const player = gameState.players.find(p => p.id === action.playerId);
      if (player && action.targets) {
        const cardId = action.targets[0]?.value;
        const card = player.zones.hand.find(c => c.id === cardId);
        
        if (card?.cardType === 'instant') {
          return true; // Instants can be played any time
        }
        
        return gameState.phase.name.toLowerCase().includes('main');
      }
    }
    
    return true;
  }

  private checkPokerTiming(gameState: GameState, action: GameAction): boolean {
    // Poker timing rules
    return gameState.phase.name === 'Betting';
  }

  private matchesTrigger(ability: any, event: GameEvent): boolean {
    // Simple trigger matching
    if (ability.conditions) {
      for (const condition of ability.conditions) {
        if (event.type.includes(condition.toLowerCase())) {
          return true;
        }
      }
    }
    
    return false;
  }

  private async resolveResourceModification(gameState: GameState, effect: ActionEffect): Promise<GameState> {
    const newState = { ...gameState };
    
    for (const target of effect.targets) {
      if (target.type === 'player') {
        const player = newState.players.find(p => p.id === target.value);
        if (player && effect.value) {
          const { resource, amount } = effect.value;
          player.resources[resource] = (player.resources[resource] || 0) + amount;
        }
      }
    }
    
    return newState;
  }

  private async resolveCardMovement(gameState: GameState, effect: ActionEffect): Promise<GameState> {
    const newState = { ...gameState };
    
    // Card movement logic (hand to play, play to graveyard, etc.)
    for (const target of effect.targets) {
      if (target.type === 'card' && effect.value) {
        const { fromZone, toZone, playerId } = effect.value;
        const player = newState.players.find(p => p.id === playerId);
        
        if (player) {
          const fromCards = player.zones[fromZone] || [];
          const cardIndex = fromCards.findIndex(c => c.id === target.value);
          
          if (cardIndex !== -1) {
            const card = fromCards.splice(cardIndex, 1)[0];
            const toCards = player.zones[toZone] || [];
            toCards.push(card);
          }
        }
      }
    }
    
    return newState;
  }

  private async resolveStatModification(gameState: GameState, effect: ActionEffect): Promise<GameState> {
    // Stat modification logic
    return gameState;
  }

  private async resolveTriggerAbility(gameState: GameState, effect: ActionEffect): Promise<GameState> {
    // Trigger ability resolution
    return gameState;
  }

  private async resolveCustomEffect(gameState: GameState, effect: ActionEffect): Promise<GameState> {
    // Custom effect resolution
    console.warn(`Custom effect resolution not implemented: ${effect.description}`);
    return gameState;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}