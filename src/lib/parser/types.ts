// Universal rule parser types

export enum GameType {
  POKER = 'poker',
  TCG = 'tcg', // Trading Card Game
  DECKBUILDER = 'deckbuilder',
  TRICK_TAKING = 'trick_taking',
  SOCIAL_DEDUCTION = 'social_deduction',
  CUSTOM = 'custom'
}

export interface GameSetupRules {
  playerCount: { min: number; max: number; optimal?: number };
  startingResources?: Record<string, number>;
  startingHandSize?: number;
  deckSize?: number;
  specialSetup?: string[];
}

export interface PlayerCountRules {
  min: number;
  max: number;
  optimal?: number;
  variants?: Record<number, string>; // e.g., { 2: "heads-up", 6: "full table" }
}

export interface CardPropertySystem {
  requiredProperties: string[]; // e.g., ["name", "suit", "rank"] for poker
  optionalProperties: string[];
  customProperties?: Record<string, any>;
}

export interface TurnPhase {
  name: string;
  description: string;
  actions: string[];
  optional: boolean;
  repeatable?: boolean;
}

export interface ActionSystem {
  availableActions: GameAction[];
  timingRules: string[];
  priorityRules?: string[];
}

export interface GameAction {
  name: string;
  description: string;
  cost?: string;
  timing: 'instant' | 'sorcery' | 'any';
  requirements?: string[];
}

export interface WinCondition {
  name: string;
  description: string;
  type: 'immediate' | 'endgame' | 'scoring';
  requirements: string[];
}

export interface ScoringSystem {
  method: 'points' | 'ranking' | 'elimination';
  scoring: Record<string, number>;
  endConditions: string[];
}

export interface ResourceSystem {
  name: string;
  type: 'renewable' | 'limited' | 'accumulating';
  startingAmount?: number;
  gainRules: string[];
  spendRules: string[];
}

export interface CombatSystem {
  enabled: boolean;
  phases?: string[];
  damageRules?: string[];
  defenseRules?: string[];
}

export interface MarketSystem {
  enabled: boolean;
  cardPools?: string[];
  acquisitionRules?: string[];
  costSystem?: string;
}

export interface TrickTakingRules {
  enabled: boolean;
  trumpRules?: string[];
  followRules?: string[];
  winRules?: string[];
}

export interface KeywordDefinition {
  keyword: string;
  description: string;
  rules: string[];
  examples?: string[];
}

export interface StateAction {
  name: string;
  description: string;
  condition: string;
  effect: string;
  timing: 'continuous' | 'triggered';
}

export interface TimingRule {
  name: string;
  description: string;
  priority: number;
  conditions: string[];
}

export interface UniversalGameRules {
  gameType: GameType;
  gameSetup: GameSetupRules;
  playerCount: PlayerCountRules;
  cardProperties: CardPropertySystem;
  turnStructure: TurnPhase[];
  actionRules: ActionSystem;
  winConditions: WinCondition[];
  scoringRules?: ScoringSystem;
  resourceSystems?: ResourceSystem[];
  combatRules?: CombatSystem;
  marketRules?: MarketSystem;
  trickRules?: TrickTakingRules;
  keywords?: KeywordDefinition[];
  stateBasedActions?: StateAction[];
  timingRules: TimingRule[];
}

export interface ParsedRuleDocument {
  title: string;
  gameType: GameType;
  confidence: number; // 0-1 scale of detection confidence
  extractedRules: UniversalGameRules;
  originalText: string;
  metadata: {
    source: string;
    parseDate: Date;
    llmProvider?: string;
    warnings?: string[];
  };
}

export interface GameTypeTemplate {
  gameType: GameType;
  patterns: string[];
  requiredElements: string[];
  defaultRules: Partial<UniversalGameRules>;
  examples: string[];
}

export interface RuleExtractionResult {
  success: boolean;
  rules?: UniversalGameRules;
  errors?: string[];
  warnings?: string[];
  confidence: number;
}