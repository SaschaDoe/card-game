# Risk & Resource: Iterative Improvement Plan
*Version 1.0 - Comprehensive Enhancement Strategy*

## Methodology Overview

### Consistency Check Procedure (Clarified)
**Mental Validation Focus**: Theoretical analysis with specific scenario testing
**Core Test Scenarios**:
1. **1v1 Matchups** - Each archetype vs each other archetype
2. **2v2 Multiplayer** - Alliance dynamics and shared win conditions
3. **Core Mechanic Interactions** - Focus on 3-4 key mechanics per check

**Test Documentation**: Write down what scenarios I test each time to track coverage
**Contradiction Detection**: Actively look for rules that contradict or reference missing elements
**Version Control**: Use git commits for each update, rollback if rules break game fundamentally
**Iterative Flexibility**: Later phases can rewrite earlier work if needed
**Sequential Updates**: Update documents one at a time, propagate changes carefully

### Git Workflow
```
Phase 1A → Commit → Consistency Check A → 
  ↓ (if issues found)
Rollback/Fix → Re-commit → Re-check → 
  ↓ (if passes)
Phase 2A → Commit → Continue...
```

---

## PHASE 1: Critical Systems Repair

### Update 1A: Mathematical Balance Fixes
**Git Commit Message**: "Phase 1A: Fix Assembly Line scaling and Intel economy"

#### Changes:
1. **Assembly Line Cap**: Maximum 4 EP reduction (prevents 1 EP everything)
2. **Intel Scaling Costs**: 1st use normal, 2nd +2 EP, 3rd+ +4 EP per turn
3. **Risk Natural Results**: Universal 20/1 effects, clarify thresholds

#### Documents to Update (Sequential):
1. Comprehensive Rules (sections 1.1, 7.1-7.2)
2. Keyword Glossary (Assembly Line, Intel definitions)
3. Iron Assembly Guide (core mechanic section)
4. Silent Mantle Guide (Intel strategy section)

### Consistency Check A
**Test Scenarios to Document**:

**1v1 Core Tests**:
- Iron Assembly vs Embercore: Assembly Line interaction with fast pressure
- Silent Mantle vs Verdant: Intel accumulation vs Growth strategy timing  
- All archetypes: Risk dice interaction with win conditions

**2v2 Multiplayer Tests**:
- Shared Intel generation in Alliance mode
- Assembly Line cost reduction with multiple Iron players
- Risk effects targeting in team games

**Mechanical Focus Areas**:
- Assembly Line math with 0-cost artifacts
- Intel economy preventing infinite turns  
- Risk threshold consistency across all cards
- Natural 20/1 universal vs card-specific effects

**Contradiction Hunt**:
- Cost reduction stacking rules
- Intel spending timing vs priority system
- Risk failure consequences across documents

**Pass Criteria**: 
- No infinite resource loops possible
- Turn length stays reasonable (max 15 minutes)
- All mathematical interactions defined clearly
- No contradictions between documents

---

## PHASE 2: Foundation Rules Completion

### Update 2A: Core Systems Addition
**Git Commit Message**: "Phase 2A: Add missing foundation rules (SBA, mulligan, face-down)"

#### New Rules Additions:
1. **Complete State-Based Actions List** (8 core actions)
2. **Mulligan procedures** for all formats
3. **Face-down permanent rules** with interaction guide
4. **Combat timing standardization** (Fast damage clarification)

#### Documents to Update:
1. Comprehensive Rules (new sections 2.8, 4.5.4, appendices)
2. Turn Structure Reference (state-based timing)
3. Keyword Glossary (face-down, morph definitions)
4. All archetype guides (combat timing updates)

### Consistency Check B
**Test Scenarios to Document**:

**1v1 Core Tests**:
- Face-down creature interactions with type-specific removal
- Fast combat timing with instant-speed pump spells
- State-based actions triggering during complex turns
- Mulligan impact on each archetype's consistency

**2v2 Multiplayer Tests**:
- State-based actions with multiple players and complex boards
- Face-down permanent targeting in multiplayer
- Fast combat with multiple defending players

**Mechanical Focus Areas**:
- Face-down permanents + all keyword interactions
- Combat timing with all creature abilities
- State-based action ordering and priority
- Mulligan procedures across all formats

**Contradiction Hunt**:
- Combat timing between documents
- Face-down rules vs existing card interactions  
- State-based actions vs win condition checking
- Tournament vs casual mulligan rules

**Pass Criteria**:
- All foundation rules integrate without conflicts
- No timing ambiguities in core interactions
- Tournament-viable mulligan procedures
- Clear face-down interaction guidelines

---

## PHASE 3: Strategic Depth Enhancement

