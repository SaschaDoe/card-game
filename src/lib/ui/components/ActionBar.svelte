<!-- Action Bar Component for game actions -->
<script lang="ts">
  import type { GameState } from '../../engine/types.js';

  export let gameState: GameState;
  export let currentPlayerId: string;
  export let onAction: (action: any) => void = () => {};

  $: currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
  $: isMyTurn = gameState.players[gameState.currentPlayerIndex]?.id === currentPlayerId;
  $: phase = gameState.phase;

  function handleAction(actionType: string, data: any = {}) {
    if (!isMyTurn) return;
    
    onAction({
      type: actionType,
      playerId: currentPlayerId,
      ...data
    });
  }

  function canPerformAction(actionType: string): boolean {
    if (!isMyTurn) return false;
    
    // Check if action is allowed in current phase
    const allowedActions = phase.allowedActions.map(a => a.type);
    return allowedActions.includes(actionType) || actionType === 'pass_turn';
  }

  // Game-specific action availability
  $: canDrawCard = canPerformAction('draw_card') && currentPlayer?.zones.deck.length > 0;
  $: canPlayCard = canPerformAction('play_card') && currentPlayer?.zones.hand.length > 0;
  $: canAttack = canPerformAction('attack') && currentPlayer?.zones.inPlay.some(card => 
    card.stats?.power && card.stats.power > 0
  );
  $: canUseAbility = currentPlayer?.zones.inPlay.some(card => 
    card.abilities && card.abilities.length > 0
  );
</script>

