<!-- Universal Card Component -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Card } from '../../cards/types.js';

  export let card: Card;
  export let zoneType: string = 'hand';
  export let isInteractable: boolean = true;
  export let showFullDetails: boolean = true;
  export let size: 'small' | 'medium' | 'large' = 'medium';

  const dispatch = createEventDispatcher();

  $: cardTypeClass = `card-${card.cardType.toLowerCase().replace(/\s+/g, '-')}`;
  $: gameTypeClass = `game-${card.gameType.toLowerCase()}`;

  function handleClick() {
    if (!isInteractable) return;
    dispatch('cardAction', { actionType: 'select', card });
  }

  function handleDoubleClick() {
    if (!isInteractable) return;
    dispatch('cardAction', { actionType: 'play', card });
  }

  function handleRightClick(event: MouseEvent) {
    event.preventDefault();
    if (!isInteractable) return;
    dispatch('cardAction', { actionType: 'menu', card });
  }

  function formatCost(costs: any): string {
    if (!costs) return '';
    return Object.entries(costs)
      .map(([resource, amount]) => `${amount} ${resource}`)
      .join(', ');
  }

  function formatStats(stats: any): string {
    if (!stats) return '';
    if (stats.power !== undefined && stats.toughness !== undefined) {
      return `${stats.power}/${stats.toughness}`;
    }
    if (stats.attack !== undefined && stats.health !== undefined) {
      return `${stats.attack}/${stats.health}`;
    }
    return '';
  }
</script>

<div 
  class="card {cardTypeClass} {gameTypeClass} size-{size}"
  class:interactive={isInteractable}
  class:detailed={showFullDetails}
  on:click={handleClick}
  on:dblclick={handleDoubleClick}
  on:contextmenu={handleRightClick}
  role="button"
  tabindex={isInteractable ? 0 : -1}
  aria-label={`${card.name} - ${card.cardType}`}
