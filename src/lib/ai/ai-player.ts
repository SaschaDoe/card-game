// AI Player implementation with LLM decision making

import type { 
  GameState, 
  GameAction, 
  Player
} from '../engine/types.js';
import { ActionType } from '../engine/types.js';
import type { LLMClient } from '../llm/client.js';
import type { LLMRequest } from '../llm/types.js';

export interface AIDecisionContext {
  gameState: GameState;
  player: Player;
  availableActions: GameAction[];
  gameHistory: string[];
}

export interface AIDecision {
  action: GameAction;
  reasoning: string;
  confidence: number;
}

export interface AIPersonality {
  name: string;
  description: string;
  traits: {
    aggressiveness: number; // 0-1, how likely to attack/take risks
    patience: number; // 0-1, how likely to wait for better opportunities
    efficiency: number; // 0-1, how optimally they play
    unpredictability: number; // 0-1, how much randomness in decisions
  };
  gameSpecificSettings?: {
    [gameType: string]: any;
  };
}

export class AIPlayer {
  private llmClient: LLMClient;
  private personality: AIPersonality;
  private gameKnowledge: Map<string, any> = new Map();

  constructor(llmClient: LLMClient, personality: AIPersonality) {
    this.llmClient = llmClient;
    this.personality = personality;
  }

  async makeDecision(context: AIDecisionContext): Promise<AIDecision> {
    try {
      // Build context for LLM
      const prompt = this.buildDecisionPrompt(context);
      
      const llmRequest: LLMRequest = {
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(context.gameState.gameType)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.personality.traits.unpredictability,
        maxTokens: 500
      };

      const response = await this.llmClient.call(llmRequest);
      
      if (!response.success || !response.content) {
        return this.getFallbackDecision(context);
      }

      return this.parseAIResponse(response.content, context);
    } catch (error) {
      console.warn('AI decision failed, using fallback:', error);
      return this.getFallbackDecision(context);
    }
  }

  analyzeGameState(gameState: GameState, playerId: string): string {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return 'Player not found';

    const analysis = [];
    
    // Basic state analysis
    analysis.push(`Turn ${gameState.turn}, ${gameState.phase.name} phase`);
    analysis.push(`Life: ${player.life || 'N/A'}`);
    analysis.push(`Hand: ${player.zones.hand.length} cards`);
    analysis.push(`Deck: ${player.zones.deck.length} cards`);
    analysis.push(`In play: ${player.zones.inPlay.length} cards`);
    
    // Resources
    const resources = Object.entries(player.resources)
      .map(([resource, amount]) => `${resource}: ${amount}`)
      .join(', ');
    if (resources) {
      analysis.push(`Resources: ${resources}`);
    }

    // Opponents
    const opponents = gameState.players.filter(p => p.id !== playerId);
    for (const opponent of opponents) {
      analysis.push(`${opponent.name}: ${opponent.life || 'N/A'} life, ${opponent.zones.hand.length} hand, ${opponent.zones.inPlay.length} in play`);
    }

    return analysis.join('\n');
  }

  updateGameKnowledge(gameState: GameState, lastAction?: GameAction): void {
    const gameId = gameState.id;
    
    if (!this.gameKnowledge.has(gameId)) {
      this.gameKnowledge.set(gameId, {
        playerPatterns: new Map(),
        cardsSeen: new Set(),
        strategicNotes: []
      });
    }

    const knowledge = this.gameKnowledge.get(gameId);
    
    // Track cards seen
    for (const player of gameState.players) {
      for (const card of player.zones.inPlay) {
        knowledge.cardsSeen.add(`${card.name}:${card.cardType}`);
      }
    }

    // Analyze last action for player patterns
    if (lastAction) {
      const playerPattern = knowledge.playerPatterns.get(lastAction.playerId) || {
        aggressiveActions: 0,
        defensiveActions: 0,
        resourceEfficiency: []
      };

      if (lastAction.type === ActionType.ATTACK) {
        playerPattern.aggressiveActions++;
      }

      knowledge.playerPatterns.set(lastAction.playerId, playerPattern);
    }
  }

  private buildDecisionPrompt(context: AIDecisionContext): string {
    const { gameState, player, availableActions } = context;
    
    let prompt = `You are playing a ${gameState.gameType} card game as an AI with this personality:
Name: ${this.personality.name}
Description: ${this.personality.description}
Traits: Aggressive: ${this.personality.traits.aggressiveness}, Patient: ${this.personality.traits.patience}, Efficient: ${this.personality.traits.efficiency}

Current game state:
${this.analyzeGameState(gameState, player.id)}

Available actions:
${availableActions.map((action, index) => 
  `${index + 1}. ${action.description} (Type: ${action.type})`
).join('\n')}

Your hand contains:
${player.zones.hand.map(card => 
  `- ${card.name} (${card.cardType}) ${card.costs ? `Cost: ${Object.entries(card.costs).map(([r, c]) => `${c} ${r}`).join(', ')}` : ''}`
).join('\n')}

Your cards in play:
${player.zones.inPlay.map(card => 
  `- ${card.name} (${card.cardType}) ${card.stats ? `${card.stats.power}/${card.stats.toughness}` : ''}`
).join('\n')}

Please choose the best action and explain your reasoning. Respond in this format:
ACTION: [number from 1-${availableActions.length}]
REASONING: [explanation of why this action is best]
CONFIDENCE: [number from 0-100]`;

    return prompt;
  }

