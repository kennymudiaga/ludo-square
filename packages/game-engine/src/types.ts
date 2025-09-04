// Shared types for the Ludo game engine
export interface Player {
  id: string;
  color: 'red' | 'blue' | 'green' | 'yellow';
  tokens: Token[];
  status: 'waiting' | 'active' | 'finished';
}

export interface Token {
  id: string;
  position: number; // 0-51 for board positions, -1 for home, 99 for finished
  state: 'home' | 'in-play' | 'finished';
}

export interface GameState {
  id: string;
  players: Player[];
  currentPlayerIndex: number;
  board: number[]; // Array representing board positions
  status: 'waiting' | 'in-progress' | 'finished';
  winner?: string;
}

export interface Move {
  playerId: string;
  tokenId: string;
  steps: number;
}

export interface DiceRoll {
  value: number;
  canMoveAgain: boolean;
}
