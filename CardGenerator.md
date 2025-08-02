# Risk & Resource: Card Generation Plan

## Overview
This document outlines the systematic approach to generating actual playable cards for Risk & Resource, moving from rules and concepts to concrete implementations.

## Card Generation Philosophy

### Design Principles
1. **Rules-First Design** - Every card must work within established rules framework
2. **Archetype Identity** - Cards reinforce their archetype's strategic identity
3. **Interaction Density** - Cards create meaningful decisions and interactions
4. **Vanilla to Complex** - Start simple, add complexity through iterations
5. **Consistency Validation** - Every batch undergoes rigorous consistency checks

### Power Level Targets
- **Competitive Viability** - All cards should have potential tournament applications
- **Balanced Risk/Reward** - High-power effects require meaningful costs or risks
- **Synergy Scaling** - Cards work alone but become more powerful in synergy
- **Format Health** - No single card should warp entire metagame

## Batch Structure & Progression

### Batch Organization Principles
- **Thematic Coherence** - Cards within batch work together thematically
- **Mechanical Synergy** - Cards within batch create mechanical interactions
- **Power Level Consistency** - Cards within batch have similar competitive viability
- **Playtesting Viability** - Each batch forms playable deck cores

### Complexity Progression
```
Batch 1-2: Vanilla Foundation
├── Basic creatures with stats only
├── Simple removal spells
├── Straightforward win conditions
└── Core mechanic enablers

Batch 3-4: Mechanical Core  
├── Signature archetype mechanics
├── Basic synergy cards
├── Simple risk effects
└── Fundamental interactions

Batch 5-6: Strategic Depth
├── Complex synergy engines
├── Hybrid archetype cards
├── Counter-mechanic cards
└── Advanced win conditions

Batch 7+: Tournament Polish
├── Sideboard cards
├── Meta-game responses
├── Format-defining engines
└── Competitive balance refinements
```

## Card Generation Workflow

### Phase 1: Batch Planning
1. **Define Batch Theme** - What strategic elements does this batch explore?
2. **Set Card Count** - How many cards needed for thematic completeness?
3. **Establish Power Budget** - What power level targets for this batch?
4. **Document Design Goals** - What should this batch accomplish?

### Phase 2: Individual Card Design
1. **Concept Generation** - Create card concepts fitting batch theme
2. **Mechanical Design** - Implement concepts within rules framework
3. **Cost/Stats Assignment** - Balance power level appropriately
4. **Flavor Integration** - Ensure cards fit archetype identity

### Phase 3: Batch Consistency Check
1. **Rules Compliance** - Do all cards work within established rules?
2. **Power Level Balance** - Are cards appropriately costed for effects?
3. **Synergy Validation** - Do cards create intended interactions?
4. **Archetype Identity** - Do cards reinforce their archetype's themes?

### Phase 4: Integration Validation
1. **Cross-Batch Synergy** - How do new cards interact with existing cards?
2. **Meta-Game Impact** - What strategies do new cards enable/counter?
3. **Format Health Check** - Do new cards create unhealthy gameplay patterns?
4. **Tournament Viability** - Are new cards competitively relevant?

## Consistency Check Procedures

### Card-Level Checks
- **Rules Integration** - Does card work with all existing mechanics?
- **Power Level Appropriateness** - Is card costed correctly for effect?
- **Archetype Alignment** - Does card fit its archetype's identity?
- **Interaction Quality** - Does card create interesting decisions?

### Batch-Level Checks
- **Internal Synergy** - Do batch cards work together as intended?
- **Power Level Distribution** - Is batch's power level curve appropriate?
- **Strategic Coherence** - Does batch advance intended strategic goals?
- **Playtesting Readiness** - Can batch form functional deck cores?

### System-Level Checks
- **Meta-Game Health** - Does batch create unhealthy dominance patterns?
- **Format Diversity** - Does batch increase or decrease strategic options?
- **Competitive Balance** - Are all archetypes still viable after batch addition?
- **Rules Stress Test** - Do new interactions reveal rules gaps?

## Rework Triggers & Procedures

