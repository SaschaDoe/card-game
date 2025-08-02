// AI Manager for coordinating AI players in games

import type { 
  GameState, 
  GameAction, 
  Player,
  GameEngine 
} from '../engine/types.js';
import type { LLMClient } from '../llm/client.js';
import { AIPlayer, type AIPersonality, AI_PERSONALITIES } from './ai-player.js';

export interface AIGameSession {
  gameId: string;
  aiPlayers: Map<string, AIPlayer>;
  gameEngine: GameEngine;
  isRunning: boolean;
  autoPlay: boolean;
  turnDelay: number; // milliseconds between AI moves
}

export interface AITurnResult {
  playerId: string;
  action: GameAction;
  reasoning: string;
  confidence: number;
  success: boolean;
  error?: string;
}

export class AIManager {
  private llmClient: LLMClient;
  private sessions: Map<string, AIGameSession> = new Map();

  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;
  }

  createAIPlayer(personality: AIPersonality | string): AIPlayer {
    const personalityConfig = typeof personality === 'string' 
      ? AI_PERSONALITIES[personality] || AI_PERSONALITIES.balanced
      : personality;
    
    return new AIPlayer(this.llmClient, personalityConfig);
  }

  async startAIGame(
    gameEngine: GameEngine,
    gameState: GameState,
    aiPlayerConfigs: { playerId: string; personality: string | AIPersonality }[],
    options: { autoPlay?: boolean; turnDelay?: number } = {}
  ): Promise<string> {
    const sessionId = `ai_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const aiPlayers = new Map<string, AIPlayer>();
    
    // Create AI players for specified player IDs
    for (const config of aiPlayerConfigs) {
      const aiPlayer = this.createAIPlayer(config.personality);
      aiPlayers.set(config.playerId, aiPlayer);
    }

    const session: AIGameSession = {
      gameId: gameState.id,
      aiPlayers,
      gameEngine,
      isRunning: false,
      autoPlay: options.autoPlay || false,
      turnDelay: options.turnDelay || 1000
    };

    this.sessions.set(sessionId, session);
    
    if (session.autoPlay) {
      this.startAutoPlay(sessionId);
    }

    return sessionId;
  }

  async executeAITurn(sessionId: string, gameState: GameState): Promise<AITurnResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`AI session ${sessionId} not found`);
    }

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const aiPlayer = session.aiPlayers.get(currentPlayer.id);
    
    if (!aiPlayer) {
      throw new Error(`No AI configured for player ${currentPlayer.id}`);
    }

    try {
      // Get available actions
      const availableActions = await session.gameEngine.getAvailableActions(gameState, currentPlayer.id);
      
      if (availableActions.length === 0) {
        throw new Error('No actions available for AI player');
      }

      // Update AI knowledge
      const lastEvent = gameState.history[gameState.history.length - 1];
      aiPlayer.updateGameKnowledge(gameState, lastEvent?.action);

      // Get AI decision
      const decision = await aiPlayer.makeDecision({
        gameState,
        player: currentPlayer,
        availableActions,
        gameHistory: gameState.history.map(event => 
          `${event.type}: ${event.action?.description || 'Unknown'}`
        )
      });

      // Execute the action
      const result = await session.gameEngine.executeAction(gameState, decision.action);

      return {
        playerId: currentPlayer.id,
        action: decision.action,
        reasoning: decision.reasoning,
        confidence: decision.confidence,
        success: result.success,
        error: result.errors?.join(', ')
      };
    } catch (error) {
      return {
        playerId: currentPlayer.id,
        action: {
          id: 'error_action',
          type: 'pass_turn' as any,
          playerId: currentPlayer.id,
          description: 'Error fallback',
          timestamp: new Date()
        },
        reasoning: 'Error occurred during AI turn',
        confidence: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async startAutoPlay(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`AI session ${sessionId} not found`);
    }

    session.isRunning = true;

    try {
      while (session.isRunning && session.autoPlay) {
        // Get current game state
        let currentGameState = await session.gameEngine.loadGame(session.gameId);
        
        // Check if game is finished
        if (currentGameState.gameStatus === 'finished') {
          break;
        }

        const currentPlayer = currentGameState.players[currentGameState.currentPlayerIndex];
        
        // Check if current player is AI
        if (session.aiPlayers.has(currentPlayer.id)) {
          const turnResult = await this.executeAITurn(sessionId, currentGameState);
          
          if (!turnResult.success) {
            console.warn(`AI turn failed for ${currentPlayer.name}:`, turnResult.error);
            // Continue anyway to avoid infinite loops
          }

          // Update game state after action
          currentGameState = await session.gameEngine.loadGame(session.gameId);
          
          // Add delay between moves for better UX
          if (session.turnDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, session.turnDelay));
          }
        } else {
          // Human player turn - stop auto play and wait
          session.isRunning = false;
          break;
        }

        // Safety check to prevent infinite loops
        const maxTurns = 1000;
        if (currentGameState.turn > maxTurns) {
          console.warn('Game exceeded maximum turns, stopping auto play');
          break;
        }
      }
    } catch (error) {
      console.error('Auto play error:', error);
      session.isRunning = false;
    }
  }

  stopAutoPlay(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isRunning = false;
    }
  }

  isPlayerAI(sessionId: string, playerId: string): boolean {
    const session = this.sessions.get(sessionId);
    return session ? session.aiPlayers.has(playerId) : false;
  }

  async getAIAnalysis(sessionId: string, gameState: GameState, playerId: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`AI session ${sessionId} not found`);
    }

    const aiPlayer = session.aiPlayers.get(playerId);
    if (!aiPlayer) {
      throw new Error(`No AI configured for player ${playerId}`);
    }

    return aiPlayer.analyzeGameState(gameState, playerId);
  }

  getAIPersonalities(): { [key: string]: AIPersonality } {
    return AI_PERSONALITIES;
  }

  closeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isRunning = false;
      this.sessions.delete(sessionId);
    }
  }

  async simulateGame(
    gameEngine: GameEngine,
    gameState: GameState,
    aiConfigs: { playerId: string; personality: string }[],
    options: { maxTurns?: number; verbose?: boolean } = {}
  ): Promise<GameState> {
    const sessionId = await this.startAIGame(
      gameEngine,
      gameState,
      aiConfigs,
      { autoPlay: false, turnDelay: 0 }
    );

    const maxTurns = options.maxTurns || 100;
    let currentState = gameState;
    let turn = 0;

    try {
      while (currentState.gameStatus === 'active' && turn < maxTurns) {
        const currentPlayer = currentState.players[currentState.currentPlayerIndex];
        
        if (this.isPlayerAI(sessionId, currentPlayer.id)) {
          const turnResult = await this.executeAITurn(sessionId, currentState);
          
          if (options.verbose) {
            console.log(`Turn ${turn + 1} - ${currentPlayer.name}: ${turnResult.action.description}`);
            console.log(`Reasoning: ${turnResult.reasoning} (Confidence: ${turnResult.confidence}%)`);
          }

          if (!turnResult.success) {
            console.warn(`Turn failed: ${turnResult.error}`);
            break;
          }

          // Get updated state
          currentState = await gameEngine.loadGame(currentState.id);
        } else {
          console.warn(`Non-AI player ${currentPlayer.name} encountered in simulation`);
          break;
        }

        turn++;
      }

      return currentState;
    } finally {
      this.closeSession(sessionId);
    }
  }

  // Get statistics about AI performance
  getSessionStats(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      gameId: session.gameId,
      aiPlayerCount: session.aiPlayers.size,
      isRunning: session.isRunning,
      autoPlay: session.autoPlay,
      aiPlayerIds: Array.from(session.aiPlayers.keys())
    };
  }

  // List all active sessions
  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }
}