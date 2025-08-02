<!-- Universal Game Board Component -->
<script lang="ts">
  import type { GameState, Player } from '../engine/types.js';
  import type { GameType } from '../parser/types.js';
  import TcgBoard from './game-types/TcgBoard.svelte';
  import PokerBoard from './game-types/PokerBoard.svelte';
  import DeckBuilderBoard from './game-types/DeckBuilderBoard.svelte';
  import GenericBoard from './game-types/GenericBoard.svelte';

  export let gameState: GameState;
  export let currentPlayerId: string;
  export let onAction: (action: any) => void = () => {};

  $: gameType = gameState.gameType.toLowerCase();
  $: currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
</script>

<div class="game-board" data-game-type={gameType}>
  <div class="game-header">
    <h2>{gameState.gameType.toUpperCase()} Game</h2>
    <div class="game-info">
      <span class="turn">Turn {gameState.turn}</span>
      <span class="phase">{gameState.phase.name} Phase</span>
      <span class="status">{gameState.gameStatus}</span>
    </div>
  </div>

  <div class="game-content">
    {#if gameType === 'tcg'}
      <TcgBoard {gameState} {currentPlayerId} {onAction} />
    {:else if gameType === 'poker'}
      <PokerBoard {gameState} {currentPlayerId} {onAction} />
    {:else if gameType === 'deckbuilder'}
      <DeckBuilderBoard {gameState} {currentPlayerId} {onAction} />
    {:else}
      <GenericBoard {gameState} {currentPlayerId} {onAction} />
    {/if}
  </div>

  <div class="game-footer">
    <div class="player-info">
      {#if currentPlayer}
        <div class="current-player">
          <h3>{currentPlayer.name}</h3>
          {#if currentPlayer.life !== undefined}
            <div class="life">Life: {currentPlayer.life}</div>
          {/if}
          <div class="resources">
            {#each Object.entries(currentPlayer.resources) as [resource, amount]}
              <span class="resource">{resource}: {amount}</span>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .game-board {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--bg-primary, #1a1a1a);
    color: var(--text-primary, #ffffff);
    font-family: 'Segoe UI', sans-serif;
  }

  .game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background: var(--bg-secondary, #2a2a2a);
    border-bottom: 2px solid var(--border-color, #444);
  }

  .game-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: bold;
  }

  .game-info {
    display: flex;
    gap: 1rem;
    font-size: 0.9rem;
  }

  .game-info span {
    padding: 0.25rem 0.5rem;
    background: var(--bg-accent, #3a3a3a);
    border-radius: 4px;
  }

  .game-content {
    flex: 1;
    overflow: hidden;
  }

  .game-footer {
    padding: 1rem 2rem;
    background: var(--bg-secondary, #2a2a2a);
    border-top: 1px solid var(--border-color, #444);
  }

  .current-player {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .current-player h3 {
    margin: 0;
    font-size: 1.1rem;
  }

  .life {
    font-weight: bold;
    color: var(--life-color, #ff4444);
  }

  .resources {
    display: flex;
    gap: 0.5rem;
  }

  .resource {
    padding: 0.25rem 0.5rem;
    background: var(--resource-bg, #4a4a4a);
    border-radius: 3px;
    font-size: 0.8rem;
  }

  /* Game type specific styling */
  .game-board[data-game-type="tcg"] {
    --bg-primary: #0f1419;
    --bg-secondary: #1a2332;
    --bg-accent: #2a3441;
    --border-color: #3a4451;
    --life-color: #ff6b6b;
    --resource-bg: #2d5aa0;
  }

  .game-board[data-game-type="poker"] {
    --bg-primary: #0d4a2a;
    --bg-secondary: #1a5f3a;
    --bg-accent: #2a6f4a;
    --border-color: #3a7f5a;
    --resource-bg: #4a8f6a;
  }

  .game-board[data-game-type="deckbuilder"] {
    --bg-primary: #4a1a0d;
    --bg-secondary: #5f2a1a;
    --bg-accent: #6f3a2a;
    --border-color: #7f4a3a;
    --resource-bg: #8f5a4a;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .game-header {
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
    }

    .game-info {
      flex-wrap: wrap;
      justify-content: center;
    }

    .current-player {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .resources {
      flex-wrap: wrap;
    }
  }
</style>