### Update 3A: Cross-Archetype Synergies
**Git Commit Message**: "Phase 3A: Add hybrid cards and counter-mechanics"

#### New Strategic Elements:
1. **Hybrid synergy cards** (6 two-archetype combinations)
2. **Counter-mechanics** for each archetype's signature ability
3. **Alternative build-around themes** within each archetype

#### Documents to Update:
1. All archetype guides (hybrid sections, counter-strategies)
2. Deck Building Guidelines (hybrid construction rules)
3. Win Conditions Compendium (new hybrid win conditions)
4. Keyword Glossary (new hybrid mechanics)

### Consistency Check C
**Test Scenarios to Document**:

**1v1 Core Tests**:
- Each hybrid combination vs pure archetypes
- Counter-mechanics vs their target strategies
- New build-arounds vs existing tier 1 decks
- Cross-archetype win condition interactions

**2v2 Multiplayer Tests**:
- Hybrid archetype team synergies
- Counter-mechanic effects in alliance scenarios
- Multiple build-around strategies on same team

**Mechanical Focus Areas**:
- Hybrid cards don't break individual archetype balance
- Counter-mechanics create interaction without shutdowns
- New themes are viable but not oppressive
- Win condition diversity remains balanced

**Contradiction Hunt**:
- Hybrid mechanics vs existing archetype rules
- Counter-mechanics vs foundation interaction rules
- New keywords vs existing keyword interactions
- Build-around themes vs deck construction limits

**Pass Criteria**:
- Enhanced strategic diversity without power creep
- All archetypes maintain distinct identity
- Counter-play options exist for all strategies
- No hybrid combinations dominate pure archetypes

---

## PHASE 4: Tournament Framework

### Update 4A: Competitive Infrastructure  
**Git Commit Message**: "Phase 4A: Complete tournament and competitive rules"

#### Tournament Additions:
1. **Format definitions** (Standard, Draft, Sealed, Legacy)
2. **Tournament procedures** (timing, penalties, registration)
3. **Comprehensive interaction guide** (50+ edge cases)
4. **Judge reference materials**

#### Documents to Update:
1. New: Tournament Rules document
2. New: Judge Quick Reference
3. Comprehensive Rules (tournament-specific sections)
4. All guides (competitive considerations)

### Final Validation
**Complete System Test**:

**Full Format Testing**:
- Standard tournament simulation
- Draft format balance verification  
- Multiplayer format rule coverage
- Legacy format interaction complexity

**Edge Case Documentation**:
- 50 most common judge calls with rulings
- Multiplayer-specific interactions
- Complex timing scenarios
- Zone change effect interactions

**New Player Assessment**:
- Learning curve evaluation
- Quick Start vs Comprehensive Rules alignment
- Common mistake prevention
- Tutorial scenario completeness

**Pass Criteria**:
- Tournament-ready across all formats
- No critical gaps in competitive rules
- Judge materials comprehensive and clear
- New player pathway complete and accurate

---

## Implementation Tracking

### Test Scenario Log Template
```
Phase X Check [Date]:

1v1 Tests Completed:
- [ ] Archetype A vs B: [Result/Issues]
- [ ] Archetype C vs D: [Result/Issues]
- [etc.]

2v2 Tests Completed:  
- [ ] Team composition X: [Result/Issues]
- [ ] Alliance scenario Y: [Result/Issues]

Mechanical Focus Results:
- [ ] Core Mechanic 1: [Pass/Fail - Details]
- [ ] Core Mechanic 2: [Pass/Fail - Details]

Contradictions Found:
- [ ] Document X vs Y: [Issue - Fixed/Needs work]

Overall: [PASS/FAIL - ROLLBACK]
```

### Git Commit Standards
```
Format: "Phase [X][Letter]: [Brief description]"
Examples:
- "Phase 1A: Fix Assembly Line scaling and Intel economy"  
- "Phase 2A: Add missing foundation rules (SBA, mulligan, face-down)"
- "ROLLBACK: Phase 3A broke archetype balance - reverting"
```

### Document Update Order
1. Comprehensive Rules (foundation changes)
2. References (keyword, turn structure, deck building)  
3. Archetype Guides (strategy updates)
4. Basic Rules (simplification of complex changes)
5. README/Navigation (link updates)

---

## Execution Plan - Ready to Begin

**Next Action**: Execute Phase 1A - Mathematical Balance Fixes
**Focus**: Assembly Line, Intel tokens, Risk dice standardization
**Expected Duration**: 2-3 update cycles with consistency checks
**Success Metric**: No infinite resource loops, reasonable turn length

The plan is now comprehensive, with clear procedures, testing protocols, and quality gates. Ready to begin implementation with Phase 1A.