// Universal card parser that converts text descriptions to structured cards

import {
  UniversalCard,
  CardParseResult,
  CardParseOptions,
  CardProperty,
  Ability,
  CardMetadata
} from './types.js';
import type { LLMClient, LLMRequest } from '../llm/index.js';
import { GameType } from '../parser/types.js';

export class UniversalCardParser {
  constructor(private llmClient?: LLMClient) {}

  async parseCard(
    cardText: string,
    options: CardParseOptions = {}
  ): Promise<CardParseResult> {
    const startTime = Date.now();
    
    // Handle empty input
    if (!cardText || cardText.trim().length === 0) {
      return {
        success: false,
        errors: ['Card text cannot be empty'],
        confidence: 0,
        originalText: cardText,
        gameType: options.gameType || 'unknown',
        extractedProperties: []
      };
    }
    
    try {
      // Detect game type if not provided
      const gameType = options.gameType || await this.detectGameType(cardText);
      
      // Extract basic card information
      const baseCard = this.extractBaseCardInfo(cardText, gameType);
      
      // Extract game-specific properties
      const properties = await this.extractCardProperties(cardText, gameType);
      
      // Extract abilities and effects
      const abilities = await this.extractAbilities(cardText, gameType);
      
      // Extract costs and resources
      const costs = await this.extractCosts(cardText, gameType);
      
      // Extract stats
      const stats = await this.extractStats(cardText, gameType);
      
      // Extract tags and keywords
      const tags = this.extractTags(cardText, gameType);
      const keywords = this.extractKeywords(cardText, gameType);
      
      const universalCard: UniversalCard = {
        ...baseCard,
        gameType,
        properties,
        abilities,
        costs,
        stats,
        tags,
        keywords
      };
      
      // Calculate confidence score
      const confidence = this.calculateConfidence(cardText, universalCard);
      
      // Validate the parsed card
      const warnings = this.validateParsedCard(universalCard);
      
      return {
        success: true,
        card: universalCard,
        confidence,
        warnings,
        originalText: cardText,
        gameType,
        extractedProperties: properties
      };
      
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown parsing error'],
        confidence: 0,
        originalText: cardText,
        gameType: options.gameType || 'unknown',
        extractedProperties: []
      };
    }
  }

  async parseMultipleCards(
    cardTexts: string[],
    options: CardParseOptions = {}
  ): Promise<CardParseResult[]> {
    const results: CardParseResult[] = [];
    
    for (const cardText of cardTexts) {
      const result = await this.parseCard(cardText, options);
      results.push(result);
    }
    
    return results;
  }

  async parseBulkText(
    bulkText: string,
    options: CardParseOptions = {}
  ): Promise<CardParseResult[]> {
    // Split bulk text into individual card descriptions
    const cardTexts = this.splitBulkText(bulkText);
    return this.parseMultipleCards(cardTexts, options);
  }

  private extractBaseCardInfo(cardText: string, gameType: string) {
    // Extract basic information using patterns
    const lines = cardText.trim().split(/[\r\n]+/);
    const name = lines[0] ? lines[0].trim() : 'Unnamed Card';
    
    // Look for description patterns - try multiple approaches
    let description: string | undefined;
    
    // First try explicit description patterns
    const descriptionMatch = cardText.match(/(?:description|text|effect|ability)[:\s]*([^\n]+)/i);
    if (descriptionMatch) {
      description = descriptionMatch[1].trim();
    } else {
      // If no explicit description, use the rest of the text after the first line
      const lines = cardText.trim().split(/[\r\n]+/);
      if (lines.length > 1) {
        // Skip lines that look like properties (contain colons)
        const descLines = lines.slice(1).filter(line => !line.includes(':') || line.toLowerCase().includes('ability'));
        if (descLines.length > 0) {
          description = descLines.join(' ').trim();
        }
      }
    }
    
    // Extract card type
    const typeMatch = cardText.match(/(?:type|card type)[:\s]*([^\n]+)/i);
    const cardType = typeMatch ? typeMatch[1].trim() : this.getDefaultCardType(gameType);
    
    const metadata: CardMetadata = {
      gameType,
      source: 'text_parsing',
      parseDate: new Date(),
      originalText: cardText
    };
    
    return {
      id: this.generateCardId(name, gameType),
      name,
      description,
      cardType,
      metadata
    };
  }

  private async extractCardProperties(cardText: string, gameType: string): Promise<CardProperty[]> {
    const properties: CardProperty[] = [];
    
    // Common property patterns
    const patterns = {
      cost: /(?:cost|mana cost|energy)[:\s]*(\d+|\w+)/gi,
      power: /(?:power|attack|str)[:\s]*(\d+)/gi,
      toughness: /(?:toughness|defense|def|health|hp)[:\s]*(\d+)/gi,
      rarity: /(?:rarity)[:\s]*(common|uncommon|rare|mythic|legendary)/gi,
      type: /(?:creature type|subtype)[:\s]*([^\n]+)/gi
    };
    
    // Extract numeric properties
    for (const [propName, pattern] of Object.entries(patterns)) {
      pattern.lastIndex = 0; // Reset regex
      const matches = [...cardText.matchAll(pattern)];
      
      for (const match of matches) {
        const value = match[1].trim();
        properties.push({
          name: propName,
          value: isNaN(Number(value)) ? value : Number(value),
          type: isNaN(Number(value)) ? 'string' : 'number',
          gameSpecific: this.isGameSpecificProperty(propName, gameType)
        });
      }
    }
    
    // Game-specific property extraction
    if (gameType === GameType.TCG) {
      properties.push(...this.extractTCGProperties(cardText));
    } else if (gameType === GameType.DECKBUILDER) {
      properties.push(...this.extractDeckBuilderProperties(cardText));
    } else if (gameType === GameType.POKER) {
      properties.push(...this.extractPokerProperties(cardText));
    }
    
    return properties;
  }

  private async extractAbilities(cardText: string, gameType: string): Promise<Ability[]> {
    const abilities: Ability[] = [];
    
    // Look for ability patterns - each line that looks like an ability
    const lines = cardText.split(/[\r\n]+/);
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and property lines
      if (!trimmed || trimmed.length < 10) continue;
      
      // Look for specific ability patterns
      const isAbility = 
        trimmed.toLowerCase().includes('when ') ||
        trimmed.toLowerCase().includes('whenever ') ||
        trimmed.toLowerCase().includes('if ') ||
        trimmed.toLowerCase().includes('ability') ||
        trimmed.toLowerCase().includes('effect') ||
        trimmed.toLowerCase().includes('activate') ||
        trimmed.toLowerCase().includes('tap:') ||
        /\b(flying|trample|haste|vigilance|deathtouch|lifelink)\b/i.test(trimmed);
      
      if (isAbility) {
        abilities.push({
          name: this.extractAbilityName(trimmed),
          description: trimmed,
          timing: this.determineAbilityTiming(trimmed),
          conditions: this.extractAbilityConditions(trimmed)
        });
      }
    }
    
    return abilities;
  }

  private async extractCosts(cardText: string, gameType: string): Promise<{ [resourceType: string]: number | string }> {
    const costs: { [resourceType: string]: number | string } = {};
    
    // Common cost patterns
    const costPatterns = {
      mana: /(?:mana cost|cost)[:\s]*(\d+|\{[^}]+\})/gi,
      energy: /(?:energy cost|energy)[:\s]*(\d+)/gi,
      gold: /(?:gold cost|gold)[:\s]*(\d+)/gi,
      generic: /(?:cost)[:\s]*(\d+)/gi
    };
    
    for (const [resourceType, pattern] of Object.entries(costPatterns)) {
      pattern.lastIndex = 0;
      const match = pattern.exec(cardText);
      if (match) {
        const costValue = match[1].trim();
        costs[resourceType] = isNaN(Number(costValue)) ? costValue : Number(costValue);
      }
    }
    
    return costs;
  }

  private async extractStats(cardText: string, gameType: string): Promise<{ [key: string]: number | string | boolean }> {
    const stats: { [key: string]: number | string | boolean } = {};
    
    // Common stat patterns
    const statPatterns = {
      power: /(?:power|attack|atk)[:\s]*(\d+)/gi,
      toughness: /(?:toughness|defense|def|health|hp)[:\s]*(\d+)/gi,
      loyalty: /(?:loyalty)[:\s]*(\d+)/gi,
      value: /(?:value|points)[:\s]*(\d+)/gi
    };
    
    for (const [statName, pattern] of Object.entries(statPatterns)) {
      pattern.lastIndex = 0;
      const match = pattern.exec(cardText);
      if (match) {
        stats[statName] = Number(match[1]);
      }
    }
    
    return stats;
  }

  private extractTags(cardText: string, gameType: string): string[] {
    const tags: string[] = [];
    
    // Extract creature types, subtypes, etc.
    const typeMatch = cardText.match(/(?:creature type|type)[:\s]*([^\n]+)/gi);
    if (typeMatch) {
      const types = typeMatch[0].split(/[,\s]+/).filter(t => t.length > 0);
      tags.push(...types);
    }
    
    // Add game type as tag
    tags.push(gameType);
    
    return [...new Set(tags)]; // Remove duplicates
  }

  private extractKeywords(cardText: string, gameType: string): string[] {
    const keywords: string[] = [];
    
    // Common keywords across different games
    const keywordPatterns = [
      /\b(flying|trample|haste|vigilance|deathtouch|lifelink|first strike|double strike)\b/gi,
      /\b(flash|hexproof|indestructible|menace|reach|defender)\b/gi,
      /\b(draw|discard|destroy|exile|counter|tap|untap)\b/gi
    ];
    
    for (const pattern of keywordPatterns) {
      const matches = [...cardText.matchAll(pattern)];
      for (const match of matches) {
        keywords.push(match[1].toLowerCase());
      }
    }
    
    return [...new Set(keywords)]; // Remove duplicates
  }

  // Game-specific property extractors
  private extractTCGProperties(cardText: string): CardProperty[] {
    const properties: CardProperty[] = [];
    
    // TCG-specific patterns
    const tcgPatterns = {
      manaCost: /(?:mana cost)[:\s]*(\{[^}]+\}|\d+)/gi,
      convertedManaCost: /(?:cmc|converted mana cost)[:\s]*(\d+)/gi,
      colorIdentity: /(?:color|colors)[:\s]*([WUBRG, ]+)/gi
    };
    
    for (const [propName, pattern] of Object.entries(tcgPatterns)) {
      pattern.lastIndex = 0;
      const match = pattern.exec(cardText);
      if (match) {
        properties.push({
          name: propName,
          value: match[1].trim(),
          type: 'string',
          gameSpecific: true
        });
      }
    }
    
    return properties;
  }

  private extractDeckBuilderProperties(cardText: string): CardProperty[] {
    const properties: CardProperty[] = [];
    
    const deckBuilderPatterns = {
      victoryPoints: /(?:victory points|vp)[:\s]*(\d+)/gi,
      coinValue: /(?:coin value|coins?)[:\s]*(\d+)/gi,
      buyValue: /(?:buy|purchase)[:\s]*(\d+)/gi
    };
    
    for (const [propName, pattern] of Object.entries(deckBuilderPatterns)) {
      pattern.lastIndex = 0;
      const match = pattern.exec(cardText);
      if (match) {
        properties.push({
          name: propName,
          value: Number(match[1]),
          type: 'number',
          gameSpecific: true
        });
      }
    }
    
    return properties;
  }

  private extractPokerProperties(cardText: string): CardProperty[] {
    const properties: CardProperty[] = [];
    
    const suitMatch = cardText.match(/(?:suit)[:\s]*(hearts|diamonds|clubs|spades)/i);
    if (suitMatch) {
      properties.push({
        name: 'suit',
        value: suitMatch[1].toLowerCase(),
        type: 'enum',
        gameSpecific: true
      });
    }
    
    const rankMatch = cardText.match(/(?:rank)[:\s]*([AKQJ2-9]|10)/i);
    if (rankMatch) {
      properties.push({
        name: 'rank',
        value: rankMatch[1].toUpperCase(),
        type: 'enum',
        gameSpecific: true
      });
    }
    
    return properties;
  }

  // Helper methods
  private async detectGameType(cardText: string): Promise<string> {
    // Simple game type detection based on keywords
    const text = cardText.toLowerCase();
    
    if (text.includes('mana') || text.includes('creature') || text.includes('spell')) {
      return GameType.TCG;
    }
    if (text.includes('victory points') || text.includes('buy') || text.includes('coins')) {
      return GameType.DECKBUILDER;
    }
    if (text.includes('suit') || text.includes('hearts') || text.includes('spades')) {
      return GameType.POKER;
    }
    
    return GameType.CUSTOM;
  }

  private getDefaultCardType(gameType: string): string {
    switch (gameType) {
      case GameType.TCG: return 'creature';
      case GameType.DECKBUILDER: return 'action';
      case GameType.POKER: return 'playing_card';
      default: return 'card';
    }
  }

  private generateCardId(name: string, gameType: string): string {
    const sanitized = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const timestamp = Date.now().toString(36);
    return `${gameType}_${sanitized}_${timestamp}`;
  }

  private extractAbilityName(abilityText: string): string {
    // Extract first few words as ability name
    const words = abilityText.split(' ').slice(0, 3);
    return words.join(' ').replace(/[^a-zA-Z ]/g, '').trim();
  }

  private determineAbilityTiming(abilityText: string): 'activated' | 'triggered' | 'static' | 'mana' | 'instant' | 'sorcery' {
    const text = abilityText.toLowerCase();
    
    if (text.includes('when') || text.includes('whenever') || text.includes('if')) {
      return 'triggered';
    }
    if (text.includes('tap') || text.includes('activate') || text.includes(':')) {
      return 'activated';
    }
    if (text.includes('instant')) {
      return 'instant';
    }
    if (text.includes('sorcery')) {
      return 'sorcery';
    }
    
    return 'static';
  }

  private extractAbilityConditions(abilityText: string): string[] {
    const conditions: string[] = [];
    
    // Look for condition patterns
    const conditionPatterns = [
      /(?:when|if|whenever)\s+([^,\n]+)/gi,
      /(?:only if|provided that)\s+([^,\n]+)/gi
    ];
    
    for (const pattern of conditionPatterns) {
      pattern.lastIndex = 0;
      const matches = [...abilityText.matchAll(pattern)];
      for (const match of matches) {
        conditions.push(match[1].trim());
      }
    }
    
    return conditions;
  }

  private isGameSpecificProperty(propName: string, gameType: string): boolean {
    const gameSpecificProps = {
      [GameType.TCG]: ['manaCost', 'colorIdentity', 'convertedManaCost'],
      [GameType.DECKBUILDER]: ['victoryPoints', 'coinValue', 'buyValue'],
      [GameType.POKER]: ['suit', 'rank']
    };
    
    return gameSpecificProps[gameType]?.includes(propName) || false;
  }

  private calculateConfidence(cardText: string, card: UniversalCard): number {
    let confidence = 0.3; // Lower base confidence
    
    // Increase confidence based on extracted information
    if (card.name && card.name !== 'Unnamed Card') confidence += 0.15;
    if (card.description && card.description.length > 10) confidence += 0.15;
    if (card.properties.length > 0) confidence += 0.1;
    if (card.abilities && card.abilities.length > 0) confidence += 0.15;
    if (card.costs && Object.keys(card.costs).length > 0) confidence += 0.1;
    if (card.stats && Object.keys(card.stats).length > 0) confidence += 0.1;
    
    // Penalty for very short input
    if (cardText.trim().length < 50) {
      confidence *= 0.8;
    }
    
    return Math.min(confidence, 1.0);
  }

  private validateParsedCard(card: UniversalCard): string[] {
    const warnings: string[] = [];
    
    if (!card.name || card.name === 'Unnamed Card') {
      warnings.push('Card name could not be determined');
    }
    
    if (!card.description) {
      warnings.push('No card description found');
    }
    
    if (card.properties.length === 0) {
      warnings.push('No card properties extracted');
    }
    
    return warnings;
  }

  private splitBulkText(bulkText: string): string[] {
    // Split by double newlines or card separators
    const separators = [/\n\s*\n/, /---+/, /===+/, /Card \d+:/i];
    
    let cards = [bulkText];
    
    for (const separator of separators) {
      const newCards: string[] = [];
      for (const card of cards) {
        newCards.push(...card.split(separator));
      }
      cards = newCards;
    }
    
    return cards
      .map(card => card.trim())
      .filter(card => card.length > 10); // Filter out very short texts
  }
}