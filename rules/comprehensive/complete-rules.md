# Risk & Resource: Comprehensive Rules
*Version 1.0*

## Table of Contents
1. [Game Concepts](#1-game-concepts)
2. [Game Zones](#2-game-zones)
3. [Card Types](#3-card-types)
4. [Turn Structure](#4-turn-structure)
5. [Priority and Timing](#5-priority-and-timing)
6. [Combat](#6-combat)
7. [Risk Mechanics](#7-risk-mechanics)
8. [Trap System](#8-trap-system)
9. [Win and Loss Conditions](#9-win-and-loss-conditions)
10. [Multiplayer Rules](#10-multiplayer-rules)

## 1. Game Concepts

### 1.1 Energy Points (EP)
- Energy Points are the primary resource used to play cards
- EP has no maximum limit
- EP persists between turns
- EP cannot be negative

### 1.2 Pitch System
- Any card may be pitched (discarded) to gain EP equal to its Pitch Value
- Pitch Values range from 1-3
- Pitched cards are placed on the bottom of the owner's deck in the order they were pitched
- Pitching is an instant-speed action that doesn't use the stack

### 1.3 Card Characteristics
Every card has:
- Name
- Cost (in EP)
- Type and Subtype
- Text box (abilities/effects)
- Pitch Value
- (Creatures only) Power and Defense

## 2. Game Zones

### 2.1 Library (Deck)
- Face-down pile of cards
- Random order unless an effect states otherwise
- Running out of cards doesn't cause immediate loss

### 2.2 Hand
- Maximum hand size: 10 cards
- No maximum during turns, check at end phase
- Hidden information except when revealed by effects

### 2.3 Battlefield
- Public zone where permanents exist
- Cards enter untapped unless stated otherwise
- Permanents remain until destroyed, exiled, or sacrificed

### 2.4 Graveyard
- Public zone for destroyed/discarded cards
- Order matters (cards cannot be rearranged)
- Face-up unless an effect states otherwise

### 2.5 Exile
- Removed from game zone
- Cards here are difficult to interact with
- 10+ cards in exile causes loss
- Public information

### 2.6 Stack
- Zone where spells and abilities exist while resolving
- Last in, first out (LIFO) resolution
- Players can respond to items on the stack

### 2.7 Trap Zone
- Face-down cards set as traps
- Maximum 2 traps per player
- Private information until revealed

## 3. Card Types

### 3.1 Permanent Types

#### 3.1.1 Creatures
- Have Power (damage dealt) and Defense (damage to destroy)
- Can attack and block
- Defense refreshes at start of turn
- Destroyed when damage equals/exceeds defense

#### 3.1.2 Artifacts
- Permanents representing objects/devices
- Typically harder to destroy than other permanents
- Often provide ongoing effects

#### 3.1.3 Enchantments  
- Permanents representing ongoing magical effects
- Can be global or attached to other permanents
- Usually modify game rules

#### 3.1.4 Landmarks
- Powerful permanents affecting all players
- Limit one per player unless stated otherwise
- Often symmetrical effects

#### 3.1.5 Win Conditions
- Special permanents stating victory requirements
- Check continuously while in play
- Can be destroyed/exiled like other permanents

### 3.2 Non-Permanent Types

#### 3.2.1 Instants
- Can be played anytime you have priority
- Go to graveyard after resolving
- Can be set as traps

#### 3.2.2 Sorceries
- Can only be played during main phases with empty stack
- Go to graveyard after resolving
- Cannot be set as traps

## 4. Turn Structure

### 4.1 Untap Phase
1. All tapped permanents untap simultaneously
2. "Until end of turn" effects from previous turn end
3. Damage marked on creatures is removed
4. No player receives priority

### 4.2 Draw Phase
1. Active player draws 2 cards
2. This draw cannot be responded to
3. If unable to draw required cards, that player loses
4. After draw, active player receives priority

### 4.3 Resource Phase
1. Active player gains 1 EP automatically
2. Active player may pitch any number of cards
3. Pitching doesn't use the stack
4. Active player receives priority

### 4.4 Main Phase 1
1. Active player may play cards at sorcery speed
2. Active player may activate abilities
3. All players may play instants when they have priority
4. Phase ends when active player passes with empty stack

### 4.5 Combat Phase

#### 4.5.1 Beginning of Combat
- Triggers that occur "at beginning of combat" happen
- Players receive priority

#### 4.5.2 Declare Attackers
1. Active player declares all attackers simultaneously
2. Tap each attacking creature (unless it has vigilance)
3. Choose target for each attacker (player or creature)
4. Attacking triggers occur
5. Players receive priority

#### 4.5.3 Declare Blockers
1. Defending player declares all blocks simultaneously
2. Each creature may only block one attacker
3. Multiple creatures may block the same attacker
4. Blocking triggers occur
5. Players receive priority

#### 4.5.4 Damage Resolution
1. Fast creatures deal damage first
   - If a creature would be destroyed, it's destroyed before normal damage
2. Normal speed creatures deal damage
3. All damage is dealt simultaneously within each step
4. Creatures assign damage equal to their power
5. Damage is marked on creatures (not subtracted from defense)

#### 4.5.5 Pressure Resolution
1. For each unblocked creature that dealt damage to a player:
   - That player exiles cards from top of library equal to damage
2. This happens after all combat damage

#### 4.5.6 End of Combat
- "Until end of combat" effects end
- Players receive priority

### 4.6 Main Phase 2
- Identical to Main Phase 1

### 4.7 End Phase

#### 4.7.1 End Step
1. "At end of turn" triggers occur
2. Players receive priority

#### 4.7.2 Cleanup Step
1. Active player discards to hand size (10)
2. "Until end of turn" effects end
3. Damage is removed from creatures
4. No player receives priority unless triggers occur

## 5. Priority and Timing

### 5.1 Priority System
- Active player receives priority first
- Priority passes clockwise
- Players may only act when they have priority
- Must pass priority for stack to resolve

### 5.2 The Stack
- Spells and abilities use the stack
- Resolves one item at a time (top down)
- Players receive priority between each resolution
- Stack must be empty to move phases

### 5.3 Timing Restrictions
- Sorcery Speed: Only during your main phase with empty stack
- Instant Speed: Anytime you have priority
- Special Actions (don't use stack):
  - Playing a land/landmark
  - Pitching cards
  - Turning creatures face up

## 6. Combat

### 6.1 Combat Restrictions
- Tapped creatures cannot attack or block
- Creatures cannot attack the turn they enter (unless they have haste)
- Creatures can block the turn they enter
- Each creature may only attack once per turn

### 6.2 Combat Keywords

#### 6.2.1 Speed Modifiers
- **Fast**: Deals damage in first damage step
- **Slow**: Deals damage in second damage step (default)

#### 6.2.2 Evasion Abilities
- **Evasive**: Can only be blocked by Evasive or Reach
- **Unblockable**: Cannot be blocked
- **Menace**: Must be blocked by 2+ creatures

#### 6.2.3 Defensive Abilities
- **Guardian**: Must be blocked if able
- **Reach**: Can block Evasive creatures
- **Armored X**: Prevent first X damage each turn

#### 6.2.4 Damage Abilities
- **Deadly**: Any damage destroys creatures
- **Piercing**: Excess damage transfers to player
- **Double Strike**: Deals damage in both steps

### 6.3 Damage Assignment
1. Attacker assigns damage among blockers
2. Must assign lethal damage before moving to next
3. Lethal = defense minus existing damage
4. With Deadly, 1 damage is lethal

## 7. Risk Mechanics

### 7.1 Risk Resolution
When a risk effect triggers:
1. Declare the risk level (if choice exists)
2. Roll d20
3. Compare to threshold:
   - Low Risk: 6+ (75%)
   - Medium Risk: 11+ (50%)
   - High Risk: 16+ (25%)
   - Extreme Risk: 19+ (10%)

### 7.2 Risk Outcomes
- **Critical Success (20)**: Double the effect (if applicable)
- **Success**: Normal effect
- **Failure by 1-2**: Partial effect (if defined)
- **Failure by 3+**: No effect
- **Critical Failure (1)**: Opponent benefits (if defined)

### 7.3 Risk Modifiers
Some effects modify risk rolls:
- "+X to risk rolls": Add X to the die result
- "Reduce risk level": Use next easier threshold
- "Reroll risk dice": Roll again, must use new result

## 8. Trap System

### 8.1 Setting Traps
1. Pay 1 EP
2. Place any card face-down in trap zone
3. Maximum 2 traps per player
4. Can set traps at instant speed

### 8.2 Trap Types
- **True Trap**: Instant with trap conditions
- **Bluff Trap**: Any non-instant card
- **Delayed Trap**: Permanent that enters when triggered

### 8.3 Trap Triggers
- Each trap card defines its trigger condition
- Triggers are checked continuously
- When triggered, reveal and resolve if instant

### 8.4 Challenging Traps
1. Any player may pay 2 EP to challenge
2. Target player reveals challenged trap
3. If bluff: Trap is discarded, challenger draws 1
4. If real: Trap triggers targeting challenger

### 8.5 Trap Interactions
- "Sweep" effects force all traps to be revealed
- Some effects can steal or copy traps
- Traps are not permanents or spells while face-down

## 9. Win and Loss Conditions

### 9.1 Victory Conditions
A player wins immediately when:
1. They fulfill a Win Condition card's requirements
2. All opponents have lost the game
3. An effect states they win

### 9.2 Loss Conditions
A player loses immediately when:
1. They must draw from empty library
2. They have 10+ cards in exile
3. An effect states they lose
4. They concede the game

### 9.3 Simultaneous Wins/Losses
- If multiple players would win simultaneously, active player wins
- If all players would lose simultaneously, the game is a draw
- Players who have lost cannot win

### 9.4 Win Condition Timing
Win conditions are checked:
- Whenever state-based actions are checked
- At the end of each phase
- Whenever specified by the condition

## 10. Multiplayer Rules

### 10.1 Turn Order
- Play proceeds clockwise
- When a player loses, turn order continues
- Effects that grant turns insert them into order

### 10.2 Targeting
- "Each opponent" = all other players
- "Target opponent" = choose one
- Global effects affect all players including you

### 10.3 Combat
- Attackers choose defending player/creature
- Can divide attacks among multiple opponents
- Each opponent blocks separately

### 10.4 Multiplayer Variants

#### 10.4.1 Alliance Mode
- Players may form alliances during game
- Allies can share win conditions
- Betrayal allowed unless forbidden

#### 10.4.2 Bounty Mode  
- Eliminating a player grants:
  - Their unspent EP
  - One card from their hand
  - Remove their permanents from game

#### 10.4.3 King of the Hill
- One player starts as King
- King begins with 10 EP
- Others draw 1 extra card per turn
- Defeating King makes you new King

### 10.5 Leaving the Game
When a player leaves:
1. All their permanents are exiled
2. All their spells/abilities on stack are removed
3. All their traps are removed
4. Any effects they control end