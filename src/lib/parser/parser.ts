// Main universal rule parser

import { ParsedRuleDocument, GameType } from './types.js';
import { GameTypeClassifier } from './game-classifier.js';
import { RuleExtractor } from './rule-extractor.js';
import type { LLMClient } from '../llm/index.js';

export class UniversalRuleParser {
  private classifier: GameTypeClassifier;
  private extractor: RuleExtractor;

  constructor(private llmClient?: LLMClient) {
    this.classifier = new GameTypeClassifier(llmClient);
    this.extractor = new RuleExtractor(llmClient);
  }

  async parseRules(
    ruleText: string, 
    options: {
      title?: string;
      source?: string;
      expectedGameType?: GameType;
    } = {}
  ): Promise<ParsedRuleDocument> {
    const startTime = Date.now();
    
    try {
      // Extract rules using the rule extractor
      const extractionResult = await this.extractor.extractRules(ruleText, options.title);
      
      if (!extractionResult.success || !extractionResult.rules) {
        throw new Error(`Rule extraction failed: ${extractionResult.errors?.join(', ')}`);
      }

      // If expected game type is provided, validate against it
      if (options.expectedGameType && extractionResult.rules.gameType !== options.expectedGameType) {
        extractionResult.rules.gameType = options.expectedGameType;
        extractionResult.confidence = Math.max(0.5, extractionResult.confidence);
      }

      const parseTime = Date.now() - startTime;

      return {
        title: options.title || 'Untitled Game',
        gameType: extractionResult.rules.gameType,
        confidence: extractionResult.confidence,
        extractedRules: extractionResult.rules,
        originalText: ruleText,
        metadata: {
          source: options.source || 'unknown',
          parseDate: new Date(),
          llmProvider: this.llmClient ? 'available' : 'none',
          warnings: extractionResult.warnings
        }
      };

    } catch (error) {
      // Return minimal document on failure
      return {
        title: options.title || 'Failed Parse',
        gameType: GameType.CUSTOM,
        confidence: 0,
        extractedRules: this.createMinimalRules(),
        originalText: ruleText,
        metadata: {
          source: options.source || 'unknown',
          parseDate: new Date(),
          warnings: [error instanceof Error ? error.message : 'Unknown parsing error']
        }
      };
    }
  }

  async parseMultipleFormats(input: {
    markdown?: string;
    plainText?: string;
    pdf?: ArrayBuffer;
    json?: object;
  }, options: { title?: string; source?: string } = {}): Promise<ParsedRuleDocument> {
    
    // Try different input formats in order of preference
    if (input.markdown) {
      return this.parseRules(input.markdown, { ...options, source: 'markdown' });
    }
    
    if (input.plainText) {
      return this.parseRules(input.plainText, { ...options, source: 'text' });
    }
    
    if (input.json && typeof input.json === 'object') {
      // Try to extract text from JSON structure
      const text = this.extractTextFromJson(input.json);
      return this.parseRules(text, { ...options, source: 'json' });
    }
    
    if (input.pdf) {
      // PDF parsing would require additional library
      // For now, return error
      throw new Error('PDF parsing not yet implemented');
    }
    
    throw new Error('No valid input format provided');
  }

  async validateParsedRules(document: ParsedRuleDocument): Promise<{
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  }> {
    const errors: string[] = [];
    const suggestions: string[] = [];

    const rules = document.extractedRules;

    // Check required components
    if (!rules.turnStructure || rules.turnStructure.length === 0) {
      errors.push('No turn structure defined');
      suggestions.push('Add turn phases and action rules');
    }

    if (!rules.winConditions || rules.winConditions.length === 0) {
      errors.push('No win conditions defined');
      suggestions.push('Define how players can win the game');
    }

    if (!rules.actionRules || rules.actionRules.availableActions.length === 0) {
      errors.push('No player actions defined');
      suggestions.push('Specify what actions players can take');
    }

    // Check game type specific requirements
    if (rules.gameType === GameType.TCG && !rules.combatRules?.enabled) {
      suggestions.push('Consider defining combat rules for TCG');
    }

    if (rules.gameType === GameType.DECKBUILDER && !rules.marketRules?.enabled) {
      suggestions.push('Consider defining market/acquisition rules for deck-building game');
    }

    if (rules.gameType === GameType.TRICK_TAKING && !rules.trickRules?.enabled) {
      suggestions.push('Consider defining trick-taking specific rules');
    }

    // Check confidence threshold
    if (document.confidence < 0.3) {
      suggestions.push('Low confidence parse - consider manual review');
    }

    return {
      isValid: errors.length === 0,
      errors,
      suggestions
    };
  }

  getGameTypeInfo(gameType: GameType) {
    return this.classifier.getGameTypeTemplate(gameType);
  }

  getSupportedGameTypes(): GameType[] {
    return this.classifier.getAllGameTypes();
  }

  private createMinimalRules() {
    return {
      gameType: GameType.CUSTOM,
      gameSetup: { playerCount: { min: 2, max: 4 } },
      playerCount: { min: 2, max: 4 },
      cardProperties: { requiredProperties: ['name'], optionalProperties: [] },
      turnStructure: [
        { name: 'Action', description: 'Take actions', optional: false, actions: ['play'] }
      ],
      actionRules: { availableActions: [], timingRules: [] },
      winConditions: [
        { name: 'Default', description: 'Win the game', type: 'endgame' as const, requirements: [] }
      ],
      timingRules: []
    };
  }

  private extractTextFromJson(json: object): string {
    // Simple extraction - could be more sophisticated
    const jsonString = JSON.stringify(json, null, 2);
    
    // Look for common text fields
    const textFields = ['rules', 'description', 'text', 'content', 'body'];
    
    for (const field of textFields) {
      if (field in json && typeof (json as any)[field] === 'string') {
        return (json as any)[field];
      }
    }
    
    return jsonString;
  }
}