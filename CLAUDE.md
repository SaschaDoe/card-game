# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains **Risk & Resource**, a tournament-ready card game with 172 cards across 4 distinct archetypes. The project combines a comprehensive rule system with actual card implementations and includes a SvelteKit web application for digital gameplay.

### Game Architecture

**Risk & Resource** is built on innovative mechanics:
- **Energy Points (EP)** - Primary resource with pitch system (discard cards for EP)
- **Risk Dice** - d20 system with graduated success thresholds (6+/11+/16+/19+)
- **Four Archetypes** - Each with unique mechanics and 43-46 tournament-viable cards
- **Advanced Mechanics** - Overcharge, Threshold, Channel, Salvage, and universal Cycle

## Development Commands

### Web Application (SvelteKit)
```bash
# Start development server
npm run dev

# Start with browser auto-open
npm run dev -- --open

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Quality
```bash
# Run all linting and formatting
npm run lint

# Format code with Prettier
npm run format

# Type checking
npm run check

# Watch mode type checking
npm run check:watch
```

### Testing
```bash
# Run all tests (unit + e2e)
npm run test

# Unit tests only
npm run test:unit

# Unit tests in watch mode
npm run test:unit

# E2E tests only
npm run test:e2e
```

## Repository Structure

### Game Design Documents
- **`rules/`** - Complete rule system with comprehensive rules, quick-start guides, and keyword glossary
- **`actual-cards/v1/`** - 172 tournament-ready cards organized in 3 batches with complete design documentation
- **`CardGenerator.md`** - Systematic card generation methodology and batch planning
- **`improvement-plan.md`** - Iterative improvement framework with git-based consistency checking

### Card Organization
Cards are organized by development batch and archetype:
- **Batch 1** (Foundation) - 40 core cards establishing baseline mechanics
- **Batch 2** (Synergy) - 52 cards adding cross-archetype interactions and counter-strategies  
- **Batch 3** (Tournament) - 80 cards completing tournament readiness with 4 new mechanics

Each batch includes comprehensive consistency checks and design rationale documentation.

### Web Application
- **`src/`** - SvelteKit application with TypeScript
- **`e2e/`** - Playwright end-to-end tests
- **`static/`** - Static assets

## Game Design Workflow

### Card Development Process
1. **Design Planning** - Use `CardGenerator.md` methodology for batch planning
2. **Card Creation** - Create cards in appropriate batch folder with archetype organization
3. **Consistency Checking** - Run comprehensive checks validating rules integration, power level, and strategic coherence
4. **Documentation** - Create design rationale and validation documents
5. **Git Integration** - Commit with descriptive messages following established pattern

### Archetype Guidelines
Each archetype has distinct mechanical identity:
- **Embercore Legion** (Fire/Aggro) - Overcharge mechanics, risk/reward, fast creatures
- **Verdant Coil** (Nature/Control) - Growth counters, Threshold graveyard mechanics, defensive scaling
- **Silent Mantle** (Shadow/Tempo) - Channel flexibility, Intel tokens, trap systems, information warfare
- **Iron Assembly** (Artifact/Synergy) - Assembly Line cost reduction, Salvage value, artifact interactions

### Power Level Standards
- **1 EP**: 1-2 power creatures with minor abilities
- **2 EP**: 3-4 damage spells or 2-3 power creatures with utility
- **3+ EP**: Significant board impact or powerful synergy effects
- **Win Conditions**: 4-8 EP with specific achievement requirements

## Rules Integration Requirements

### New Mechanic Integration
When adding mechanics, ensure compatibility with:
- **Existing EP system** - Cost reductions, minimum costs, pitch values
- **State-Based Actions** - Continuous checking, timing windows
- **Intel Token System** - Escalating costs (1st normal, 2nd +2 EP, 3rd+ +4 EP)
- **Assembly Line** - 4 EP maximum cost reduction
- **Risk System** - Universal natural 20/1 effects
- **Trap System** - 2 max face-down permanents per player

### Consistency Validation
All changes require validation against:
- **Rules Compliance** - No conflicts with comprehensive rules
- **Power Level Balance** - Maintain established cost/effect ratios
- **Strategic Coherence** - Enhance archetype identity without dilution
- **Format Health** - No single strategy dominance (target 50-60% win rates)

## Tournament Standards

The game has achieved tournament readiness with:
- **172 total cards** (43-46 per archetype)
- **Multiple viable strategies** per archetype (3+ confirmed)
- **Balanced power distribution** across all archetypes
- **Rich interaction density** (8-12 meaningful decisions per game)
- **Stable game length** (7-10 turns average)

All card additions must maintain these tournament standards and undergo comprehensive consistency checking before integration.