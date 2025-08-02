<!-- Trading Card Game Board Component -->
<script lang="ts">
  import type { GameState, Player } from '../../engine/types.js';
  import CardZone from '../components/CardZone.svelte';
  import PlayerArea from '../components/PlayerArea.svelte';
  import ActionBar from '../components/ActionBar.svelte';

  export let gameState: GameState;
  export let currentPlayerId: string;
  export let onAction: (action: any) => void = () => {};

  $: currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
  $: opponents = gameState.players.filter(p => p.id !== currentPlayerId);
  $: isMyTurn = gameState.players[gameState.currentPlayerIndex]?.id === currentPlayerId;
</script>

<div class="tcg-board">
  <!-- Opponents Area -->
  <div class="opponents-area">
    {#each opponents as opponent}
      <PlayerArea 
        player={opponent} 
        isOpponent={true}
        {gameState}
        {onAction}
      />
    {/each}
  </div>

  <!-- Battlefield / Play Area -->
  <div class="battlefield">
    <div class="battlefield-header">
      <h3>Battlefield</h3>
      <div class="battlefield-info">
        {#if gameState.zones.shared.length > 0}
          <span>Shared: {gameState.zones.shared.length}</span>
        {/if}
      </div>
    </div>
    
    <div class="battlefield-grid">
      <!-- Opponent's creatures/permanents -->
      {#each opponents as opponent}
        <div class="opponent-battlefield">
          <h4>{opponent.name}'s Creatures</h4>
          <CardZone 
            cards={opponent.zones.inPlay} 
            zoneType="battlefield"
            playerId={opponent.id}
            isInteractable={isMyTurn}
            {onAction}
          />
        </div>
      {/each}

      <!-- My creatures/permanents -->
      {#if currentPlayer}
        <div class="my-battlefield">
          <h4>Your Creatures</h4>
          <CardZone 
            cards={currentPlayer.zones.inPlay} 
            zoneType="battlefield"
            playerId={currentPlayer.id}
            isInteractable={true}
            {onAction}
          />
        </div>
      {/if}
    </div>
  </div>

  <!-- Current Player Area -->
  {#if currentPlayer}
    <div class="current-player-area">
      <PlayerArea 
        player={currentPlayer} 
        isOpponent={false}
        {gameState}
        {onAction}
      />
      
      <!-- Hand -->
      <div class="hand-area">
        <div class="hand-header">
          <h3>Hand ({currentPlayer.zones.hand.length})</h3>
          <div class="mana-display">
            {#each Object.entries(currentPlayer.resources) as [resource, amount]}
              <div class="mana-pool" class:available={amount > 0}>
                <span class="mana-symbol">{resource.charAt(0).toUpperCase()}</span>
                <span class="mana-amount">{amount}</span>
              </div>
            {/each}
          </div>
        </div>
        
        <CardZone 
          cards={currentPlayer.zones.hand} 
          zoneType="hand"
          playerId={currentPlayer.id}
          isInteractable={isMyTurn}
          {onAction}
        />
      </div>

      <!-- Action Bar -->
      {#if isMyTurn}
        <ActionBar 
          {gameState}
          {currentPlayerId}
          {onAction}
        />
      {/if}
    </div>
  {/if}

  <!-- Side Areas -->
  <div class="side-areas">
    {#if currentPlayer}
      <!-- Graveyard -->
      <div class="graveyard">
        <h4>Graveyard ({currentPlayer.zones.graveyard.length})</h4>
        <div class="zone-preview">
          {#if currentPlayer.zones.graveyard.length > 0}
            <div class="top-card">
              {currentPlayer.zones.graveyard[currentPlayer.zones.graveyard.length - 1].name}
            </div>
          {:else}
            <div class="empty-zone">Empty</div>
          {/if}
        </div>
      </div>

      <!-- Library/Deck -->
      <div class="library">
        <h4>Library ({currentPlayer.zones.deck.length})</h4>
        <div class="deck-stack">
          {#if currentPlayer.zones.deck.length > 0}
            <div class="card-back"></div>
          {:else}
            <div class="empty-deck">No Cards</div>
          {/if}
        </div>
      </div>

      <!-- Exile -->
      {#if currentPlayer.zones.exile && currentPlayer.zones.exile.length > 0}
        <div class="exile">
          <h4>Exile ({currentPlayer.zones.exile.length})</h4>
          <div class="zone-preview">
            <div class="exiled-cards">
              {currentPlayer.zones.exile.length} cards
            </div>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .tcg-board {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-rows: auto 1fr auto;
    grid-template-areas: 
      "opponents side"
      "battlefield side"
      "current side";
    height: 100%;
    gap: 1rem;
    padding: 1rem;
  }

  .opponents-area {
    grid-area: opponents;
    display: flex;
    gap: 1rem;
    min-height: 120px;
  }

  .battlefield {
    grid-area: battlefield;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 1rem;
    border: 2px dashed rgba(255, 255, 255, 0.2);
  }

  .battlefield-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .battlefield-header h3 {
    margin: 0;
    color: #ffd700;
  }

  .battlefield-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .opponent-battlefield,
  .my-battlefield {
    min-height: 120px;
  }

  .opponent-battlefield h4,
  .my-battlefield h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
    opacity: 0.8;
  }

  .current-player-area {
    grid-area: current;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .hand-area {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .hand-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .hand-header h3 {
    margin: 0;
    color: #4ade80;
  }

  .mana-display {
    display: flex;
    gap: 0.5rem;
  }

  .mana-pool {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.25rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    min-width: 40px;
    min-height: 40px;
    justify-content: center;
    transition: all 0.2s;
  }

  .mana-pool.available {
    background: rgba(45, 90, 160, 0.8);
    box-shadow: 0 0 8px rgba(45, 90, 160, 0.5);
  }

  .mana-symbol {
    font-weight: bold;
    font-size: 0.8rem;
  }

  .mana-amount {
    font-size: 0.7rem;
    margin-top: 2px;
  }

  .side-areas {
    grid-area: side;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 150px;
  }

  .graveyard,
  .library,
  .exile {
    background: rgba(0, 0, 0, 0.4);
    border-radius: 6px;
    padding: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .graveyard h4,
  .library h4,
  .exile h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .zone-preview {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 60px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
    border: 1px dashed rgba(255, 255, 255, 0.2);
  }

  .top-card,
  .empty-zone,
  .exiled-cards {
    font-size: 0.7rem;
    text-align: center;
    opacity: 0.7;
  }

  .deck-stack {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 60px;
  }

  .card-back {
    width: 40px;
    height: 56px;
    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    position: relative;
  }

  .card-back::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 20px;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/></svg>');
  }

  .empty-deck {
    font-size: 0.7rem;
    opacity: 0.5;
    text-align: center;
  }

  /* Responsive adjustments */
  @media (max-width: 1024px) {
    .tcg-board {
      grid-template-columns: 1fr;
      grid-template-areas: 
        "opponents"
        "battlefield"
        "current"
        "side";
    }

    .side-areas {
      flex-direction: row;
      justify-content: center;
    }

    .mana-display {
      flex-wrap: wrap;
    }
  }

  @media (max-width: 768px) {
    .tcg-board {
      padding: 0.5rem;
      gap: 0.5rem;
    }

    .hand-header {
      flex-direction: column;
      gap: 0.5rem;
    }

    .mana-pool {
      min-width: 35px;
      min-height: 35px;
    }
  }
</style>