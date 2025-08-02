<!-- Poker Game Board Component -->
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
  $: pot = gameState.zones.shared.reduce((total, card) => total + (card.value || 0), 0);
</script>

<div class="poker-board">
  <!-- Table Center -->
  <div class="poker-table">
    <div class="table-center">
      <!-- Community Cards (if any) -->
      {#if gameState.zones.shared.length > 0}
        <div class="community-cards">
          <h3>Community Cards</h3>
          <CardZone 
            cards={gameState.zones.shared} 
            zoneType="market"
            playerId=""
            isInteractable={false}
            orientation="horizontal"
          />
        </div>
      {/if}

      <!-- Pot -->
      <div class="pot-display">
        <div class="pot-label">Pot</div>
        <div class="pot-amount">${pot}</div>
      </div>

      <!-- Dealer Button -->
      <div class="dealer-button">
        <div class="dealer-chip">D</div>
      </div>
    </div>
  </div>

  <!-- Players Around Table -->
  <div class="players-arrangement">
    {#each gameState.players as player, index}
      <div 
        class="player-seat seat-{index}"
        class:current-player={player.id === currentPlayerId}
        class:active-turn={gameState.players[gameState.currentPlayerIndex]?.id === player.id}
      >
        <PlayerArea 
          {player} 
          isOpponent={player.id !== currentPlayerId}
          {gameState}
          {onAction}
        />
        
        <!-- Player's Cards (hidden for opponents) -->
        <div class="player-cards">
          {#if player.id === currentPlayerId}
            <CardZone 
              cards={player.zones.hand} 
              zoneType="hand"
              playerId={player.id}
              isInteractable={isMyTurn}
              orientation="horizontal"
              {onAction}
            />
          {:else}
            <!-- Show card backs for opponents -->
            <div class="hidden-cards">
              {#each Array(player.zones.hand.length) as _, i}
                <div class="card-back"></div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Player Bet -->
        {#if player.resources.bet && player.resources.bet > 0}
          <div class="player-bet">
            ${player.resources.bet}
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Action Bar -->
  {#if isMyTurn && currentPlayer}
    <div class="poker-actions">
      <ActionBar 
        {gameState}
        {currentPlayerId}
        {onAction}
      />
    </div>
  {/if}
</div>

<style>
  .poker-board {
    display: grid;
    grid-template-rows: 1fr auto;
    height: 100%;
    background: radial-gradient(ellipse at center, #0d4a2a 0%, #0a3921 100%);
    position: relative;
  }

  .poker-table {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    padding: 2rem;
  }

  .table-center {
    background: rgba(0, 0, 0, 0.4);
    border: 3px solid #8b4513;
    border-radius: 50%;
    width: 300px;
    height: 200px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
    box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
  }

  .community-cards {
    margin-bottom: 1rem;
  }

  .community-cards h3 {
    margin: 0 0 0.5rem 0;
    font-size: 0.8rem;
    text-align: center;
    color: #ffd700;
  }

  .pot-display {
    text-align: center;
    margin: 0.5rem 0;
  }

  .pot-label {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 0.25rem;
  }

  .pot-amount {
    font-size: 1.2rem;
    font-weight: bold;
    color: #ffd700;
  }

  .dealer-button {
    position: absolute;
    top: -15px;
    right: -15px;
  }

  .dealer-chip {
    width: 30px;
    height: 30px;
    background: linear-gradient(145deg, #ffffff 0%, #e5e5e5 100%);
    color: #000;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.8rem;
    border: 2px solid #333;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }

  .players-arrangement {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
  }

  .player-seat {
    position: absolute;
    pointer-events: all;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 12px;
    padding: 0.75rem;
    border: 2px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
    min-width: 200px;
  }

  .player-seat.current-player {
    border-color: rgba(76, 175, 80, 0.5);
    background: rgba(76, 175, 80, 0.1);
  }

  .player-seat.active-turn {
    border-color: rgba(255, 215, 0, 0.7);
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
  }

  /* Position players around the table */
  .seat-0 {
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
  }

  .seat-1 {
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
  }

  .seat-2 {
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
  }

  .seat-3 {
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
  }

  .seat-4 {
    bottom: 80px;
    right: 80px;
  }

  .seat-5 {
    bottom: 80px;
    left: 80px;
  }

  .player-cards {
    margin-top: 0.5rem;
  }

  .hidden-cards {
    display: flex;
    gap: 0.25rem;
    justify-content: center;
  }

  .card-back {
    width: 40px;
    height: 56px;
    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    position: relative;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .card-back::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 20px;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M11.5 1L5.5 6h12l-6-5zM12 2.5L17 7H7l5-4.5z"/></svg>');
  }

  .player-bet {
    position: absolute;
    top: -10px;
    right: -10px;
    background: rgba(255, 215, 0, 0.9);
    color: #000;
    padding: 0.25rem 0.5rem;
    border-radius: 50px;
    font-size: 0.8rem;
    font-weight: bold;
    border: 2px solid #fff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }

  .poker-actions {
    background: rgba(0, 0, 0, 0.8);
    border-top: 2px solid rgba(255, 255, 255, 0.2);
    padding: 1rem;
  }

  /* Responsive adjustments */
  @media (max-width: 1024px) {
    .table-center {
      width: 250px;
      height: 150px;
    }

    .player-seat {
      min-width: 150px;
      padding: 0.5rem;
    }

    .seat-0 { bottom: 15px; }
    .seat-1 { right: 15px; }
    .seat-2 { top: 15px; }
    .seat-3 { left: 15px; }
    .seat-4 { bottom: 60px; right: 60px; }
    .seat-5 { bottom: 60px; left: 60px; }
  }

  @media (max-width: 768px) {
    .poker-board {
      grid-template-rows: auto 1fr auto;
    }

    .poker-table {
      padding: 1rem;
    }

    .table-center {
      width: 200px;
      height: 120px;
    }

    .players-arrangement {
      position: static;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.5rem;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.3);
    }

    .player-seat {
      position: static;
      transform: none;
      min-width: auto;
    }

    .dealer-chip {
      width: 25px;
      height: 25px;
      font-size: 0.7rem;
    }
  }
</style>