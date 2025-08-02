<!-- Deck Builder Game Board Component -->
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

<div class="deckbuilder-board">
  <!-- Market Area -->
  <div class="market-area">
    <div class="market-header">
      <h3>Card Market</h3>
      <div class="market-info">
        {#if currentPlayer}
          <span class="coins">Coins: {currentPlayer.resources.coins || 0}</span>
          <span class="buys">Buys: {currentPlayer.resources.buys || 0}</span>
        {/if}
      </div>
    </div>
    
    <div class="market-grid">
      {#if gameState.zones.market.length > 0}
        <CardZone 
          cards={gameState.zones.market} 
          zoneType="market"
          playerId=""
          isInteractable={isMyTurn}
          orientation="grid"
          {onAction}
        />
      {:else}
        <div class="empty-market">
          <div class="empty-message">No cards available for purchase</div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Game Layout -->
  <div class="game-layout">
    <!-- Opponents Area -->
    <div class="opponents-area">
      <h3>Other Players</h3>
      <div class="opponents-list">
        {#each opponents as opponent}
          <div class="opponent-summary">
            <PlayerArea 
              player={opponent} 
              isOpponent={true}
              {gameState}
              {onAction}
            />
          </div>
        {/each}
      </div>
    </div>

    <!-- Current Player Area -->
    {#if currentPlayer}
      <div class="current-player-area">
        <!-- Player Info -->
        <PlayerArea 
          player={currentPlayer} 
          isOpponent={false}
          {gameState}
          {onAction}
        />

        <!-- Play Area -->
        <div class="play-area">
          <div class="play-header">
            <h4>Cards in Play</h4>
            <div class="play-stats">
              {#if currentPlayer.zones.inPlay.length > 0}
                Total Value: {currentPlayer.zones.inPlay.reduce((sum, card) => sum + (card.value || 0), 0)}
              {/if}
            </div>
          </div>
          
          <CardZone 
            cards={currentPlayer.zones.inPlay} 
            zoneType="battlefield"
            playerId={currentPlayer.id}
            isInteractable={isMyTurn}
            orientation="horizontal"
            {onAction}
          />
        </div>

        <!-- Hand -->
        <div class="hand-area">
          <div class="hand-header">
            <h4>Hand ({currentPlayer.zones.hand.length})</h4>
            <div class="hand-actions">
              {#if isMyTurn}
                <button 
                  class="play-all-btn"
                  on:click={() => onAction({ type: 'play_all_hand', playerId: currentPlayer.id })}
                  disabled={currentPlayer.zones.hand.length === 0}
                >
                  Play All
                </button>
              {/if}
            </div>
          </div>
          
          <CardZone 
            cards={currentPlayer.zones.hand} 
            zoneType="hand"
            playerId={currentPlayer.id}
            isInteractable={isMyTurn}
            orientation="horizontal"
            {onAction}
          />
        </div>
      </div>
    {/if}

    <!-- Deck Areas -->
    <div class="deck-areas">
      {#if currentPlayer}
        <!-- Personal Deck -->
        <div class="deck-zone personal-deck">
          <h4>Your Deck ({currentPlayer.zones.deck.length})</h4>
          <div class="deck-preview">
            {#if currentPlayer.zones.deck.length > 0}
              <div class="deck-stack">
                <div class="card-back"></div>
                <div class="deck-info">
                  <div class="deck-size">{currentPlayer.zones.deck.length}</div>
                  <div class="deck-label">Cards</div>
                </div>
              </div>
            {:else}
              <div class="empty-deck">No cards in deck</div>
            {/if}
          </div>
        </div>

        <!-- Discard Pile -->
        <div class="deck-zone discard-pile">
          <h4>Discard ({currentPlayer.zones.graveyard.length})</h4>
          <div class="discard-preview">
            {#if currentPlayer.zones.graveyard.length > 0}
              <div class="top-discard">
                <div class="card-preview">
                  {currentPlayer.zones.graveyard[currentPlayer.zones.graveyard.length - 1].name}
                </div>
                <div class="discard-count">{currentPlayer.zones.graveyard.length}</div>
              </div>
            {:else}
              <div class="empty-discard">No discarded cards</div>
            {/if}
          </div>
        </div>

        <!-- Supply Piles -->
        {#if gameState.zones.supply.length > 0}
          <div class="supply-area">
            <h4>Supply</h4>
            <div class="supply-grid">
              <CardZone 
                cards={gameState.zones.supply} 
                zoneType="market"
                playerId=""
                isInteractable={false}
                orientation="grid"
                maxVisible={6}
              />
            </div>
          </div>
        {/if}
      {/if}
    </div>
  </div>

  <!-- Action Bar -->
  {#if isMyTurn && currentPlayer}
    <div class="deckbuilder-actions">
      <ActionBar 
        {gameState}
        {currentPlayerId}
        {onAction}
      />
    </div>
  {/if}
</div>

<style>
  .deckbuilder-board {
    display: grid;
    grid-template-rows: auto 1fr auto;
    height: 100%;
    background: linear-gradient(135deg, #4a1a0d 0%, #5f2a1a 100%);
    color: white;
    gap: 1rem;
  }

  .market-area {
    background: rgba(0, 0, 0, 0.4);
    border-radius: 8px;
    padding: 1rem;
    border: 2px solid rgba(245, 158, 11, 0.3);
    margin: 1rem 1rem 0 1rem;
  }

  .market-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }

  .market-header h3 {
    margin: 0;
    color: #f59e0b;
    font-size: 1.2rem;
  }

  .market-info {
    display: flex;
    gap: 1rem;
  }

  .coins,
  .buys {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-weight: bold;
  }

  .market-grid {
    min-height: 200px;
  }

  .empty-market {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    border: 2px dashed rgba(255, 255, 255, 0.2);
    border-radius: 8px;
  }

  .empty-message {
    color: rgba(255, 255, 255, 0.5);
    font-style: italic;
  }

  .game-layout {
    display: grid;
    grid-template-columns: 200px 1fr 200px;
    grid-template-areas: "opponents current deck";
    gap: 1rem;
    padding: 0 1rem;
    overflow: hidden;
  }

  .opponents-area {
    grid-area: opponents;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 1rem;
    overflow-y: auto;
  }

  .opponents-area h3 {
    margin: 0 0 1rem 0;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #ef4444;
  }

  .opponents-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .opponent-summary {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
    overflow: hidden;
  }

  .current-player-area {
    grid-area: current;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow-y: auto;
  }

  .play-area,
  .hand-area {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .play-area {
    border-color: rgba(34, 197, 94, 0.3);
  }

  .hand-area {
    border-color: rgba(59, 130, 246, 0.3);
  }

  .play-header,
  .hand-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .play-header h4,
  .hand-header h4 {
    margin: 0;
    font-size: 0.9rem;
    color: #22c55e;
  }

  .hand-header h4 {
    color: #3b82f6;
  }

  .play-stats {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .play-all-btn {
    background: rgba(59, 130, 246, 0.8);
    color: white;
    border: none;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.7rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .play-all-btn:hover:not(:disabled) {
    background: rgba(59, 130, 246, 1);
  }

  .play-all-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .deck-areas {
    grid-area: deck;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow-y: auto;
  }

  .deck-zone {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 6px;
    padding: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .personal-deck {
    border-color: rgba(96, 125, 139, 0.3);
  }

  .discard-pile {
    border-color: rgba(156, 39, 176, 0.3);
  }

  .deck-zone h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .personal-deck h4 {
    color: #607d8b;
  }

  .discard-pile h4 {
    color: #9c27b0;
  }

  .deck-preview,
  .discard-preview {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80px;
  }

  .deck-stack {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .card-back {
    width: 40px;
    height: 56px;
    background: linear-gradient(135deg, #8f5a4a 0%, #6f3a2a 100%);
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .deck-info {
    text-align: center;
  }

  .deck-size {
    font-size: 1rem;
    font-weight: bold;
  }

  .deck-label {
    font-size: 0.7rem;
    opacity: 0.8;
  }

  .top-discard {
    text-align: center;
  }

  .card-preview {
    background: rgba(156, 39, 176, 0.2);
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    margin-bottom: 0.25rem;
    border: 1px solid rgba(156, 39, 176, 0.3);
  }

  .discard-count {
    font-size: 0.8rem;
    opacity: 0.8;
  }

  .empty-deck,
  .empty-discard {
    font-size: 0.7rem;
    opacity: 0.5;
    text-align: center;
  }

  .supply-area {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
    padding: 0.75rem;
    border: 1px solid rgba(245, 158, 11, 0.2);
  }

  .supply-area h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.8rem;
    color: #f59e0b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .deckbuilder-actions {
    background: rgba(0, 0, 0, 0.6);
    border-top: 2px solid rgba(245, 158, 11, 0.3);
    padding: 1rem;
    margin: 0 1rem 1rem 1rem;
    border-radius: 0 0 8px 8px;
  }

  /* Responsive design */
  @media (max-width: 1024px) {
    .game-layout {
      grid-template-columns: 1fr;
      grid-template-areas: 
        "opponents"
        "current"
        "deck";
    }

    .opponents-list {
      flex-direction: row;
      overflow-x: auto;
    }

    .deck-areas {
      flex-direction: row;
    }
  }

  @media (max-width: 768px) {
    .deckbuilder-board {
      gap: 0.5rem;
    }

    .market-area {
      margin: 0.5rem 0.5rem 0 0.5rem;
      padding: 0.75rem;
    }

    .game-layout {
      padding: 0 0.5rem;
      gap: 0.5rem;
    }

    .market-header {
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-start;
    }

    .market-info {
      align-self: stretch;
      justify-content: space-between;
    }

    .deckbuilder-actions {
      margin: 0 0.5rem 0.5rem 0.5rem;
      padding: 0.75rem;
    }
  }

  /* Scrollbar styling */
  .opponents-area::-webkit-scrollbar,
  .current-player-area::-webkit-scrollbar,
  .deck-areas::-webkit-scrollbar {
    width: 4px;
  }

  .opponents-area::-webkit-scrollbar-track,
  .current-player-area::-webkit-scrollbar-track,
  .deck-areas::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }

  .opponents-area::-webkit-scrollbar-thumb,
  .current-player-area::-webkit-scrollbar-thumb,
  .deck-areas::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
  }
</style>