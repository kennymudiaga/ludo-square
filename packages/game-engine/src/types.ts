// Shared types for the Ludo game engine

export type Color = 'red' | 'blue' | 'green' | 'yellow';
export type TokenState = 'home' | 'in-play' | 'home-column' | 'finished';
export type GameStatus = 'waiting' | 'in-progress' | 'finished';
export type PlayerStatus = 'waiting' | 'active' | 'finished';

// Game configuration options
export interface GameConfig {
  diceMode: 'single' | 'double';
  captureMode: 'stay' | 'finish'; // stay = classic, finish = Nigerian style
  maxConsecutiveSixes: number;
  safeStartingSquares: boolean;
  allowTokenStacking: boolean;
  allowSplitDiceMovement: boolean; // In 2-dice mode, use each die on separate tokens
}

export interface Player {
  id: string;
  color: Color;
  tokens: Token[];
  status: PlayerStatus;
}

export interface Token {
  id: string;
  playerId: string;
  position: number; // -1 = home, 0-51 = board, 52-57 = home column, 99 = finished
  state: TokenState;
}

export interface GameState {
  id: string;
  config: GameConfig;
  players: Player[];
  currentPlayerIndex: number;
  board: (string[])[]; // Array of 52 squares, each square can hold multiple tokenIds
  status: GameStatus;
  winner?: string;
  consecutiveSixes: number; // Track consecutive extra turns
}

export interface Move {
  playerId: string;
  tokenId: string;
  steps: number;
}

export interface SplitMove {
  playerId: string;
  moves: {
    tokenId: string;
    steps: number;
  }[];
}

export interface DiceRoll {
  values: number[]; // [6] for single die, [3, 6] for double dice
  sum: number; // Total to use for movement
  canMoveAgain: boolean; // Extra turn granted
  hasValidSix: boolean; // Can move token out of home
}
