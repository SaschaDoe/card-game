# Risk & Resource: Turn Structure Reference

## Turn Overview Diagram
```
┌─────────────────┐
│  UNTAP PHASE    │ → No priority, automatic
├─────────────────┤
│  DRAW PHASE     │ → Draw 2, then priority
├─────────────────┤
│ RESOURCE PHASE  │ → Gain 1 EP, pitch cards, priority
├─────────────────┤
│  MAIN PHASE 1   │ → Play cards, activate abilities
├─────────────────┤
│  COMBAT PHASE   │ → Multiple steps (see below)
├─────────────────┤
│  MAIN PHASE 2   │ → Play cards, activate abilities
├─────────────────┤
│   END PHASE     │ → End step, then cleanup
└─────────────────┘
```

## Detailed Phase Breakdown

### UNTAP PHASE
**Automatic Actions (No Priority):**
1. All tapped permanents untap simultaneously
2. Remove all damage from creatures
3. End all "until end of turn" effects from last turn
4. Remove temporary counters

**Common Triggers:** "At the beginning of your untap step"

---

### DRAW PHASE
**Mandatory Actions:**
1. Active player draws 2 cards
2. If unable to draw, that player loses immediately

**Priority Window:** After drawing

**Common Triggers:** "At the beginning of your draw step"

**Note:** The draw itself cannot be responded to

---

### RESOURCE PHASE
**Automatic Actions:**
1. Active player gains 1 EP

**Optional Actions:**
- Pitch any number of cards for EP
- Pitching doesn't use the stack
- Multiple cards can be pitched simultaneously

**Priority Window:** After gaining EP and pitching

**Common Triggers:** "At the beginning of your resource phase"

---

### MAIN PHASE 1
**Available Actions:**
- Play permanents (sorcery speed)
- Play sorceries
- Play instants
- Activate abilities
- Set traps
- Play one land/landmark (if applicable)

**Priority:** Active player first, then clockwise

**Phase Ends When:** Active player passes priority with empty stack

---

### COMBAT PHASE

#### Beginning of Combat Step
- **Triggers:** "At the beginning of combat"
- **Priority Window:** Yes
- **Common Uses:** Tap potential attackers, buff creatures

#### Declare Attackers Step
1. Active player declares ALL attackers simultaneously
2. Tap each attacker (unless vigilance)
3. Choose target for each (player or creature)
4. **Triggers:** "Whenever ~ attacks"
5. **Priority Window:** After attackers declared

#### Declare Blockers Step
1. Each defending player declares ALL blocks simultaneously
2. Assign blockers to attackers
3. Order multiple blockers (if applicable)
4. **Triggers:** "Whenever ~ blocks"
5. **Priority Window:** After blockers declared

#### Damage Resolution Step
**Part 1 - Fast Damage:**
1. All creatures with Fast deal damage
2. Damage is marked, not subtracted
3. State-based actions check for destroyed creatures

**Part 2 - Normal Damage:**
1. All remaining creatures deal damage
2. Damage assignment order matters for multiple blockers
3. State-based actions check again

**No Priority During Damage**

#### Pressure Resolution Step
- For each unblocked attacker that dealt damage to a player:
  - That player exiles X cards from library (X = damage)
- Check if any player has 10+ exiled cards (loses)

#### End of Combat Step
- **Triggers:** "At end of combat"
- **Priority Window:** Yes
- Remove creatures from combat

---

### MAIN PHASE 2
**Identical to Main Phase 1**
- Same available actions
- Same timing rules
- Common for post-combat plays

---

### END PHASE

#### End Step
1. **Triggers:** "At the beginning of your end step" and "At end of turn"
2. **Priority Window:** Yes
3. Last chance for instant-speed actions

#### Cleanup Step
**Automatic Actions (Usually No Priority):**
1. Active player discards to hand size (10)
2. Remove all damage from creatures
3. End "until end of turn" effects
4. Check state-based actions

**Special Rule:** If anything triggers during cleanup, players get priority and there's another cleanup step

---

## Priority Guide

### When You Have Priority, You Can:
- Play instants
- Activate abilities
- Set traps
- Pass priority

### When You DON'T Have Priority:
- During untap phase
- While drawing cards
- During damage resolution
- During cleanup (usually)

### The Stack and Priority
1. When a spell/ability is played, it goes on the stack
2. Active player gets priority
3. Priority passes clockwise
4. When all players pass in succession, top item resolves
4. Repeat until stack is empty

---

## Quick Timing Reference

### Can Be Done Anytime You Have Priority:
- Play instants
- Activate instant-speed abilities
- Pitch cards for EP
- Set traps

### Can Only Be Done During Your Main Phase (Empty Stack):
- Play sorceries
- Play permanents (unless they have flash)
- Play lands/landmarks
- Activate sorcery-speed abilities

### Can Only Be Done During Specific Phases:
- Declare attackers (your combat phase only)
- Declare blockers (when you're being attacked)

---

## State-Based Actions (Checked Constantly)

These happen automatically before any player gets priority:
1. **Creature Destruction**: Creatures with damage ≥ defense are destroyed
2. **Zero Defense**: Creatures with 0 or less defense are destroyed
3. **Exile Loss**: Players with 10+ exiled cards lose
4. **Library Depletion**: Players who must draw from empty library lose
5. **Win Condition Check**: All win conditions are evaluated
6. **Illegal Attachments**: Auras without legal targets are destroyed
7. **Counter Cancellation**: +1/+1 and -1/-1 counters cancel out
8. **Hand Size**: During cleanup step only, discard to 10 cards
9. **Legend Rule**: Multiple legendary permanents with same name - choose one
10. **Planeswalker Uniqueness**: Multiple planeswalkers with same subtype - choose one

**Timing**: Checked before priority, after spells resolve, performed immediately without using stack

---

## Multiplayer Turn Differences

### Attack Options:
- Can divide attacks among multiple opponents
- Each opponent declares blocks separately
- Pressure damage is applied to each damaged player

### Priority Changes:
- Still passes clockwise
- Skips players who have lost
- "Each opponent" affects all other players

### Timing Windows:
- Same as regular game
- More responses possible due to more players