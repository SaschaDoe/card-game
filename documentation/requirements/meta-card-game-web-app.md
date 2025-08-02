# Meta Card Game Web App - Requirements Document

## Project Overview

### Vision Statement
Create a universal web application in SvelteKit that can dynamically interpret any card game rules and card descriptions, transform them into playable digital experiences using LLM APIs, and provide both manual and AI-powered gameplay for any card game system from poker to Magic: The Gathering-style games.

### Core Concept
The application serves as a "meta" card game platform that can adapt to ANY card game system by:
1. **Universal Rule Parsing** - Interpret rules from simple poker to complex TCGs
2. **Adaptive Card Generation** - Convert any card description into interactive digital cards
3. **Flexible Game Engine** - Support various game types (trick-taking, deck-building, TCGs, etc.)
4. **AI-Powered Gameplay** - LLM opponents that understand any game's strategy
5. **Cross-Platform Compatibility** - Save/load functionality for all game types

### Supported Game Types
- **Traditional Card Games**: Poker, Bridge, Hearts, Spades, Blackjack
- **Trading Card Games**: Magic: The Gathering, Yu-Gi-Oh!, Pokémon
- **Living Card Games**: Android: Netrunner, Lord of the Rings LCG
- **Deck-Building Games**: Dominion, Ascension, Star Realms
- **Custom Games**: Risk & Resource and user-created systems

## Functional Requirements

### 1. Rule System Parser

#### 1.1 Universal Rule Input Processing
- **Input Formats**: 
  - Markdown documents (Risk & Resource style)
  - Plain text rule documents
  - PDF rule books (with OCR processing)
  - Structured JSON/YAML rule definitions
  - Natural language rule descriptions
- **Game Type Detection**: Automatically classify game type:
  - Traditional card games (trick-taking, shedding, etc.)
  - Trading card games (resource-based, spell-casting)
  - Deck-building games (market mechanics, victory points)
  - Social deduction games (role-based, voting)
- **Universal Content Recognition**: Extract across all game types:
  - Game setup and player count
  - Card types and properties
  - Turn structure and action phases
  - Win/loss conditions and scoring
  - Special rules and exceptions
  - Resource systems (if any)
  - Interaction rules and timing

#### 1.2 Universal Rule Object Generation
- **Adaptive Structure**: Generate game-specific rule objects based on detected game type
- **Universal Rule Categories**:
  ```typescript
  interface UniversalGameRules {
    gameType: GameType; // poker, tcg, deckbuilder, etc.
    gameSetup: GameSetupRules;
    playerCount: PlayerCountRules;
    cardProperties: CardPropertySystem;
    turnStructure: TurnPhase[];
    actionRules: ActionSystem;
    winConditions: WinCondition[];
    scoringRules?: ScoringSystem; // for point-based games
    resourceSystems?: ResourceSystem[]; // for games with resources
    combatRules?: CombatSystem; // for games with combat
    marketRules?: MarketSystem; // for deck-building games
    trickRules?: TrickTakingRules; // for trick-taking games
    keywords?: KeywordDefinition[]; // for complex games
    stateBasedActions?: StateAction[]; // for complex games
    timingRules: TimingRule[];
  }
  ```
- **Game Type Templates**: Pre-built templates for common game types
- **Validation**: Ensure rule consistency within game type constraints
- **Extensibility**: Support hybrid games and custom rule modifications

#### 1.3 LLM Integration for Rule Processing
- **Primary LLM**: Google Gemini Flash (configurable)
- **Fallback Options**: OpenAI GPT, Anthropic Claude, local models
- **Processing Tasks**:
  - Parse complex rule interactions
  - Identify implicit game mechanics
  - Generate missing rule clarifications
  - Validate rule consistency

### 2. Card System Generator

#### 2.1 Card Description Input
- **Input Format**: Markdown files (similar to `actual-cards/v1/batch-*/`)
- **Card Properties Recognition**:
  - Name, cost, type, stats
  - Abilities and effects
  - Keywords and mechanics
  - Rarity and design notes

#### 2.2 Card Object Generation
- **Digital Card Structure**:
  ```typescript
  interface DigitalCard {
    id: string;
    name: string;
    cost: ResourceCost;
    type: CardType;
    stats?: CreatureStats;
    abilities: CardAbility[];
    keywords: Keyword[];
    triggers: EventTrigger[];
    effects: GameEffect[];
    artwork?: string;
    metadata: CardMetadata;
  }
  ```

#### 2.3 Rule Integration
- **Ability Parsing**: Convert text abilities into executable game effects
- **Keyword Resolution**: Link keywords to rule definitions
- **Interaction Validation**: Ensure cards work within rule framework
- **Effect Implementation**: Generate JavaScript functions for card effects