### Card Rework Triggers
- **Rules Violations** - Card breaks or contradicts established rules
- **Power Level Issues** - Card significantly over/under-powered for cost
- **Identity Conflicts** - Card doesn't fit archetype's strategic identity
- **Negative Interactions** - Card creates unfun or broken gameplay patterns

### Batch Rework Triggers
- **Low Synergy Density** - Cards don't create meaningful interactions
- **Power Level Inconsistency** - Wide variance in card power within batch
- **Strategic Incoherence** - Batch doesn't advance clear strategic goals
- **Playtesting Failure** - Batch cards don't form functional strategies

### Rules/Plan Rework Triggers
- **Systematic Card Failures** - Multiple batches consistently fail same checks
- **Unforeseen Interaction Problems** - New card combinations break rules assumptions
- **Strategic Goal Impossibility** - Current rules prevent desired strategic outcomes
- **Competitive Format Issues** - Card generation reveals fundamental balance problems

### Rework Procedures
1. **Issue Identification** - Document specific problems with current design
2. **Root Cause Analysis** - Determine if issue is card-level, batch-level, or systemic
3. **Solution Development** - Design fixes at appropriate level (card/batch/rules)
4. **Implementation** - Apply fixes and update documentation
5. **Re-validation** - Run full consistency checks on reworked elements

## Documentation Standards

### Per-Batch Documentation
- **Design Goals** - What this batch aims to accomplish
- **Thematic Overview** - How cards work together thematically
- **Power Level Analysis** - Expected competitive impact
- **Synergy Map** - How cards interact within batch and with existing cards
- **Consistency Check Results** - Detailed validation outcomes
- **Rework History** - Any changes made and rationale

### Per-Card Documentation
- **Design Rationale** - Why this card exists and what role it fills
- **Power Level Justification** - Why stats/cost/effects are appropriate
- **Interaction Notes** - How card works with other mechanics
- **Playtesting Feedback** - Any issues discovered during validation
- **Version History** - Changes made during development

### Rejected Card Archive
- **Card Concept** - What the card was trying to accomplish
- **Rejection Reason** - Why card was removed from batch
- **Lessons Learned** - What this teaches about future design
- **Potential Salvage** - Could concept work with modifications?

## Implementation Pipeline

### Batch Generation Schedule
```
Week 1-2: Batch Planning & Initial Design
Week 3: Individual Card Implementation  
Week 4: Batch Consistency Checks
Week 5: Integration Validation & Rework
Week 6: Documentation & Archival
```

### Quality Gates
- **Design Review** - All cards reviewed for concept clarity
- **Rules Validation** - All cards tested against comprehensive rules
- **Power Level Review** - All cards evaluated for competitive balance
- **Integration Testing** - All cards tested with existing card pool
- **Final Approval** - Batch approved for inclusion in format

### Version Control Integration
- Each batch gets its own git branch during development
- Consistency check results committed with each batch
- Rework decisions documented in commit messages
- Final batch integration via pull request with full documentation

## Success Metrics

### Card Quality Metrics
- **Rules Compliance Rate** - Percentage of cards passing rules validation
- **Power Level Accuracy** - How well initial costing matches final balance
- **Synergy Achievement** - Percentage of intended interactions that work
- **Competitive Relevance** - How many cards see tournament play

### Format Health Metrics
- **Archetype Viability** - All four archetypes remain competitively viable
- **Strategic Diversity** - Number of distinct viable strategies increases
- **Game Length Stability** - Average game length remains in target range
- **Interaction Density** - Meaningful decisions per game increases

### Process Efficiency Metrics
- **Rework Rate** - Percentage of cards requiring significant revision
- **Batch Success Rate** - Percentage of batches passing integration validation
- **Documentation Completeness** - All required documentation produced
- **Timeline Adherence** - Batches completed within planned schedule

## Next Steps

1. **Create Batch 1** - Foundation vanilla cards from existing examples
2. **Establish v1 Folder Structure** - Organize cards and documentation
3. **Implement First Consistency Check** - Validate initial card batch
4. **Document Design Decisions** - Record rationale for first batch choices
5. **Plan Batch 2** - Build on Batch 1 foundation with mechanical additions

The card generation process begins with formalizing existing example cards, then systematically expanding the card pool while maintaining competitive balance and strategic coherence.