>
  <!-- Card Header -->
  <div class="card-header">
    <div class="card-name">{card.name}</div>
    {#if card.costs && showFullDetails}
      <div class="card-cost">{formatCost(card.costs)}</div>
    {/if}
  </div>

  <!-- Card Type -->
  <div class="card-type">
    {card.cardType}
    {#if card.subtypes && card.subtypes.length > 0}
      - {card.subtypes.join(' ')}
    {/if}
  </div>

  <!-- Card Art/Image Placeholder -->
  <div class="card-art">
    {#if card.imageUrl}
      <img src={card.imageUrl} alt={card.name} loading="lazy" />
    {:else}
      <div class="art-placeholder">
        <div class="art-icon">
          {#if card.cardType.toLowerCase().includes('creature')}
            🐲
          {:else if card.cardType.toLowerCase().includes('spell')}
            ⚡
          {:else if card.cardType.toLowerCase().includes('artifact')}
            ⚙️
          {:else if card.cardType.toLowerCase().includes('land')}
            🏔️
          {:else}
            🃏
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <!-- Card Text -->
  {#if showFullDetails && (card.description || card.abilities?.length)}
    <div class="card-text">
      {#if card.description}
        <div class="card-description">{card.description}</div>
      {/if}
      
      {#if card.abilities && card.abilities.length > 0}
        <div class="card-abilities">
          {#each card.abilities as ability}
            <div class="ability" class:triggered={ability.timing === 'triggered'}>
              {#if ability.name !== ability.description}
                <span class="ability-name">{ability.name}:</span>
              {/if}
              <span class="ability-text">{ability.description}</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Card Footer -->
  <div class="card-footer">
    {#if card.stats && showFullDetails}
      <div class="card-stats">{formatStats(card.stats)}</div>
    {/if}
    
    {#if card.rarity && showFullDetails}
      <div class="card-rarity rarity-{card.rarity.toLowerCase()}">{card.rarity}</div>
    {/if}
  </div>

  <!-- Card Effects Overlay -->
  {#if card.effects && card.effects.length > 0}
    <div class="card-effects">
      {#each card.effects as effect}
        <div class="effect-indicator" title={effect.description}>
          {effect.type}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .card {
    background: linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%);
    border: 2px solid #444;
    border-radius: 12px;
    color: white;
    cursor: default;
    display: flex;
    flex-direction: column;
    font-family: 'Segoe UI', sans-serif;
    overflow: hidden;
    position: relative;
    transition: all 0.2s ease;
    user-select: none;
  }

  /* Card sizes */
  .size-small {
    width: 80px;
    height: 112px;
    font-size: 0.6rem;
  }

  .size-medium {
    width: 120px;
    height: 168px;
    font-size: 0.7rem;
  }

  .size-large {
    width: 160px;
    height: 224px;
    font-size: 0.8rem;
  }

  .interactive {
    cursor: pointer;
  }

  .interactive:hover {
    border-color: #666;
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .interactive:active {
    transform: scale(0.98);
  }

  /* Card sections */
  .card-header {
    background: rgba(0, 0, 0, 0.4);
    padding: 0.4rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    min-height: 2rem;
  }

  .card-name {
    font-weight: bold;
    flex: 1;
    line-height: 1.2;
    font-size: 0.9em;
  }

  .card-cost {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    padding: 0.1rem 0.3rem;
    font-size: 0.7em;
    margin-left: 0.25rem;
    white-space: nowrap;
  }

  .card-type {
    background: rgba(0, 0, 0, 0.3);
    padding: 0.2rem 0.4rem;
    font-size: 0.7em;
    font-style: italic;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .card-art {
    flex: 1;
    position: relative;
    background: linear-gradient(135deg, #333 0%, #222 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card-art img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .art-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.1) 100%);
  }

  .art-icon {
    font-size: 2em;
    opacity: 0.6;
  }

  .card-text {
    padding: 0.4rem;
    font-size: 0.6em;
    line-height: 1.3;
    background: rgba(0, 0, 0, 0.2);
    flex-shrink: 0;
    max-height: 40%;
    overflow-y: auto;
  }

  .card-description {
    margin-bottom: 0.3rem;
    font-style: italic;
  }

  .card-abilities {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .ability {
    padding: 0.1rem 0.2rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
    border-left: 2px solid rgba(255, 255, 255, 0.2);
  }

  .ability.triggered {
    border-left-color: #ffd700;
  }

  .ability-name {
    font-weight: bold;
    color: #ffd700;
  }

  .card-footer {
    background: rgba(0, 0, 0, 0.4);
    padding: 0.3rem 0.4rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 1.5rem;
  }

  .card-stats {
    font-weight: bold;
    font-size: 0.9em;
    color: #ffd700;
  }

  .card-rarity {
    font-size: 0.6em;
    padding: 0.1rem 0.2rem;
    border-radius: 3px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .rarity-common { background: #888; }
  .rarity-uncommon { background: #4a90e2; }
  .rarity-rare { background: #f5a623; }
  .rarity-mythic { background: #d0021b; }
  .rarity-legendary { background: #9013fe; }

  .card-effects {
    position: absolute;
    top: 0.25rem;
    left: 0.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .effect-indicator {
    background: rgba(255, 0, 0, 0.8);
    color: white;
    border-radius: 50%;
    width: 1rem;
    height: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6rem;
    font-weight: bold;
  }

  /* Game type specific styling */
  .game-tcg {
    border-color: #2d5aa0;
  }

  .game-tcg:hover {
    border-color: #4a7bc8;
    box-shadow: 0 0 12px rgba(45, 90, 160, 0.3);
  }

  .game-poker {
    border-color: #0d4a2a;
  }

  .game-poker:hover {
    border-color: #1a5f3a;
    box-shadow: 0 0 12px rgba(26, 95, 58, 0.3);
  }

  .game-deckbuilder {
    border-color: #5f2a1a;
  }

  .game-deckbuilder:hover {
    border-color: #6f3a2a;
    box-shadow: 0 0 12px rgba(111, 58, 42, 0.3);
  }

  /* Card type specific styling */
  .card-creature {
    background: linear-gradient(145deg, #2a4a2a 0%, #1a3a1a 100%);
  }

  .card-spell,
  .card-instant,
  .card-sorcery {
    background: linear-gradient(145deg, #4a2a2a 0%, #3a1a1a 100%);
  }

  .card-artifact {
    background: linear-gradient(145deg, #4a4a2a 0%, #3a3a1a 100%);
  }

  .card-land {
    background: linear-gradient(145deg, #2a2a4a 0%, #1a1a3a 100%);
  }

  /* Compact mode for small cards */
  .size-small .card-text,
  .size-small .card-footer {
    display: none;
  }

  .size-small .card-type {
    font-size: 0.5em;
    padding: 0.1rem 0.2rem;
  }

  .size-small .card-header {
    padding: 0.2rem;
    min-height: 1rem;
  }

  .size-small .card-name {
    font-size: 0.6em;
  }

  /* Focus styles for accessibility */
  .card:focus {
    outline: 2px solid #4a90e2;
    outline-offset: 2px;
  }

  /* Scrollbar styling for card text */
  .card-text::-webkit-scrollbar {
    width: 2px;
  }

  .card-text::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
  }

  .card-text::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 1px;
  }
</style>