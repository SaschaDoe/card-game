// Game type classification system

import { GameType, GameTypeTemplate, ParsedRuleDocument } from './types.js';
import type { LLMClient, LLMRequest } from '../llm/index.js';

export class GameTypeClassifier {
  private templates: Map<GameType, GameTypeTemplate> = new Map();

  constructor(private llmClient?: LLMClient) {
    this.initializeTemplates();
  }

  async classifyGame(ruleText: string, title?: string): Promise<{
    gameType: GameType;
    confidence: number;
    reasoning?: string;
  }> {
    // First try pattern-based classification
    const patternResult = this.classifyByPatterns(ruleText, title);
    
    // If confidence is low and LLM is available, use AI classification
    if (patternResult.confidence < 0.7 && this.llmClient) {
      try {
        const llmResult = await this.classifyWithLLM(ruleText, title);
        // Use LLM result if confidence is higher
        if (llmResult.confidence > patternResult.confidence) {
          return llmResult;
        }
      } catch (error) {
        console.warn('LLM classification failed, using pattern-based result:', error);
      }
    }

    return patternResult;
  }

  private classifyByPatterns(ruleText: string, title?: string): {
    gameType: GameType;
    confidence: number;
  } {
    const text = (title + ' ' + ruleText).toLowerCase();
    const scores: Map<GameType, number> = new Map();

    // Initialize scores
    for (const gameType of this.templates.keys()) {
      scores.set(gameType, 0);
    }

    // Score based on keyword patterns
    for (const [gameType, template] of this.templates) {
      let score = 0;
      let patternMatches = 0;

      for (const pattern of template.patterns) {
        if (text.includes(pattern.toLowerCase())) {
          score += 1;
          patternMatches++;
        }
      }

      // Bonus for required elements
      let requiredMatches = 0;
      for (const required of template.requiredElements) {
        if (text.includes(required.toLowerCase())) {
          score += 2;
          requiredMatches++;
        }
      }

      // Calculate confidence based on pattern density and required elements
      const patternDensity = patternMatches / template.patterns.length;
      const requiredCoverage = requiredMatches / template.requiredElements.length;
      
      // For TCG, require more specific matches to avoid false positives
      if (gameType === GameType.TCG && requiredMatches < 2) {
        score = 0; // Reset score if insufficient required elements for TCG
      }
      
      // Give more weight to pattern matches for better detection
      const finalScore = score * (0.6 * patternDensity + 0.4 * requiredCoverage);

      scores.set(gameType, finalScore);
    }

    // Find best match
    let bestType = GameType.CUSTOM;
    let bestScore = 0;

    for (const [gameType, score] of scores) {
      if (score > bestScore) {
        bestScore = score;
        bestType = gameType;
      }
    }

    // Calculate confidence (0-1 scale)  
    const maxPossibleScore = 6; // More realistic estimate based on scoring
    const confidence = Math.min(bestScore / maxPossibleScore, 1);

    // Handle empty input
    if (ruleText.trim().length === 0) {
      return {
        gameType: GameType.CUSTOM,
        confidence: 0
      };
    }

    return {
      gameType: bestType,
      confidence: confidence < 0.3 ? 0.1 : confidence // Minimum confidence threshold
    };
  }

  private async classifyWithLLM(ruleText: string, title?: string): Promise<{
    gameType: GameType;
    confidence: number;
    reasoning: string;
  }> {
    const prompt = this.buildClassificationPrompt(ruleText, title);
    
    const request: LLMRequest = {
      prompt,
      systemPrompt: 'You are an expert in card game classification. Analyze game rules and classify them accurately.',
      temperature: 0.1, // Low temperature for consistent classification
      maxTokens: 300
    };

    const response = await this.llmClient!.call(request);
    return this.parseClassificationResponse(response.content);
  }

  private buildClassificationPrompt(ruleText: string, title?: string): string {
    const gameTypes = Object.values(GameType).join(', ');
    
    return `
Analyze the following card game rules and classify the game type.

${title ? `Game Title: ${title}` : ''}

Rules:
${ruleText.substring(0, 2000)} ${ruleText.length > 2000 ? '...' : ''}

Available game types: ${gameTypes}

Please respond in this exact format:
GAME_TYPE: [one of the available types]
CONFIDENCE: [0.0 to 1.0]
REASONING: [brief explanation of your classification]

Classification:`;
  }