#### 2.4 LLM-Powered Card Processing
- **Text Analysis**: Parse complex ability text into structured effects
- **Rule Compliance**: Validate cards against game rules
- **Missing Information**: Generate implied mechanics or costs
- **Artwork Generation**: Optional AI-generated card artwork

### 3. Game Engine

#### 3.1 Game State Management
- **Game State Object**:
  ```typescript
  interface GameState {
    players: Player[];
    gamePhase: GamePhase;
    turn: number;
    activePlayer: number;
    zones: GameZone[];
    stack: StackObject[];
    triggers: PendingTrigger[];
    rules: GameRules;
  }
  ```

#### 3.2 Action Processing
- **Player Actions**: Card playing, ability activation, combat decisions
- **Automatic Actions**: State-based actions, triggered abilities
- **Rule Enforcement**: Validate all actions against game rules
- **Priority System**: Handle timing and response windows

#### 3.3 AI Integration
- **AI Decision Making**: LLM-powered game decisions
- **Strategic Analysis**: Evaluate board states and optimal plays
- **Multiple AI Personalities**: Different difficulty levels and play styles
- **Human-AI Interaction**: Mixed multiplayer games

### 4. User Experience & Interface Design

#### 4.1 Onboarding & Game Discovery
- **Game Library**: Browse popular card games with thumbnails and descriptions
- **Quick Start Templates**: One-click setup for common games (Poker, Hearts, MTG-style)
- **Import Wizard**: Step-by-step guide for uploading custom rules and cards
- **Tutorial System**: Interactive tutorials for different game types
- **Demo Mode**: Try games without full setup

#### 4.2 Universal Game Setup Interface
- **Smart Game Detection**: Auto-detect game type from uploaded rules
- **Adaptive Setup**: Show relevant options based on detected game type
- **Player Configuration**: 
  - Human vs AI player setup with difficulty levels
  - Online multiplayer lobby system
  - Hot-seat local multiplayer
- **Game Variants**: Support for different formats (tournament, casual, custom rules)
- **Deck/Hand Management**: Import pre-built decks or draft on-the-fly

#### 4.3 Adaptive Gameplay Interface
- **Dynamic Board Layout**: Automatically adapt to game type:
  - Traditional cards: Hand + central play area
  - TCG: Battlefield + graveyard + library zones
  - Deck-builders: Market + deck + discard pile
  - Trick-taking: Trick area + score tracking
- **Smart Card Display**: 
  - Show relevant properties for game type
  - Hover/tap for detailed information
  - Visual highlighting for legal actions
  - Automatic card sorting and organization
- **Context-Aware Controls**: 
  - Only show relevant actions for current game state
  - Intelligent action suggestions
  - Undo/redo functionality where appropriate
  - Keyboard shortcuts for experienced players

#### 4.4 Enhanced User Experience Features
- **Real-time Collaboration**: 
  - Multiplayer with live updates
  - Spectator mode for watching games
  - Chat and communication tools
  - Screen sharing for teaching
- **Accessibility**: 
  - Screen reader compatibility
  - Keyboard-only navigation
  - High contrast modes
  - Adjustable text sizes
  - Voice commands for actions
- **Mobile Responsiveness**: 
  - Touch-optimized controls
  - Swipe gestures for card actions
  - Adaptive layout for small screens
  - Portrait/landscape mode support
- **Customization Options**:
  - Theme selection (dark/light/custom)
  - Card back designs
  - Animation speed controls
  - Sound effect toggles
  - Layout preferences

#### 4.5 Game Management Interface
- **Save/Load System**: 
  - Quick save during games
  - Multiple save slots
  - Auto-save functionality
  - Save game sharing with friends
- **Game History**: 
  - Complete game replays
  - Move-by-move analysis
  - Statistics tracking
  - Performance analytics
- **Rule and Card Editors**: 
  - Visual rule editor with drag-and-drop
  - Card designer with template system
  - Real-time validation and testing
  - Community sharing platform
  - Version control for custom content

#### 4.6 Learning & Help System
- **Contextual Help**: 
  - Rule explanations during gameplay
  - Interactive rule browser
  - FAQ system for common questions
  - Video tutorials and guides
- **AI Assistant**: 
  - Rule clarification on demand
  - Strategy suggestions for beginners
  - Move explanations and analysis
  - Custom game creation assistance
- **Community Features**: 
  - Rule discussion forums
  - User-generated content sharing
  - Rating and review system
  - Featured game collections

### 5. Data Management

#### 5.1 Save/Load System
- **Game State Persistence**: Save/load ongoing games
- **Rule Set Storage**: Save custom rule configurations
- **Card Collections**: Manage different card sets
- **Player Profiles**: Track statistics and preferences

#### 5.2 Data Formats
- **Export Formats**: JSON, Markdown, custom binary
- **Import Compatibility**: Support various input formats
- **Version Control**: Handle rule and card updates
- **Backup System**: Automatic save state protection

