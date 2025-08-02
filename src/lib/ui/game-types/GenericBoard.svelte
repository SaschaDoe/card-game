<!-- Generic Game Board Component for unknown game types -->
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

<div class="generic-board">
  <div class="game-header">
    <h2>{gameState.gameType.toUpperCase()} Game</h2>
    <div class="game-status">
      <span>Turn {gameState.turn}</span>
      <span>Phase: {gameState.phase.name}</span>
    </div>
  </div>

  <div class="board-layout">
    <!-- Opponents Area -->
    <div class="opponents-section">
      <h3>Other Players</h3>
      <div class="opponents-grid">
        {#each opponents as opponent}
          <PlayerArea 
            player={opponent} 
            isOpponent={true}
            {gameState}
            {onAction}
          />
        {/each}
      </div>
    </div>

    <!-- Shared Game Area -->
    <div class="shared-area">
      <h3>Game Area</h3>
      <div class="shared-zones">
        <!-- Shared Zone -->
        {#if gameState.zones.shared.length > 0}
          <div class="shared-zone">
            <h4>Shared Cards ({gameState.zones.shared.length})</h4>
            <CardZone 
              cards={gameState.zones.shared} 
              zoneType="market"
              playerId=""
              isInteractable={false}
              orientation="grid"
            />
          </div>
        {/if}

        <!-- Market Zone -->
        {#if gameState.zones.market.length > 0}
          <div class="market-zone">
            <h4>Market ({gameState.zones.market.length})</h4>
            <CardZone 
              cards={gameState.zones.market} 
              zoneType="market"
              playerId=""
              isInteractable={isMyTurn}
              orientation="grid"
              {onAction}
            />
          </div>
        {/if}

        <!-- Supply Zone -->
        {#if gameState.zones.supply.length > 0}
          <div class="supply-zone">
            <h4>Supply ({gameState.zones.supply.length})</h4>
            <CardZone 
              cards={gameState.zones.supply} 
              zoneType="market"
              playerId=""
              isInteractable={false}
              orientation="grid"
            />
          </div>
        {/if}
      </div>
    </div>

    <!-- Current Player Area -->
    {#if currentPlayer}
      <div class="current-player-section">
        <PlayerArea 
          player={currentPlayer} 
          isOpponent={false}
          {gameState}
          {onAction}
        />

        <!-- Player Zones -->
        <div class="player-zones">
          <!-- Hand -->
          <div class="zone-container hand-container">
            <h4>Hand ({currentPlayer.zones.hand.length})</h4>
            <CardZone 
              cards={currentPlayer.zones.hand} 
              zoneType="hand"
              playerId={currentPlayer.id}
              isInteractable={isMyTurn}
              orientation="horizontal"
              {onAction}
            />
          </div>

          <!-- In Play -->
          {#if currentPlayer.zones.inPlay.length > 0}
            <div class="zone-container play-container">
              <h4>In Play ({currentPlayer.zones.inPlay.length})</h4>
              <CardZone 
                cards={currentPlayer.zones.inPlay} 
                zoneType="battlefield"
                playerId={currentPlayer.id}
                isInteractable={isMyTurn}
                orientation="grid"
                {onAction}
              />
            </div>
          {/if}

          <!-- Other Zones (Graveyard, Exile, etc.) -->
          <div class="other-zones">
            {#if currentPlayer.zones.graveyard.length > 0}
              <div class="zone-summary graveyard-summary">
                <h5>Graveyard</h5>
                <div class="zone-count">{currentPlayer.zones.graveyard.length}</div>
                {#if currentPlayer.zones.graveyard.length > 0}
                  <div class="top-card">
                    {currentPlayer.zones.graveyard[currentPlayer.zones.graveyard.length - 1].name}
                  </div>
                {/if}
              </div>
            {/if}

            <div class="zone-summary deck-summary">
              <h5>Deck</h5>
              <div class="zone-count">{currentPlayer.zones.deck.length}</div>
              <div class="deck-icon">🂠</div>
            </div>

            {#if currentPlayer.zones.exile && currentPlayer.zones.exile.length > 0}
              <div class="zone-summary exile-summary">
                <h5>Exile</h5>
                <div class="zone-count">{currentPlayer.zones.exile.length}</div>
              </div>
            {/if}
          </div>
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
  </div>
</div>

<style>
  .generic-board {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: white;
  }

  .game-header {
    background: rgba(0, 0, 0, 0.4);
    padding: 1rem 2rem;
    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .game-header h2 {
    margin: 0;
    color: #64ffda;
  }

  .game-status {
    display: flex;
    gap: 1rem;
    font-size: 0.9rem;
  }

  .game-status span {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .board-layout {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;
    grid-template-areas: "opponents shared current";
    gap: 1rem;
    padding: 1rem;
    overflow: hidden;
  }

  .opponents-section {
    grid-area: opponents;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    padding: 1rem;
    overflow-y: auto;
  }

  .opponents-section h3 {
    margin: 0 0 1rem 0;
    color: #ff6b6b;
    font-size: 1rem;
  }

  .opponents-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .shared-area {
    grid-area: shared;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 1rem;
    border: 2px dashed rgba(255, 255, 255, 0.2);
    overflow-y: auto;
  }

  .shared-area h3 {
    margin: 0 0 1rem 0;
    color: #ffd700;
    text-align: center;
  }

  .shared-zones {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .shared-zone,
  .market-zone,
  .supply-zone {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 6px;
    padding: 0.75rem;
  }

  .shared-zone h4,
  .market-zone h4,
  .supply-zone h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
    text-align: center;
  }

  .current-player-section {
    grid-area: current;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow-y: auto;
  }

  .player-zones {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .zone-container {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .zone-container h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.9rem;
    color: #64ffda;
  }

  .hand-container {
    border-color: rgba(76, 175, 80, 0.3);
  }

  .play-container {
    border-color: rgba(255, 193, 7, 0.3);
  }

  .other-zones {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 0.5rem;
  }

  .zone-summary {
    background: rgba(0, 0, 0, 0.4);
    border-radius: 6px;
    padding: 0.75rem;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .zone-summary h5 {
    margin: 0 0 0.5rem 0;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .zone-count {
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 0.25rem;
  }

  .top-card {
    font-size: 0.7rem;
    opacity: 0.8;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  .deck-icon {
    font-size: 1.5rem;
    opacity: 0.6;
  }

  .graveyard-summary {
    border-color: rgba(156, 39, 176, 0.3);
  }

  .graveyard-summary h5 {
    color: #ab47bc;
  }

  .deck-summary {
    border-color: rgba(96, 125, 139, 0.3);
  }

  .deck-summary h5 {
    color: #78909c;
  }

  .exile-summary {
    border-color: rgba(244, 67, 54, 0.3);
  }

  .exile-summary h5 {
    color: #f44336;
  }

  /* Responsive design */
  @media (max-width: 1024px) {
    .board-layout {
      grid-template-columns: 1fr;
      grid-template-areas: 
        "opponents"
        "shared"
        "current";
    }

    .game-header {
      flex-direction: column;
      gap: 0.5rem;
      text-align: center;
    }

    .opponents-grid {
      flex-direction: row;
      overflow-x: auto;
    }

    .other-zones {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 768px) {
    .board-layout {
      padding: 0.5rem;
      gap: 0.5rem;
    }

    .zone-container {
      padding: 0.75rem;
    }

    .other-zones {
      grid-template-columns: repeat(2, 1fr);
    }

    .game-status {
      flex-direction: column;
      gap: 0.25rem;
    }
  }

  /* Scrollbar styling */
  .opponents-section::-webkit-scrollbar,
  .shared-area::-webkit-scrollbar,
  .current-player-section::-webkit-scrollbar {
    width: 6px;
  }

  .opponents-section::-webkit-scrollbar-track,
  .shared-area::-webkit-scrollbar-track,
  .current-player-section::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  .opponents-section::-webkit-scrollbar-thumb,
  .shared-area::-webkit-scrollbar-thumb,
  .current-player-section::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
</style>