<div class="action-bar" class:disabled={!isMyTurn}>
  <div class="action-bar-header">
    <h3>Actions</h3>
    <div class="phase-info">
      <span class="phase-name">{phase.name} Phase</span>
      {#if phase.isOptional}
        <span class="optional-indicator">Optional</span>
      {/if}
    </div>
  </div>

  <div class="actions-grid">
    <!-- Core Actions -->
    {#if canDrawCard}
      <button 
        class="action-btn draw-action"
        on:click={() => handleAction('draw_card')}
        title="Draw a card from your deck"
      >
        <div class="action-icon">🃏</div>
        <div class="action-label">Draw Card</div>
        <div class="action-cost">Free</div>
      </button>
    {/if}

    {#if canPlayCard}
      <button 
        class="action-btn play-action"
        on:click={() => handleAction('show_hand')}
        title="Select a card from your hand to play"
      >
        <div class="action-icon">🎯</div>
        <div class="action-label">Play Card</div>
        <div class="action-cost">Varies</div>
      </button>
    {/if}

    {#if canAttack}
      <button 
        class="action-btn attack-action"
        on:click={() => handleAction('show_attackers')}
        title="Select creatures to attack with"
      >
        <div class="action-icon">⚔️</div>
        <div class="action-label">Attack</div>
        <div class="action-cost">Combat</div>
      </button>
    {/if}

    {#if canUseAbility}
      <button 
        class="action-btn ability-action"
        on:click={() => handleAction('show_abilities')}
        title="Use activated abilities"
      >
        <div class="action-icon">✨</div>
        <div class="action-label">Use Ability</div>
        <div class="action-cost">Varies</div>
      </button>
    {/if}

    <!-- Game Type Specific Actions -->
    {#if gameState.gameType.toLowerCase() === 'tcg'}
      <!-- TCG specific actions -->
      {#if phase.name.toLowerCase().includes('main')}
        <button 
          class="action-btn special-action"
          on:click={() => handleAction('advance_phase')}
          title="Move to next phase"
        >
          <div class="action-icon">⏭️</div>
          <div class="action-label">Next Phase</div>
          <div class="action-cost">Free</div>
        </button>
      {/if}
    {:else if gameState.gameType.toLowerCase() === 'poker'}
      <!-- Poker specific actions -->
      <button 
        class="action-btn poker-action"
        on:click={() => handleAction('call')}
        title="Match the current bet"
      >
        <div class="action-icon">💰</div>
        <div class="action-label">Call</div>
        <div class="action-cost">Match Bet</div>
      </button>
      
      <button 
        class="action-btn poker-action"
        on:click={() => handleAction('raise')}
        title="Increase the bet"
      >
        <div class="action-icon">📈</div>
        <div class="action-label">Raise</div>
        <div class="action-cost">+Bet</div>
      </button>
      
      <button 
        class="action-btn poker-fold"
        on:click={() => handleAction('fold')}
        title="Fold your hand"
      >
        <div class="action-icon">🚫</div>
        <div class="action-label">Fold</div>
        <div class="action-cost">Forfeit</div>
      </button>
    {:else if gameState.gameType.toLowerCase() === 'deckbuilder'}
      <!-- Deck builder specific actions -->
      <button 
        class="action-btn buy-action"
        on:click={() => handleAction('show_market')}
        title="Buy cards from the market"
      >
        <div class="action-icon">🛒</div>
        <div class="action-label">Buy Cards</div>
        <div class="action-cost">Coins</div>
      </button>
    {/if}

    <!-- Universal Actions -->
    <button 
      class="action-btn pass-action"
      on:click={() => handleAction('pass_turn')}
      title="End your turn"
    >
      <div class="action-icon">⏩</div>
      <div class="action-label">Pass Turn</div>
      <div class="action-cost">End Turn</div>
    </button>

    <!-- Utility Actions -->
    <button 
      class="action-btn utility-action"
      on:click={() => handleAction('show_game_menu')}
      title="Game options and settings"
    >
      <div class="action-icon">⚙️</div>
      <div class="action-label">Menu</div>
      <div class="action-cost">-</div>
    </button>
  </div>

  <!-- Action Help -->
  <div class="action-help">
    {#if !isMyTurn}
      <div class="help-text waiting">
        Waiting for {gameState.players[gameState.currentPlayerIndex]?.name}'s turn...
      </div>
    {:else}
      <div class="help-text active">
        {#if phase.name.toLowerCase().includes('draw')}
          Draw phase: Draw cards and prepare for your turn
        {:else if phase.name.toLowerCase().includes('main')}
          Main phase: Play cards and activate abilities
        {:else if phase.name.toLowerCase().includes('combat')}
          Combat phase: Attack with your creatures
        {:else if phase.name.toLowerCase().includes('end')}
          End phase: Resolve end-of-turn effects
        {:else}
          {phase.description || `${phase.name} phase is active`}
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .action-bar {
    background: rgba(0, 0, 0, 0.4);
    border-radius: 8px;
    padding: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
  }

  .action-bar.disabled {
    opacity: 0.6;
    pointer-events: none;
  }

  .action-bar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .action-bar-header h3 {
    margin: 0;
    font-size: 1rem;
    color: #ffd700;
  }

  .phase-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .phase-name {
    background: rgba(255, 215, 0, 0.2);
    color: #ffd700;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: bold;
  }

  .optional-indicator {
    background: rgba(156, 163, 175, 0.3);
    color: #9ca3af;
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
    font-size: 0.7rem;
    text-transform: uppercase;
  }

  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .action-btn {
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: white;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.75rem 0.5rem;
    transition: all 0.2s ease;
    font-family: inherit;
    position: relative;
    overflow: hidden;
  }

  .action-btn:hover {
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
    border-color: rgba(255, 255, 255, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .action-btn:active {
    transform: translateY(0);
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .action-icon {
    font-size: 1.5rem;
    margin-bottom: 0.25rem;
  }

  .action-label {
    font-size: 0.8rem;
    font-weight: bold;
    text-align: center;
    line-height: 1.2;
  }

  .action-cost {
    font-size: 0.7rem;
    opacity: 0.8;
    text-align: center;
  }

  /* Action type specific styling */
  .draw-action {
    border-color: rgba(34, 197, 94, 0.5);
  }

  .draw-action:hover {
    border-color: rgba(34, 197, 94, 0.8);
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
  }

  .play-action {
    border-color: rgba(59, 130, 246, 0.5);
  }

  .play-action:hover {
    border-color: rgba(59, 130, 246, 0.8);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
  }

  .attack-action {
    border-color: rgba(239, 68, 68, 0.5);
  }

  .attack-action:hover {
    border-color: rgba(239, 68, 68, 0.8);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
  }

  .ability-action {
    border-color: rgba(168, 85, 247, 0.5);
  }

  .ability-action:hover {
    border-color: rgba(168, 85, 247, 0.8);
    box-shadow: 0 4px 12px rgba(168, 85, 247, 0.2);
  }

  .special-action {
    border-color: rgba(255, 215, 0, 0.5);
  }

  .special-action:hover {
    border-color: rgba(255, 215, 0, 0.8);
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.2);
  }

  .poker-action {
    border-color: rgba(34, 197, 94, 0.5);
  }

  .poker-fold {
    border-color: rgba(156, 163, 175, 0.5);
  }

  .buy-action {
    border-color: rgba(245, 158, 11, 0.5);
  }

  .pass-action {
    border-color: rgba(156, 163, 175, 0.5);
  }

  .utility-action {
    border-color: rgba(107, 114, 128, 0.5);
  }

  .action-help {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 6px;
    padding: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .help-text {
    font-size: 0.8rem;
    line-height: 1.4;
    text-align: center;
  }

  .help-text.waiting {
    color: rgba(255, 255, 255, 0.6);
    font-style: italic;
  }

  .help-text.active {
    color: rgba(255, 255, 255, 0.9);
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .action-bar {
      padding: 0.75rem;
    }

    .actions-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }

    .action-btn {
      padding: 0.5rem 0.25rem;
    }

    .action-icon {
      font-size: 1.2rem;
    }

    .action-label {
      font-size: 0.7rem;
    }

    .action-cost {
      font-size: 0.6rem;
    }

    .phase-info {
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
    }
  }

  @media (max-width: 480px) {
    .actions-grid {
      grid-template-columns: 1fr;
    }

    .action-btn {
      flex-direction: row;
      justify-content: flex-start;
      gap: 0.5rem;
      text-align: left;
    }

    .action-icon {
      font-size: 1rem;
      margin-bottom: 0;
    }

    .action-label,
    .action-cost {
      text-align: left;
    }
  }
</style>