## Technical Requirements

### 1. Technology Stack

#### 1.1 Frontend Framework
- **Primary**: SvelteKit with TypeScript
- **Styling**: TailwindCSS for responsive design
- **State Management**: Svelte stores with persistence
- **Animation**: Svelte transitions for smooth gameplay

#### 1.2 LLM Integration
- **API Abstraction**: Unified interface for multiple LLM providers
- **Provider Support**:
  - Google Gemini Flash (primary)
  - OpenAI GPT-4/GPT-3.5
  - Anthropic Claude
  - Local models (Ollama, etc.)
- **Fallback Strategy**: Automatic provider switching on failures
- **Rate Limiting**: Intelligent request management

#### 1.3 Backend Requirements
- **Storage**: Local browser storage with optional cloud sync
- **API Endpoints**: RESTful API for rule and card processing
- **Real-time**: WebSocket support for multiplayer games
- **Security**: API key management and request validation

### 2. Performance Requirements

#### 2.1 Response Times
- **Rule Processing**: < 10 seconds for complete rule sets
- **Card Generation**: < 3 seconds per card
- **Game Actions**: < 100ms for local actions
- **LLM Responses**: < 5 seconds for AI decisions

#### 2.2 Scalability
- **Card Limits**: Support 500+ cards per set
- **Rule Complexity**: Handle complex rule interactions
- **Multiplayer**: 2-8 players per game
- **Concurrent Games**: Multiple games per user

### 3. Quality Requirements

#### 3.1 Reliability
- **LLM Fallbacks**: Graceful degradation when APIs fail
- **Data Integrity**: Robust save/load with corruption detection
- **Error Handling**: Clear error messages and recovery options
- **Testing**: Comprehensive unit and integration tests

#### 3.2 Usability
- **Intuitive Interface**: Clear game state visualization
- **Accessibility**: Screen reader and keyboard navigation support
- **Mobile Responsive**: Tablet and phone compatibility
- **Performance**: Smooth 60fps animations

## Implementation Phases

### Phase 1: Core Infrastructure (Weeks 1-4)
- **Basic SvelteKit setup** with TypeScript and TailwindCSS
- **LLM API integration** with provider abstraction
- **Simple rule parser** for basic game concepts
- **Basic card object generation** from text descriptions

### Phase 2: Game Engine (Weeks 5-8)
- **Game state management** with action processing
- **Rule enforcement engine** with validation
- **Basic UI components** for game visualization
- **Save/load functionality** for game states

### Phase 3: Enhanced Features (Weeks 9-12)
- **AI player integration** with LLM decision making
- **Advanced rule parsing** for complex interactions
- **Card effect implementation** with rule integration
- **Multiplayer support** with real-time updates

### Phase 4: Polish and Testing (Weeks 13-16)
- **Rule and card editors** with validation tools
- **Performance optimization** and error handling
- **Comprehensive testing** with the Risk & Resource card set
- **Documentation and deployment** preparation

## Success Criteria

### 1. Technical Success
- **Rule Accuracy**: 95%+ correct rule interpretation from markdown
- **Card Functionality**: 90%+ cards work correctly without manual fixes
- **Performance**: All response time requirements met
- **Stability**: < 1% critical errors during normal operation

### 2. User Experience Success
- **Usability**: Users can create and play games within 15 minutes
- **Flexibility**: Support for at least 3 different card game systems
- **AI Quality**: AI makes reasonable game decisions 80%+ of the time
- **Reliability**: Save/load works correctly 99%+ of the time

### 3. Integration Success
- **Risk & Resource**: Complete compatibility with existing rules and cards
- **Extensibility**: New card sets can be added in < 1 hour
- **LLM Flexibility**: Easy switching between different AI providers
- **Export/Import**: Seamless data exchange with external tools

## Constraints and Assumptions

### 1. Technical Constraints
- **Browser Compatibility**: Modern browsers with ES2020+ support
- **LLM Dependencies**: Requires internet connection for AI features
- **Performance Limits**: Complex rules may require processing time
- **API Costs**: LLM usage costs must be managed and optimized

### 2. Assumptions
- **Rule Format**: Game rules provided in structured markdown format
- **Card Descriptions**: Cards described in consistent text format
- **User Knowledge**: Basic understanding of card game concepts
- **LLM Availability**: Reliable access to at least one LLM provider

### 3. Future Considerations
- **Offline Mode**: Local rule processing without LLM calls
- **Community Features**: Sharing rules and cards between users
- **Tournament Support**: Organized play and ranking systems
- **Mobile App**: Native mobile application development

This requirements document provides a comprehensive foundation for developing a flexible, AI-powered meta card game platform that can adapt to various card game systems while providing engaging gameplay experiences.