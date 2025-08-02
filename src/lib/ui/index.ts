// Universal UI system exports

// Main game board
export { default as GameBoard } from './GameBoard.svelte';

// Game type specific boards
export { default as TcgBoard } from './game-types/TcgBoard.svelte';
export { default as PokerBoard } from './game-types/PokerBoard.svelte';
export { default as DeckBuilderBoard } from './game-types/DeckBuilderBoard.svelte';
export { default as GenericBoard } from './game-types/GenericBoard.svelte';

// Shared UI components
export { default as Card } from './components/Card.svelte';
export { default as CardZone } from './components/CardZone.svelte';
export { default as PlayerArea } from './components/PlayerArea.svelte';
export { default as ActionBar } from './components/ActionBar.svelte';