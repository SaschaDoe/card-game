// Game engine types for universal card game system

import type { UniversalCard, CardCollection } from '../cards/types.js';
import type { UniversalGameRules } from '../parser/types.js';

// Core game state interfaces
export interface GameState {
  id: string;
  gameType: string;
  rules: UniversalGameRules;
  players: Player[];
  currentPlayerIndex: number;
  phase: GamePhase;
  turn: number;
  gameStatus: GameStatus;
  zones: GameZones;
  history: GameEvent[];
  metadata: GameMetadata;
}

export interface Player {
  id: string;
  name: string;
  isAI: boolean;
  life?: number;
  resources: { [resourceType: string]: number };
  zones: PlayerZones;
  statistics: PlayerStatistics;
}

export interface PlayerZones {
  hand: UniversalCard[];
  deck: UniversalCard[];
  graveyard: UniversalCard[];
  inPlay: UniversalCard[];
  exile?: UniversalCard[];
  [customZone: string]: UniversalCard[] | undefined;
}

export interface GameZones {
  shared: UniversalCard[];
  market?: UniversalCard[];
  supply?: UniversalCard[];
  [customZone: string]: UniversalCard[] | undefined;
}

export interface PlayerStatistics {
  cardsPlayed: number;
  cardsDrawn: number;
  damageDealt: number;
  damageReceived: number;
  resourcesSpent: number;
  turnsPlayed: number;
  gameSpecificStats: { [stat: string]: number };
}

export interface GameMetadata {
  startTime: Date;
  lastActionTime: Date;
  expectedDuration?: number;
  format?: string;
  tournament?: boolean;
  seed?: string;
}

// Game phases and states
export interface GamePhase {
  name: string;
  description: string;
  allowedActions: GameAction[];
  priority: Player | null;
  isOptional: boolean;
  timeLimit?: number;
}

export enum GameStatus {
  SETUP = 'setup',
  ACTIVE = 'active',
  PAUSED = 'paused',
  FINISHED = 'finished',
  ERROR = 'error'
}

// Game actions and events
export interface GameAction {
  id: string;
  type: ActionType;
  playerId: string;
  description: string;
  targets?: ActionTarget[];
  costs?: { [resourceType: string]: number };
  requirements?: ActionRequirement[];
  effects?: ActionEffect[];
  timestamp: Date;
}

export enum ActionType {
  PLAY_CARD = 'play_card',
  ACTIVATE_ABILITY = 'activate_ability',
  ATTACK = 'attack',
  BLOCK = 'block',
  DRAW_CARD = 'draw_card',
  DISCARD_CARD = 'discard_card',
  PASS_TURN = 'pass_turn',
  PASS_PRIORITY = 'pass_priority',
  MULLIGAN = 'mulligan',
  CONCEDE = 'concede',
  CUSTOM = 'custom'
}

export interface ActionTarget {
  type: 'card' | 'player' | 'zone' | 'number' | 'choice';
  value: any;
  optional: boolean;
}

export interface ActionRequirement {
  type: 'resource' | 'zone' | 'card_type' | 'player_state' | 'custom';
  condition: string;
  value: any;
}

export interface ActionEffect {
  type: 'modify_resource' | 'move_card' | 'modify_stats' | 'trigger_ability' | 'custom';
  description: string;
  targets: ActionTarget[];
  value?: any;
  duration?: 'instant' | 'turn' | 'permanent' | 'until_condition';
}

export interface GameEvent {
  id: string;
  type: string;
  playerId?: string;
  action?: GameAction;
  result: any;
  timestamp: Date;
  gameState?: Partial<GameState>; // Snapshot for undo/replay
}

// Game creation and configuration
export interface GameConfiguration {
  gameType: string;
  rules: UniversalGameRules;
  playerConfigs: PlayerConfiguration[];
  startingConditions?: StartingConditions;
  variants?: GameVariant[];
  timeControls?: TimeControls;
}

