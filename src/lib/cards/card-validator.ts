// Card validation system

import {
  UniversalCard,
  CardValidationResult,
  CardProperty,
  CardCollection
} from './types.js';
import { GameType } from '../parser/types.js';

export class CardValidator {
  validateCard(card: UniversalCard, gameType?: string): CardValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    const missingRequiredProperties: string[] = [];

    // Basic validation
    this.validateBasicProperties(card, errors, warnings);
    
    // Game-specific validation
    const targetGameType = gameType || card.gameType;
    this.validateGameSpecificProperties(card, targetGameType, errors, warnings, missingRequiredProperties);
    
    // Advanced validation
    this.validateAbilities(card, warnings, suggestions);
    this.validateStats(card, warnings, suggestions);
    this.validateCosts(card, warnings, suggestions);
    
    // Consistency checks
    this.validateConsistency(card, warnings, suggestions);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      missingRequiredProperties
    };
  }

  validateCollection(collection: CardCollection): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    cardValidations: { [cardId: string]: CardValidationResult };
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    const cardValidations: { [cardId: string]: CardValidationResult } = {};

    // Validate collection metadata
    if (!collection.name || collection.name.trim().length === 0) {
      errors.push('Collection must have a name');
    }

    if (!collection.gameType) {
      errors.push('Collection must specify a game type');
    }

    if (collection.cards.length === 0) {
      warnings.push('Collection contains no cards');
    }

    // Validate individual cards
    for (const card of collection.cards) {
      const validation = this.validateCard(card, collection.gameType);
      cardValidations[card.id] = validation;
      
      if (!validation.isValid) {
        warnings.push(`Card "${card.name}" has validation errors`);
      }
    }

    // Check for duplicate card IDs
    const cardIds = collection.cards.map(c => c.id);
    const duplicateIds = cardIds.filter((id, index) => cardIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      errors.push(`Duplicate card IDs found: ${duplicateIds.join(', ')}`);
    }

    // Game-specific collection validation
    this.validateCollectionGameRules(collection, warnings, suggestions);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      cardValidations
    };
  }

  private validateBasicProperties(card: UniversalCard, errors: string[], warnings: string[]): void {
    // Required basic properties
    if (!card.id || card.id.trim().length === 0) {
      errors.push('Card must have a valid ID');
    }

    if (!card.name || card.name.trim().length === 0) {
      errors.push('Card must have a name');
    }

    if (!card.gameType || card.gameType.trim().length === 0) {
      errors.push('Card must specify a game type');
    }

    if (!card.cardType || card.cardType.trim().length === 0) {
      warnings.push('Card type not specified');
    }

    // Metadata validation
    if (!card.metadata) {
      warnings.push('Card metadata is missing');
    } else {
      if (!card.metadata.source) {
        warnings.push('Card source information is missing');
      }
      if (!card.metadata.parseDate) {
        warnings.push('Card parse date is missing');
      }
    }
  }

  private validateGameSpecificProperties(
    card: UniversalCard, 
    gameType: string, 
    errors: string[], 
    warnings: string[], 
    missingRequired: string[]
  ): void {
    switch (gameType) {
      case GameType.TCG:
        this.validateTCGCard(card, errors, warnings, missingRequired);
        break;
      case GameType.DECKBUILDER:
        this.validateDeckBuilderCard(card, errors, warnings, missingRequired);
        break;
      case GameType.POKER:
        this.validatePokerCard(card, errors, warnings, missingRequired);
        break;
      case GameType.TRICK_TAKING:
        this.validateTrickTakingCard(card, errors, warnings, missingRequired);
        break;
      default:
        // Custom game type - minimal validation
        if (card.properties.length === 0) {
          warnings.push('Custom game card has no properties defined');
        }
    }
  }

  private validateTCGCard(card: UniversalCard, errors: string[], warnings: string[], missingRequired: string[]): void {
    const requiredTCGProperties = ['cost'];
    const creatureRequiredProps = ['power', 'toughness'];

    // Check for cost
    if (!card.costs || Object.keys(card.costs).length === 0) {
      const hasCostProperty = card.properties.some(p => p.name.toLowerCase().includes('cost'));
      if (!hasCostProperty) {
        missingRequired.push('cost');
        warnings.push('TCG card should have a mana/energy cost');
      }
    }

    // Creature-specific validation
    if (card.cardType.toLowerCase().includes('creature')) {
      const hasPower = card.stats?.power !== undefined || card.properties.some(p => p.name === 'power');
      const hasToughness = card.stats?.toughness !== undefined || card.properties.some(p => p.name === 'toughness');
      
      if (!hasPower) {
        missingRequired.push('power');
        warnings.push('Creature card should have power');
      }
      if (!hasToughness) {
        missingRequired.push('toughness');
        warnings.push('Creature card should have toughness');
      }
    }

    // Validate abilities for TCG cards
    if (!card.abilities || card.abilities.length === 0) {
      if (!card.description || card.description.length < 10) {
        warnings.push('TCG card should have abilities or detailed description');
      }
    }
  }

  private validateDeckBuilderCard(card: UniversalCard, errors: string[], warnings: string[], missingRequired: string[]): void {
    // Check for cost
    if (!card.costs || Object.keys(card.costs).length === 0) {
      const hasCostProperty = card.properties.some(p => p.name.toLowerCase().includes('cost'));
      if (!hasCostProperty) {
        missingRequired.push('cost');
        warnings.push('Deck-building card should have a cost');
      }
    }

    // Check for victory points or coin value
    const hasVictoryPoints = card.properties.some(p => p.name.includes('victoryPoints'));
    const hasCoinValue = card.properties.some(p => p.name.includes('coinValue'));
    const hasEffect = card.abilities && card.abilities.length > 0;

    if (!hasVictoryPoints && !hasCoinValue && !hasEffect) {
      warnings.push('Deck-building card should provide victory points, coin value, or special effects');
    }
  }

  private validatePokerCard(card: UniversalCard, errors: string[], warnings: string[], missingRequired: string[]): void {
    const hasSuit = card.properties.some(p => p.name === 'suit');
    const hasRank = card.properties.some(p => p.name === 'rank');

    if (!hasSuit) {
      missingRequired.push('suit');
      errors.push('Poker card must have a suit');
    }

    if (!hasRank) {
      missingRequired.push('rank');
      errors.push('Poker card must have a rank');
    }

    // Validate suit values
    const suitProperty = card.properties.find(p => p.name === 'suit');
    if (suitProperty) {
      const validSuits = ['hearts', 'diamonds', 'clubs', 'spades'];
      if (!validSuits.includes(suitProperty.value.toString().toLowerCase())) {
        errors.push(`Invalid suit: ${suitProperty.value}. Must be one of: ${validSuits.join(', ')}`);
      }
    }

    // Validate rank values
    const rankProperty = card.properties.find(p => p.name === 'rank');
    if (rankProperty) {
      const validRanks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      if (!validRanks.includes(rankProperty.value.toString().toUpperCase())) {
        errors.push(`Invalid rank: ${rankProperty.value}. Must be one of: ${validRanks.join(', ')}`);
      }
    }
  }

  private validateTrickTakingCard(card: UniversalCard, errors: string[], warnings: string[], missingRequired: string[]): void {
    // Similar to poker cards but may have different ranking systems
    const hasSuit = card.properties.some(p => p.name === 'suit');
    const hasRank = card.properties.some(p => p.name === 'rank' || p.name === 'value');

    if (!hasSuit) {
      missingRequired.push('suit');
      warnings.push('Trick-taking card should have a suit');
    }

    if (!hasRank) {
      missingRequired.push('rank');
      warnings.push('Trick-taking card should have a rank or value');
    }
  }

  private validateAbilities(card: UniversalCard, warnings: string[], suggestions: string[]): void {
    if (!card.abilities) return;

    for (const ability of card.abilities) {
      if (!ability.name || ability.name.trim().length === 0) {
        warnings.push('Ability found without a name');
      }

      if (!ability.description || ability.description.trim().length === 0) {
        warnings.push(`Ability "${ability.name}" has no description`);
      }

      if (!ability.timing) {
        suggestions.push(`Consider specifying timing for ability "${ability.name}"`);
      }

      // Check for common ability patterns
      if (ability.description.toLowerCase().includes('when') || ability.description.toLowerCase().includes('whenever')) {
        if (ability.timing !== 'triggered') {
          suggestions.push(`Ability "${ability.name}" appears to be triggered but timing is set to ${ability.timing}`);
        }
      }
    }
  }

  private validateStats(card: UniversalCard, warnings: string[], suggestions: string[]): void {
    if (!card.stats) return;

    // Check for negative stats
    for (const [statName, value] of Object.entries(card.stats)) {
      if (typeof value === 'number' && value < 0) {
        warnings.push(`Stat "${statName}" has negative value: ${value}`);
      }
    }

    // Check for unusual stat combinations
    if (card.stats.power !== undefined && card.stats.toughness !== undefined) {
      const power = Number(card.stats.power);
      const toughness = Number(card.stats.toughness);
      
      if (power > 20 || toughness > 20) {
        suggestions.push('Very high power/toughness values detected - verify these are correct');
      }
    }
  }

  private validateCosts(card: UniversalCard, warnings: string[], suggestions: string[]): void {
    if (!card.costs) return;

    for (const [resourceType, cost] of Object.entries(card.costs)) {
      if (typeof cost === 'number' && cost < 0) {
        warnings.push(`Cost for "${resourceType}" is negative: ${cost}`);
      }

      if (typeof cost === 'number' && cost > 20) {
        suggestions.push(`Very high cost for "${resourceType}": ${cost} - verify this is correct`);
      }
    }
  }

  private validateConsistency(card: UniversalCard, warnings: string[], suggestions: string[]): void {
    // Check consistency between properties and stats
    for (const property of card.properties) {
      if (card.stats && property.name in card.stats) {
        const propValue = property.value;
        const statValue = card.stats[property.name];
        
        if (propValue !== statValue) {
          warnings.push(`Inconsistent values for "${property.name}": property=${propValue}, stat=${statValue}`);
        }
      }
    }

    // Check for contradictory abilities
    if (card.abilities) {
      const abilityTexts = card.abilities.map(a => a.description.toLowerCase());
      
      // Simple contradiction detection
      if (abilityTexts.some(text => text.includes("can't attack")) && 
          abilityTexts.some(text => text.includes('must attack'))) {
        warnings.push('Card has contradictory attack restrictions');
      }
    }
  }

  private validateCollectionGameRules(collection: CardCollection, warnings: string[], suggestions: string[]): void {
    switch (collection.gameType) {
      case GameType.DECKBUILDER:
        this.validateDeckBuilderCollection(collection, warnings, suggestions);
        break;
      case GameType.TCG:
        this.validateTCGCollection(collection, warnings, suggestions);
        break;
      // Add more game-specific collection rules as needed
    }
  }

  private validateDeckBuilderCollection(collection: CardCollection, warnings: string[], suggestions: string[]): void {
    const totalCards = collection.cards.length;
    
    // Check for reasonable deck size
    if (totalCards < 10) {
      warnings.push('Deck-building collection seems small - consider adding more cards');
    } else if (totalCards > 100) {
      suggestions.push('Large collection - consider organizing into multiple decks');
    }

    // Check for victory point cards
    const victoryCards = collection.cards.filter(card => 
      card.properties.some(p => p.name.includes('victoryPoints')) ||
      card.cardType.toLowerCase().includes('victory')
    );

    if (victoryCards.length === 0) {
      warnings.push('Deck-building collection has no victory point cards');
    }
  }

  private validateTCGCollection(collection: CardCollection, warnings: string[], suggestions: string[]): void {
    const totalCards = collection.cards.length;
    
    // Check for reasonable deck size
    if (totalCards < 40) {
      warnings.push('TCG collection seems small for constructed play');
    } else if (totalCards > 250) {
      suggestions.push('Large collection - consider organizing by sets or formats');
    }

    // Check mana curve for TCG decks
    const costsDistribution = this.analyzeCostDistribution(collection.cards);
    if (costsDistribution.averageCost > 5) {
      suggestions.push('High average mana cost - consider adding more low-cost cards');
    }
  }

  private analyzeCostDistribution(cards: UniversalCard[]): { averageCost: number; distribution: { [cost: number]: number } } {
    const distribution: { [cost: number]: number } = {};
    let totalCost = 0;
    let cardCount = 0;

    for (const card of cards) {
      if (card.costs) {
        // Sum all costs for the card
        let cardCost = 0;
        for (const cost of Object.values(card.costs)) {
          if (typeof cost === 'number') {
            cardCost += cost;
          }
        }
        
        distribution[cardCost] = (distribution[cardCost] || 0) + 1;
        totalCost += cardCost;
        cardCount++;
      }
    }

    return {
      averageCost: cardCount > 0 ? totalCost / cardCount : 0,
      distribution
    };
  }
}