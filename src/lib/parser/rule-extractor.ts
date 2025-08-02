// Universal rule extraction system

import { 
  UniversalGameRules, 
  GameType, 
  RuleExtractionResult, 
  GameSetupRules,
  TurnPhase,
  WinCondition,
  ActionSystem,
  GameAction
} from './types.js';
import type { LLMClient, LLMRequest } from '../llm/index.js';
import { GameTypeClassifier } from './game-classifier.js';

export class RuleExtractor {
  private classifier: GameTypeClassifier;

  constructor(private llmClient?: LLMClient) {
    this.classifier = new GameTypeClassifier(llmClient);
  }

  async extractRules(ruleText: string, title?: string): Promise<RuleExtractionResult> {
    try {
      // First classify the game type
      const classification = await this.classifier.classifyGame(ruleText, title);
      
      // Get template defaults for this game type
      const template = this.classifier.getGameTypeTemplate(classification.gameType);
      const baseRules = template?.defaultRules || {};

      // Extract specific rule components
      const extractedRules: UniversalGameRules = {
        gameType: classification.gameType,
        gameSetup: await this.extractGameSetup(ruleText, classification.gameType),
        playerCount: await this.extractPlayerCount(ruleText, classification.gameType),
        cardProperties: baseRules.cardProperties || {
          requiredProperties: ['name'],
          optionalProperties: []
        },
        turnStructure: await this.extractTurnStructure(ruleText, classification.gameType),
        actionRules: await this.extractActionRules(ruleText, classification.gameType),
        winConditions: await this.extractWinConditions(ruleText, classification.gameType),
        timingRules: await this.extractTimingRules(ruleText, classification.gameType),
        ...baseRules
      };

      // Add game-specific rules
      if (classification.gameType === GameType.TCG) {
        extractedRules.combatRules = await this.extractCombatRules(ruleText);
        extractedRules.resourceSystems = await this.extractResourceSystems(ruleText);
        extractedRules.keywords = await this.extractKeywords(ruleText);
      } else if (classification.gameType === GameType.DECKBUILDER) {
        extractedRules.marketRules = await this.extractMarketRules(ruleText);
        extractedRules.scoringRules = await this.extractScoringRules(ruleText);
      } else if (classification.gameType === GameType.TRICK_TAKING) {
        extractedRules.trickRules = await this.extractTrickRules(ruleText);
        extractedRules.scoringRules = await this.extractScoringRules(ruleText);
      }

      return {
        success: true,
        rules: extractedRules,
        confidence: classification.confidence,
        warnings: this.validateRules(extractedRules)
      };

    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown extraction error'],
        confidence: 0
      };
    }
  }

  private async extractGameSetup(ruleText: string, gameType: GameType): Promise<GameSetupRules> {
    const patterns = {
      playerCount: /(\d+)[-\s]?(?:to|-)[-\s]?(\d+)\s+players?/gi,
      handSize: /(?:starting|initial|deal|draw|start|starts?)\s+(?:hand\s+(?:size|of)|with)?\s*(\d+)\s+cards?|draws?\s+(\d+)\s+cards?/gi,
      deckSize: /(?:deck\s+(?:of|contains|has))?\s*(\d+)\s+cards?/gi
    };

    let playerMin = 2, playerMax = 4;
    let handSize: number | undefined;
    let deckSize: number | undefined;

    // Extract player count
    patterns.playerCount.lastIndex = 0; // Reset regex
    const playerMatch = patterns.playerCount.exec(ruleText);
    if (playerMatch) {
      playerMin = parseInt(playerMatch[1]);
      playerMax = parseInt(playerMatch[2]);
    }

    // Extract hand size
    patterns.handSize.lastIndex = 0; // Reset regex
    const handMatch = patterns.handSize.exec(ruleText);
    if (handMatch) {
      handSize = parseInt(handMatch[1] || handMatch[2]);
    }

    // Extract deck size
    patterns.deckSize.lastIndex = 0; // Reset regex
    const deckMatch = patterns.deckSize.exec(ruleText);
    if (deckMatch) {
      deckSize = parseInt(deckMatch[1]);
    }

    return {
      playerCount: { min: playerMin, max: playerMax },
      startingHandSize: handSize,
      deckSize: deckSize
    };
  }

  private async extractPlayerCount(ruleText: string, gameType: GameType) {
    // Extract from game setup
    const setup = await this.extractGameSetup(ruleText, gameType);
    return setup.playerCount;
  }

  private async extractTurnStructure(ruleText: string, gameType: GameType): Promise<TurnPhase[]> {
    if (!this.llmClient) {
      return this.getDefaultTurnStructure(gameType);
    }

    try {
      const prompt = `
Extract the turn structure from these game rules. List each phase of a turn in order.

Rules:
${ruleText.substring(0, 1500)}

Please respond in this format:
PHASE: [phase name] - [description] - [required/optional] - [actions available]

Turn structure:`;

      const request: LLMRequest = {
        prompt,
        systemPrompt: 'You are an expert at analyzing card game rules. Extract turn structure information clearly and concisely.',
        temperature: 0.2,
        maxTokens: 500
      };

      const response = await this.llmClient.call(request);
      return this.parseTurnStructure(response.content);
    } catch (error) {
      console.warn('Failed to extract turn structure with LLM:', error);
      return this.getDefaultTurnStructure(gameType);
    }
  }

  private parseTurnStructure(response: string): TurnPhase[] {
    const phases: TurnPhase[] = [];
    const lines = response.split('\n');

    for (const line of lines) {
      if (line.startsWith('PHASE:')) {
        const parts = line.replace('PHASE:', '').split(' - ');
        if (parts.length >= 3) {
          phases.push({
            name: parts[0].trim(),
            description: parts[1].trim(),
            optional: parts[2].trim().toLowerCase() === 'optional',
            actions: parts[3] ? parts[3].split(',').map(s => s.trim()) : []
          });
        }
      }
    }

    return phases.length > 0 ? phases : this.getDefaultTurnStructure(GameType.CUSTOM);
  }

  private getDefaultTurnStructure(gameType: GameType): TurnPhase[] {
    switch (gameType) {
      case GameType.TCG:
        return [
          { name: 'Untap', description: 'Untap all your permanents', optional: false, actions: ['untap'] },
          { name: 'Draw', description: 'Draw a card', optional: false, actions: ['draw'] },
          { name: 'Main', description: 'Play cards and activate abilities', optional: true, actions: ['play', 'activate'] },
          { name: 'Combat', description: 'Attack with creatures', optional: true, actions: ['attack', 'block'] },
          { name: 'End', description: 'End your turn', optional: false, actions: ['cleanup'] }
        ];
      case GameType.POKER:
        return [
          { name: 'Deal', description: 'Deal cards to players', optional: false, actions: ['deal'] },
          { name: 'Betting', description: 'Players make bets', optional: false, actions: ['bet', 'call', 'fold', 'raise'] },
          { name: 'Showdown', description: 'Reveal hands and determine winner', optional: false, actions: ['reveal'] }
        ];
      default:
        return [
          { name: 'Action', description: 'Take game actions', optional: false, actions: ['play'] },
          { name: 'End', description: 'End turn', optional: false, actions: ['pass'] }
        ];
    }
  }

  private async extractActionRules(ruleText: string, gameType: GameType): Promise<ActionSystem> {
    // Basic pattern matching for common actions
    const actions: GameAction[] = [];
    
    // Extract common actions based on game type
    if (gameType === GameType.TCG) {
      actions.push(
        { name: 'play', description: 'Play a card', timing: 'sorcery' },
        { name: 'attack', description: 'Attack with creatures', timing: 'sorcery' },
        { name: 'activate', description: 'Activate an ability', timing: 'any' }
      );
    } else if (gameType === GameType.POKER) {
      actions.push(
        { name: 'bet', description: 'Make a bet', timing: 'any' },
        { name: 'call', description: 'Call a bet', timing: 'any' },
        { name: 'fold', description: 'Fold hand', timing: 'any' },
        { name: 'raise', description: 'Raise the bet', timing: 'any' }
      );
    }

    return {
      availableActions: actions,
      timingRules: ['Actions follow turn order', 'Some actions can be taken any time']
    };
  }

  private async extractWinConditions(ruleText: string, gameType: GameType): Promise<WinCondition[]> {
    // Pattern matching for win conditions
    const winPatterns = [
      /win.*(?:by|when|if)(.+)/gi,
      /victory.*(?:by|when|if)(.+)/gi,
      /(?:first|last)\s+(?:player|to)(.+)/gi,
      /(?:most|highest|lowest)(.+)/gi
    ];

    const conditions: WinCondition[] = [];
    
    for (const pattern of winPatterns) {
      let match;
      while ((match = pattern.exec(ruleText)) !== null) {
        conditions.push({
          name: `Win Condition ${conditions.length + 1}`,
          description: match[1].trim(),
          type: 'immediate',
          requirements: [match[1].trim()]
        });
      }
    }

    // Add default win conditions if none found
    if (conditions.length === 0) {
      switch (gameType) {
        case GameType.POKER:
          conditions.push({
            name: 'Best Hand',
            description: 'Have the best poker hand at showdown',
            type: 'immediate',
            requirements: ['showdown', 'best hand']
          });
          break;
        case GameType.TCG:
          conditions.push({
            name: 'Reduce Opponent Life',
            description: 'Reduce opponent life to 0 or less',
            type: 'immediate',
            requirements: ['opponent life <= 0']
          });
          break;
        default:
          conditions.push({
            name: 'Default Win',
            description: 'Meet the game\'s win condition',
            type: 'endgame',
            requirements: ['game end condition met']
          });
      }
    }

    return conditions;
  }

  private async extractTimingRules(ruleText: string, gameType: GameType) {
    return [
      {
        name: 'Turn Order',
        description: 'Players take turns in clockwise order',
        priority: 1,
        conditions: ['game in progress']
      },
      {
        name: 'Action Priority',
        description: 'Active player has priority for actions',
        priority: 2,
        conditions: ['during turn']
      }
    ];
  }

  // Game-specific extraction methods
  private async extractCombatRules(ruleText: string) {
    return {
      enabled: ruleText.toLowerCase().includes('combat') || ruleText.toLowerCase().includes('attack'),
      phases: ['declare attackers', 'declare blockers', 'damage'],
      damageRules: ['attacking creatures deal damage to defending player or blocking creatures'],
      defenseRules: ['creatures can block attacking creatures']
    };
  }

  private async extractResourceSystems(ruleText: string) {
    return [
      {
        name: 'Mana',
        type: 'renewable' as const,
        startingAmount: 0,
        gainRules: ['gain mana from lands'],
        spendRules: ['spend mana to cast spells']
      }
    ];
  }

  private async extractKeywords(ruleText: string) {
    return [
      {
        keyword: 'Flying',
        description: 'Can only be blocked by creatures with flying or reach',
        rules: ['evasion ability'],
        examples: ['Dragon', 'Angel']
      }
    ];
  }

  private async extractMarketRules(ruleText: string) {
    return {
      enabled: true,
      cardPools: ['Kingdom cards', 'Basic cards'],
      acquisitionRules: ['Buy cards with coins'],
      costSystem: 'coin'
    };
  }

  private async extractScoringRules(ruleText: string) {
    return {
      method: 'points' as const,
      scoring: { 'victory card': 1 },
      endConditions: ['three piles empty', 'provinces gone']
    };
  }

  private async extractTrickRules(ruleText: string) {
    return {
      enabled: true,
      trumpRules: ['trump suit beats other suits'],
      followRules: ['must follow suit if possible'],
      winRules: ['highest card of led suit wins unless trumped']
    };
  }

  private validateRules(rules: UniversalGameRules): string[] {
    const warnings: string[] = [];

    if (rules.turnStructure.length === 0) {
      warnings.push('No turn structure defined');
    }

    if (rules.winConditions.length === 0) {
      warnings.push('No win conditions defined');
    }

    if (rules.actionRules.availableActions.length === 0) {
      warnings.push('No actions defined');
    }

    return warnings;
  }
}