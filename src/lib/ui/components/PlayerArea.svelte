<!-- Player Area Component -->
<script lang="ts">
  import type { Player, GameState } from '../../engine/types.js';

  export let player: Player;
  export let isOpponent: boolean = false;
  export let gameState: GameState;
  export let onAction: (action: any) => void = () => {};

  $: isCurrentPlayer = gameState.players[gameState.currentPlayerIndex]?.id === player.id;
  $: lifePercentage = player.life ? Math.max(0, Math.min(100, (player.life / 20) * 100)) : 0;
</script>

<div 
  class="player-area" 
  class:opponent={isOpponent}
  class:current-player={isCurrentPlayer}
  class:ai-player={player.isAI}
>
  <div class="player-header">
    <div class="player-info">
      <h3 class="player-name">
        {player.name}
        {#if player.isAI}
          <span class="ai-badge">AI</span>
        {/if}
      </h3>
      {#if isCurrentPlayer}
        <div class="turn-indicator">Current Turn</div>
      {/if}
    </div>
    
    {#if player.life !== undefined}
      <div class="life-display">
        <div class="life-value" class:low-life={player.life <= 5}>
          {player.life}
        </div>
        <div class="life-bar">
          <div 
            class="life-fill" 
            style="width: {lifePercentage}%"
            class:critical={lifePercentage <= 25}
            class:warning={lifePercentage <= 50 && lifePercentage > 25}
          ></div>
        </div>
      </div>
    {/if}
  </div>

  <div class="player-stats">
    <!-- Resources -->
    {#if Object.keys(player.resources).length > 0}
      <div class="resources-section">
        <h4>Resources</h4>
        <div class="resources-grid">
          {#each Object.entries(player.resources) as [resource, amount]}
            <div class="resource-item" class:available={amount > 0}>
              <span class="resource-name">{resource}</span>
              <span class="resource-amount">{amount}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Zone counts -->
    <div class="zones-section">
      <h4>Zones</h4>
      <div class="zones-grid">
        <div class="zone-count">
          <span class="zone-name">Hand</span>
          <span class="zone-value">{player.zones.hand.length}</span>
        </div>
        <div class="zone-count">
          <span class="zone-name">Deck</span>
          <span class="zone-value">{player.zones.deck.length}</span>
        </div>
        <div class="zone-count">
          <span class="zone-name">Graveyard</span>
          <span class="zone-value">{player.zones.graveyard.length}</span>
        </div>
        <div class="zone-count">
          <span class="zone-name">In Play</span>
          <span class="zone-value">{player.zones.inPlay.length}</span>
        </div>
        {#if player.zones.exile && player.zones.exile.length > 0}
          <div class="zone-count">
            <span class="zone-name">Exile</span>
            <span class="zone-value">{player.zones.exile.length}</span>
          </div>
        {/if}
      </div>
    </div>

    <!-- Statistics -->
    {#if !isOpponent}
      <div class="statistics-section">
        <h4>Statistics</h4>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-name">Cards Played</span>
            <span class="stat-value">{player.statistics.cardsPlayed}</span>
          </div>
          <div class="stat-item">
            <span class="stat-name">Damage Dealt</span>
            <span class="stat-value">{player.statistics.damageDealt}</span>
          </div>
          <div class="stat-item">
            <span class="stat-name">Turns Played</span>
            <span class="stat-value">{player.statistics.turnsPlayed}</span>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Player actions -->
  {#if !isOpponent && isCurrentPlayer}
    <div class="player-actions">
      <button 
        class="action-button pass-turn"
        on:click={() => onAction({ type: 'pass_turn', playerId: player.id })}
      >
        Pass Turn
      </button>
    </div>
  {/if}
</div>

<style>
  .player-area {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
    min-width: 250px;
  }

  .player-area.current-player {
    border-color: rgba(76, 175, 80, 0.5);
    background: rgba(76, 175, 80, 0.1);
    box-shadow: 0 0 12px rgba(76, 175, 80, 0.2);
  }

  .player-area.opponent {
    opacity: 0.8;
  }

  .player-area.ai-player {
    border-style: dashed;
  }

  .player-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .player-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .player-name {
    margin: 0;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .ai-badge {
    background: rgba(255, 152, 0, 0.8);
    color: white;
    padding: 0.1rem 0.3rem;
    border-radius: 4px;
    font-size: 0.6rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .turn-indicator {
    background: rgba(76, 175, 80, 0.8);
    color: white;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: bold;
    text-transform: uppercase;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .life-display {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
  }

  .life-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: #4ade80;
    transition: color 0.3s ease;
  }

  .life-value.low-life {
    color: #ef4444;
    animation: lowLifePulse 1s infinite;
  }

  @keyframes lowLifePulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  .life-bar {
    width: 80px;
    height: 6px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    overflow: hidden;
  }

  .life-fill {
    height: 100%;
    background: #4ade80;
    transition: all 0.3s ease;
    border-radius: 3px;
  }

  .life-fill.warning {
    background: #fbbf24;
  }

  .life-fill.critical {
    background: #ef4444;
  }

  .player-stats {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .resources-section,
  .zones-section,
  .statistics-section {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    padding: 0.75rem;
  }

  .resources-section h4,
  .zones-section h4,
  .statistics-section h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: rgba(255, 255, 255, 0.8);
  }

  .resources-grid,
  .zones-grid,
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 0.5rem;
  }

  .resource-item,
  .zone-count,
  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.4rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .resource-item.available {
    background: rgba(45, 90, 160, 0.3);
    border: 1px solid rgba(45, 90, 160, 0.5);
  }

  .resource-name,
  .zone-name,
  .stat-name {
    font-size: 0.7rem;
    opacity: 0.8;
    text-transform: capitalize;
  }

  .resource-amount,
  .zone-value,
  .stat-value {
    font-size: 0.9rem;
    font-weight: bold;
    margin-top: 0.1rem;
  }

  .player-actions {
    margin-top: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .action-button {
    background: rgba(96, 165, 250, 0.8);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .action-button:hover {
    background: rgba(96, 165, 250, 1);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(96, 165, 250, 0.3);
  }

  .action-button:active {
    transform: translateY(0);
  }

  .pass-turn {
    background: rgba(156, 163, 175, 0.8);
  }

  .pass-turn:hover {
    background: rgba(156, 163, 175, 1);
    box-shadow: 0 2px 8px rgba(156, 163, 175, 0.3);
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .player-area {
      min-width: 200px;
      padding: 0.75rem;
    }

    .player-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .life-display {
      align-items: flex-start;
    }

    .resources-grid,
    .zones-grid,
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .player-name {
      font-size: 1rem;
    }

    .life-value {
      font-size: 1.2rem;
    }
  }
</style>