export interface PlayerConfiguration {
  name: string;
  isAI: boolean;
  aiLevel?: 'easy' | 'medium' | 'hard' | 'expert';
  deck?: CardCollection;
  startingResources?: { [resourceType: string]: number };
  customSettings?: { [key: string]: any };
}

export interface StartingConditions {
  startingLife?: number;
  startingHandSize?: number;
  startingResources?: { [resourceType: string]: number };
  setupActions?: GameAction[];
  customConditions?: { [key: string]: any };
}

export interface GameVariant {
  name: string;
  description: string;
  ruleModifications: RuleModification[];
}

export interface RuleModification {
  type: 'add' | 'modify' | 'remove';
  target: string;
  value: any;
}

export interface TimeControls {
  turnTimeLimit?: number;
  gameTimeLimit?: number;
  phaseTimeLimits?: { [phaseName: string]: number };
  timeoutBehavior: 'auto_pass' | 'forfeit' | 'pause';
}

// Game engine interfaces
export interface GameEngine {
  createGame(config: GameConfiguration): Promise<GameState>;
  loadGame(gameId: string): Promise<GameState>;
  saveGame(gameState: GameState): Promise<void>;
  
  executeAction(gameState: GameState, action: GameAction): Promise<GameActionResult>;
  getAvailableActions(gameState: GameState, playerId: string): Promise<GameAction[]>;
  
  advancePhase(gameState: GameState): Promise<GameState>;
  checkWinConditions(gameState: GameState): Promise<WinConditionResult | null>;
  
  validateAction(gameState: GameState, action: GameAction): Promise<ActionValidationResult>;
  undoAction(gameState: GameState): Promise<GameState>;
  
  getGameHistory(gameState: GameState): GameEvent[];
  exportGame(gameState: GameState): Promise<string>;
  importGame(gameData: string): Promise<GameState>;
}

export interface GameActionResult {
  success: boolean;
  newState: GameState;
  events: GameEvent[];
  errors?: string[];
  warnings?: string[];
}

export interface ActionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestedAlternatives?: GameAction[];
}

export interface WinConditionResult {
  winner: Player | null;
  condition: string;
  description: string;
  gameEnded: boolean;
}

// Rule enforcement interfaces
export interface RuleEngine {
  enforceRules(gameState: GameState, action: GameAction): Promise<RuleEnforcementResult>;
  checkTimingRules(gameState: GameState, action: GameAction): Promise<boolean>;
  processTriggers(gameState: GameState, event: GameEvent): Promise<GameEvent[]>;
  resolveEffects(gameState: GameState, effects: ActionEffect[]): Promise<GameState>;
}

export interface RuleEnforcementResult {
  allowed: boolean;
  reasons: string[];
  modifiedAction?: GameAction;
  additionalEffects?: ActionEffect[];
}

// AI and automation interfaces
export interface AIPlayer {
  id: string;
  name: string;
  level: 'easy' | 'medium' | 'hard' | 'expert';
  strategy?: AIStrategy;
  
  selectAction(gameState: GameState, availableActions: GameAction[]): Promise<GameAction>;
  evaluateGameState(gameState: GameState): Promise<number>;
  shouldMulligan(hand: UniversalCard[], rules: UniversalGameRules): Promise<boolean>;
}

export interface AIStrategy {
  name: string;
  description: string;
  weights: { [factor: string]: number };
  customLogic?: (gameState: GameState) => Promise<any>;
}

// Networking and multiplayer interfaces
export interface GameSession {
  id: string;
  gameState: GameState;
  connections: PlayerConnection[];
  settings: SessionSettings;
}

export interface PlayerConnection {
  playerId: string;
  connectionId: string;
  isConnected: boolean;
  lastHeartbeat: Date;
  permissions: string[];
}

export interface SessionSettings {
  allowSpectators: boolean;
  allowPausing: boolean;
  autoSave: boolean;
  saveInterval: number;
  maxInactiveTime: number;
}