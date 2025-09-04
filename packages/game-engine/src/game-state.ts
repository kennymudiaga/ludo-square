import { GameState, Player, Token, GameConfig, Color } from './types';
import { RulesEngine } from './rules-engine';

export class GameStateManager {
  private rulesEngine: RulesEngine;

  constructor() {
    this.rulesEngine = new RulesEngine();
  }

  /**
   * Create a new game with the specified players and configuration
   */
  createGame(playerConfigs: { id: string; color: Color }[], config: GameConfig): GameState {
    const players: Player[] = playerConfigs.map(playerConfig => {
      const tokens: Token[] = [];
      
      // Create 4 tokens for each player, all starting in home
      for (let i = 0; i < 4; i++) {
        tokens.push({
          id: `${playerConfig.id}-token-${i + 1}`,
          playerId: playerConfig.id,
          position: -1, // -1 represents home
          state: 'home'
        });
      }

      return {
        id: playerConfig.id,
        color: playerConfig.color,
        tokens,
        status: 'waiting'
      };
    });

    const gameState: GameState = {
      id: `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      config,
      players,
      currentPlayerIndex: 0,
      board: new Array(52).fill(null), // 52 squares on the main track
      status: 'waiting',
      consecutiveSixes: 0
    };

    return gameState;
  }

  /**
   * Start the game (change status to in-progress)
   */
  startGame(gameState: GameState): void {
    gameState.status = 'in-progress';
    gameState.players[gameState.currentPlayerIndex].status = 'active';
  }

  /**
   * Update game state immutably
   */
  updateGameState(currentState: GameState, updates: Partial<GameState>): GameState {
    return {
      ...currentState,
      ...updates
    };
  }

  /**
   * Advance to next turn or stay on current player if extra turn
   */
  nextTurn(gameState: GameState, extraTurn: boolean): void {
    if (extraTurn && gameState.consecutiveSixes < gameState.config.maxConsecutiveSixes - 1) {
      // Grant extra turn but track consecutive sixes
      gameState.consecutiveSixes++;
    } else {
      // Move to next player and reset consecutive sixes
      gameState.consecutiveSixes = 0;
      
      // Set current player to waiting
      gameState.players[gameState.currentPlayerIndex].status = 'waiting';
      
      // Advance to next player
      gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
      
      // Set new current player to active
      gameState.players[gameState.currentPlayerIndex].status = 'active';
    }
  }

  /**
   * Check if game has ended and update winner
   */
  checkGameEnd(gameState: GameState): void {
    for (const player of gameState.players) {
      if (this.rulesEngine.hasPlayerWon(player)) {
        gameState.status = 'finished';
        gameState.winner = player.id;
        break;
      }
    }
  }

  /**
   * Validate if the current game state is valid
   */
  isValidGameState(gameState: GameState): boolean {
    // Check player count
    if (gameState.players.length < 2 || gameState.players.length > 4) {
      return false;
    }

    // Check current player index
    if (gameState.currentPlayerIndex < 0 || gameState.currentPlayerIndex >= gameState.players.length) {
      return false;
    }

    // Check board size
    if (gameState.board.length !== 52) {
      return false;
    }

    return true;
  }
}