  private parseClassificationResponse(response: string): {
    gameType: GameType;
    confidence: number;
    reasoning: string;
  } {
    const lines = response.split('\n');
    let gameType = GameType.CUSTOM;
    let confidence = 0.5;
    let reasoning = 'LLM classification';

    for (const line of lines) {
      if (line.startsWith('GAME_TYPE:')) {
        const typeStr = line.replace('GAME_TYPE:', '').trim().toLowerCase();
        if (Object.values(GameType).includes(typeStr as GameType)) {
          gameType = typeStr as GameType;
        }
      } else if (line.startsWith('CONFIDENCE:')) {
        const confStr = line.replace('CONFIDENCE:', '').trim();
        const parsed = parseFloat(confStr);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          confidence = parsed;
        }
      } else if (line.startsWith('REASONING:')) {
        reasoning = line.replace('REASONING:', '').trim();
      }
    }

    return { gameType, confidence, reasoning };
  }

  private initializeTemplates(): void {
    // Poker template
    this.templates.set(GameType.POKER, {
      gameType: GameType.POKER,
      patterns: [
        'poker', 'texas hold', 'betting', 'blinds', 'flop', 'turn', 'river',
        'hole cards', 'community cards', 'showdown', 'all-in', 'fold'
      ],
      requiredElements: ['betting', 'cards', 'hand'],
      defaultRules: {
        gameType: GameType.POKER,
        playerCount: { min: 2, max: 10, optimal: 6 },
        cardProperties: {
          requiredProperties: ['rank', 'suit'],
          optionalProperties: ['value']
        }
      },
      examples: ['Texas Hold\'em', 'Five Card Draw', 'Omaha']
    });

    // TCG template
    this.templates.set(GameType.TCG, {
      gameType: GameType.TCG,
      patterns: [
        'mana', 'creatures', 'spells', 'battlefield', 'graveyard', 'library',
        'cast', 'tap', 'power', 'toughness', 'attack', 'block', 'damage',
        'destroy', 'counter', 'ability', 'triggered', 'activated',
        'energy points', 'ep', 'artifacts', 'victory conditions', 'control',
        'pitch', 'defense', 'main phase', 'draw phase', 'end phase'
      ],
      requiredElements: ['cards', 'turn', 'creatures'],
      defaultRules: {
        gameType: GameType.TCG,
        playerCount: { min: 2, max: 4, optimal: 2 },
        combatRules: { enabled: true }
      },
      examples: ['Magic: The Gathering', 'Yu-Gi-Oh!', 'Pokémon TCG']
    });

    // Deck-building template
    this.templates.set(GameType.DECKBUILDER, {
      gameType: GameType.DECKBUILDER,
      patterns: [
        'buy', 'purchase', 'market', 'supply', 'victory points', 'province',
        'curse', 'trash', 'gain', 'cost', 'copper', 'silver', 'gold'
      ],
      requiredElements: ['buy', 'cards', 'deck'],
      defaultRules: {
        gameType: GameType.DECKBUILDER,
        playerCount: { min: 2, max: 4, optimal: 3 },
        marketRules: { enabled: true },
        scoringRules: { method: 'points', scoring: {}, endConditions: [] }
      },
      examples: ['Dominion', 'Ascension', 'Star Realms']
    });

    // Trick-taking template
    this.templates.set(GameType.TRICK_TAKING, {
      gameType: GameType.TRICK_TAKING,
      patterns: [
        'trick', 'trump', 'follow suit', 'lead', 'hearts', 'spades', 'clubs',
        'diamonds', 'queen of spades', 'shooting the moon', 'pass', 'book'
      ],
      requiredElements: ['trick', 'suit', 'cards'],
      defaultRules: {
        gameType: GameType.TRICK_TAKING,
        playerCount: { min: 3, max: 6, optimal: 4 },
        trickRules: { enabled: true },
        scoringRules: { method: 'points', scoring: {}, endConditions: [] }
      },
      examples: ['Hearts', 'Spades', 'Bridge', 'Euchre']
    });

    // Social deduction template
    this.templates.set(GameType.SOCIAL_DEDUCTION, {
      gameType: GameType.SOCIAL_DEDUCTION,
      patterns: [
        'role', 'hidden', 'vote', 'eliminate', 'mafia', 'werewolf', 'villager',
        'investigate', 'accuse', 'bluff', 'secret', 'identity', 'betray'
      ],
      requiredElements: ['role', 'vote', 'hidden'],
      defaultRules: {
        gameType: GameType.SOCIAL_DEDUCTION,
        playerCount: { min: 5, max: 12, optimal: 8 }
      },
      examples: ['Mafia', 'Werewolf', 'The Resistance', 'Secret Hitler']
    });
  }

  getGameTypeTemplate(gameType: GameType): GameTypeTemplate | undefined {
    return this.templates.get(gameType);
  }

  getAllGameTypes(): GameType[] {
    return Array.from(this.templates.keys());
  }
}