  private getSystemPrompt(gameType: string): string {
    const basePrompt = `You are an AI player in a ${gameType} card game. Make strategic decisions based on the game state and your personality traits.`;
    
    switch (gameType.toLowerCase()) {
      case 'tcg':
        return `${basePrompt} In TCG games, focus on managing resources, playing creatures and spells efficiently, and timing attacks well. Consider card advantage, mana curve, and board control.`;
      
      case 'poker':
        return `${basePrompt} In poker, focus on hand strength, pot odds, position, and reading opponents. Consider bluffing opportunities and bankroll management.`;
      
      case 'deckbuilder':
        return `${basePrompt} In deck-building games, focus on engine building, card synergies, and economy management. Balance buying new cards with playing current cards effectively.`;
      
      default:
        return basePrompt;
    }
  }

  private parseAIResponse(content: string, context: AIDecisionContext): AIDecision {
    try {
      const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      let actionIndex = 1;
      let reasoning = 'AI decision';
      let confidence = 50;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.startsWith('ACTION:')) {
          const match = line.match(/ACTION:\s*(\d+)/);
          if (match) {
            actionIndex = parseInt(match[1]);
          }
        } else if (line.startsWith('REASONING:')) {
          // Get the reasoning text, which might be on the same line or next lines
          let reasoningText = line.replace('REASONING:', '').trim();
          
          // If reasoning is empty, look for content on following lines until we hit another field
          if (!reasoningText && i + 1 < lines.length) {
            for (let j = i + 1; j < lines.length; j++) {
              const nextLine = lines[j];
              if (nextLine.startsWith('CONFIDENCE:') || nextLine.startsWith('ACTION:')) {
                break;
              }
              reasoningText += (reasoningText ? ' ' : '') + nextLine;
            }
          }
          
          if (reasoningText) {
            reasoning = reasoningText;
          }
        } else if (line.startsWith('CONFIDENCE:')) {
          const match = line.match(/CONFIDENCE:\s*(\d+)/);
          if (match) {
            confidence = parseInt(match[1]);
          }
        }
      }

      // Validate action index
      if (actionIndex < 1 || actionIndex > context.availableActions.length) {
        actionIndex = 1;
      }

      return {
        action: context.availableActions[actionIndex - 1],
        reasoning,
        confidence: Math.max(0, Math.min(100, confidence))
      };
    } catch (error) {
      console.warn('Failed to parse AI response:', error);
      return this.getFallbackDecision(context);
    }
  }

  private getFallbackDecision(context: AIDecisionContext): AIDecision {
    // Simple fallback: prefer playing cards over passing, attacking over doing nothing
    const { availableActions } = context;
    
    // Priority: Play card > Attack > Draw > Pass turn
    const priorities = [
      ActionType.PLAY_CARD,
      ActionType.ATTACK,
      ActionType.DRAW_CARD,
      ActionType.PASS_TURN
    ];

    for (const priority of priorities) {
      const action = availableActions.find(a => a.type === priority);
      if (action) {
        return {
          action,
          reasoning: 'Fallback decision due to AI processing error',
          confidence: 30
        };
      }
    }

    // Last resort: first available action (if any)
    if (availableActions.length === 0) {
      return {
        action: undefined as any,
        reasoning: 'Emergency fallback decision - no actions available',
        confidence: 0
      };
    }
    
    return {
      action: availableActions[0],
      reasoning: 'Emergency fallback decision',
      confidence: 10
    };
  }
}

// Predefined AI personalities
export const AI_PERSONALITIES: { [key: string]: AIPersonality } = {
  aggressive: {
    name: 'Aggressive Annie',
    description: 'Plays aggressively, favors attacking and high-risk moves',
    traits: {
      aggressiveness: 0.9,
      patience: 0.2,
      efficiency: 0.6,
      unpredictability: 0.4
    }
  },
  
  control: {
    name: 'Control Carl',
    description: 'Patient player who waits for optimal opportunities',
    traits: {
      aggressiveness: 0.3,
      patience: 0.9,
      efficiency: 0.8,
      unpredictability: 0.2
    }
  },
  
  balanced: {
    name: 'Balanced Beth',
    description: 'Well-rounded player with moderate traits',
    traits: {
      aggressiveness: 0.5,
      patience: 0.5,
      efficiency: 0.7,
      unpredictability: 0.3
    }
  },
  
  chaotic: {
    name: 'Chaotic Charlie',
    description: 'Unpredictable player who makes surprising moves',
    traits: {
      aggressiveness: 0.6,
      patience: 0.4,
      efficiency: 0.4,
      unpredictability: 0.9
    }
  },
  
  efficient: {
    name: 'Efficient Emma',
    description: 'Highly strategic player who optimizes every move',
    traits: {
      aggressiveness: 0.4,
      patience: 0.6,
      efficiency: 0.95,
      unpredictability: 0.1
    }
  }
};