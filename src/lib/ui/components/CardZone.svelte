<!-- Card Zone Component for displaying collections of cards -->
<script lang="ts">
  import type { Card } from '../../cards/types.js';
  import CardComponent from './Card.svelte';

  export let cards: Card[] = [];
  export let zoneType: 'hand' | 'battlefield' | 'deck' | 'graveyard' | 'exile' | 'market' = 'hand';
  export let playerId: string;
  export let isInteractable: boolean = true;
  export let onAction: (action: any) => void = () => {};
  export let maxVisible: number = 0; // 0 means show all
  export let orientation: 'horizontal' | 'vertical' | 'grid' = 'horizontal';

  $: visibleCards = maxVisible > 0 ? cards.slice(-maxVisible) : cards;
  $: hiddenCount = cards.length - visibleCards.length;

  function handleCardAction(card: Card, actionType: string) {
    if (!isInteractable) return;
    
    onAction({
      type: actionType,
      card,
      playerId,
      zoneType
    });
  }
</script>

<div 
  class="card-zone" 
  class:zone-hand={zoneType === 'hand'}
  class:zone-battlefield={zoneType === 'battlefield'}
  class:zone-deck={zoneType === 'deck'}
  class:zone-graveyard={zoneType === 'graveyard'}
  class:zone-exile={zoneType === 'exile'}
  class:zone-market={zoneType === 'market'}
  class:orientation-horizontal={orientation === 'horizontal'}
  class:orientation-vertical={orientation === 'vertical'}
  class:orientation-grid={orientation === 'grid'}
  class:interactive={isInteractable}
>
  {#if cards.length === 0}
    <div class="empty-zone">
      <div class="empty-message">
        {#if zoneType === 'hand'}
          No cards in hand
        {:else if zoneType === 'battlefield'}
          No cards in play
        {:else if zoneType === 'deck'}
          Deck is empty
        {:else if zoneType === 'graveyard'}
          Graveyard is empty
        {:else if zoneType === 'market'}
          No cards available
        {:else}
          No cards
        {/if}
      </div>
    </div>
  {:else}
    {#if hiddenCount > 0}
      <div class="hidden-cards-indicator">
        +{hiddenCount} more
      </div>
    {/if}
    
    <div class="cards-container">
      {#each visibleCards as card, index (card.id)}
        <div 
          class="card-wrapper"
          style="--card-index: {index}"
        >
          <CardComponent 
            {card}
            {zoneType}
            {isInteractable}
            showFullDetails={zoneType === 'hand' || zoneType === 'market'}
            on:cardAction={(event) => handleCardAction(card, event.detail.actionType)}
          />
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .card-zone {
    position: relative;
    min-height: 80px;
    border-radius: 8px;
    transition: all 0.3s ease;
  }

  .empty-zone {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    min-height: 80px;
    border: 2px dashed rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.02);
  }

  .empty-message {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.9rem;
    text-align: center;
  }

  .interactive:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .hidden-cards-indicator {
    position: absolute;
    top: -10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.7rem;
    z-index: 10;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .cards-container {
    display: flex;
    position: relative;
    padding: 0.5rem;
  }

  /* Horizontal orientation (default for hand) */
  .orientation-horizontal .cards-container {
    flex-direction: row;
    overflow-x: auto;
    gap: 0.5rem;
    align-items: center;
  }

  .orientation-horizontal .card-wrapper {
    flex-shrink: 0;
    transition: transform 0.2s ease;
  }

  .orientation-horizontal.interactive .card-wrapper:hover {
    transform: translateY(-10px) scale(1.05);
    z-index: 5;
  }

  /* Vertical orientation */
  .orientation-vertical .cards-container {
    flex-direction: column;
    gap: 0.25rem;
    max-height: 300px;
    overflow-y: auto;
  }

  /* Grid orientation (for markets, etc.) */
  .orientation-grid .cards-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.5rem;
  }

  /* Zone-specific styling */
  .zone-hand {
    background: linear-gradient(90deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%);
    border: 1px solid rgba(76, 175, 80, 0.2);
  }

  .zone-battlefield {
    background: linear-gradient(90deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 193, 7, 0.05) 100%);
    border: 1px solid rgba(255, 193, 7, 0.2);
  }

  .zone-graveyard {
    background: linear-gradient(90deg, rgba(156, 39, 176, 0.1) 0%, rgba(156, 39, 176, 0.05) 100%);
    border: 1px solid rgba(156, 39, 176, 0.2);
  }

  .zone-exile {
    background: linear-gradient(90deg, rgba(244, 67, 54, 0.1) 0%, rgba(244, 67, 54, 0.05) 100%);
    border: 1px solid rgba(244, 67, 54, 0.2);
  }

  .zone-market {
    background: linear-gradient(90deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.05) 100%);
    border: 1px solid rgba(33, 150, 243, 0.2);
  }

  .zone-deck {
    background: linear-gradient(90deg, rgba(96, 125, 139, 0.1) 0%, rgba(96, 125, 139, 0.05) 100%);
    border: 1px solid rgba(96, 125, 139, 0.2);
  }

  /* Card stacking effect for hand */
  .zone-hand.orientation-horizontal .card-wrapper {
    margin-left: calc(var(--card-index) * -40px);
  }

  .zone-hand.orientation-horizontal .card-wrapper:first-child {
    margin-left: 0;
  }

  .zone-hand.orientation-horizontal .card-wrapper:hover {
    margin-left: calc(var(--card-index) * -20px);
    margin-right: 20px;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .cards-container {
      padding: 0.25rem;
    }

    .orientation-horizontal .cards-container {
      gap: 0.25rem;
    }

    .zone-hand.orientation-horizontal .card-wrapper {
      margin-left: calc(var(--card-index) * -30px);
    }

    .zone-hand.orientation-horizontal .card-wrapper:hover {
      margin-left: calc(var(--card-index) * -15px);
      margin-right: 15px;
    }

    .orientation-grid .cards-container {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 0.25rem;
    }
  }

  /* Smooth scrollbars */
  .cards-container::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  .cards-container::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  .cards-container::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }

  .cards-container::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
</style>