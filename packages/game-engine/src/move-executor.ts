import { GameState, Move, Color, Token } from './types';

/**
 * Shared utility for executing moves with full side effects
 * Used by both ActionHandler (for real execution) and RulesEngine (for simulation)
 */
export class MoveExecutor {
  /**
   * Execute a single move with all side effects (captures, state transitions, etc.)
   */
  executeMove(gameState: GameState, move: Move): { captured: boolean; capturedTokenId?: string } {
    const player = gameState.players.find(p => p.id === move.playerId);
    if (!player) return { captured: false };

    const token = player.tokens.find(t => t.id === move.tokenId);
    if (!token) return { captured: false };

    const newPosition = this.calculateNewPosition(token.position, move.steps, player.color);
    
    // Check for captures
    let captured = false;
    let capturedTokenId: string | undefined;
    
    if (newPosition < 52 && gameState.board[newPosition].length > 0) {
      const occupyingTokenIds = gameState.board[newPosition];
      for (const tokenId of occupyingTokenIds) {
        const occupyingToken = this.findTokenById(gameState, tokenId);
        if (occupyingToken && occupyingToken.playerId !== move.playerId) {
          // Capture the token
          captured = true;
          capturedTokenId = tokenId;
          occupyingToken.position = -1;
          occupyingToken.state = 'home';
          
          // Remove from board
          const index = gameState.board[newPosition].indexOf(tokenId);
          if (index > -1) {
            gameState.board[newPosition].splice(index, 1);
          }
          break; // Only capture one token
        }
      }
    }

    // Remove token from old position
    if (token.position >= 0 && token.position < 52) {
      const oldPositionTokens = gameState.board[token.position];
      const tokenIndex = oldPositionTokens.indexOf(token.id);
      if (tokenIndex > -1) {
        oldPositionTokens.splice(tokenIndex, 1);
      }
    }

    // Move token to new position
    if (token.position === -1) {
      // Moving out of home
      token.position = this.getStartingPosition(player.color);
      token.state = 'in-play';
    } else {
      token.position = newPosition;
    }

    // Handle Nigerian-style capture (capturing token goes to finish)
    if (captured && gameState.config.captureMode === 'finish') {
      token.position = 99;
      token.state = 'finished';
    } else if (this.hasTokenFinished(newPosition, player.color)) {
      // Token reached finish area
      token.position = 99;
      token.state = 'finished';
    } else if (newPosition >= 52) {
      // Token is in home column but not finished
      token.position = newPosition;
      token.state = 'home-column';
    } else {
      // Update board with new token position
      token.position = newPosition;
      gameState.board[token.position].push(token.id);
    }

    return { captured, capturedTokenId };
  }

  /**
   * Calculate new position after moving
   */
  calculateNewPosition(currentPosition: number, steps: number, color: Color): number {
    if (currentPosition === -1) {
      // Moving out of home - go to starting position
      return this.getStartingPosition(color);
    }

    // Check if token is already in home column
    const homeColumnStart = this.getHomeColumnStart(color);
    if (currentPosition >= homeColumnStart) {
      // Token is in home column, just add steps
      return currentPosition + steps;
    }

    // Regular board movement with wrapping
    const newPosition = (currentPosition + steps) % 52;
    
    // Check if entering home column
    const homeEntry = this.getHomeColumnEntry(color);
    if (currentPosition <= homeEntry && newPosition > homeEntry) {
      // Entering home column
      const stepsIntoHome = newPosition - homeEntry - 1;
      return homeColumnStart + stepsIntoHome;
    }

    return newPosition;
  }

  /**
   * Get starting position for a color
   */
  getStartingPosition(color: Color): number {
    switch (color) {
      case 'red': return 0;  // Square 1 (0-indexed)
      case 'blue': return 13; // Square 14 (0-indexed)
      case 'green': return 26; // Square 27 (0-indexed)
      case 'yellow': return 39; // Square 40 (0-indexed)
      default: return 0;
    }
  }

  /**
   * Get home column start position for a color
   */
  getHomeColumnStart(color: Color): number {
    switch (color) {
      case 'red': return 52;
      case 'blue': return 58;
      case 'green': return 64;
      case 'yellow': return 70;
      default: return 52;
    }
  }

  /**
   * Get home column entry point for a color
   */
  getHomeColumnEntry(color: Color): number {
    switch (color) {
      case 'red': return 51;
      case 'blue': return 12;
      case 'green': return 25;
      case 'yellow': return 38;
      default: return 51;
    }
  }

  /**
   * Check if a token has finished based on its position and color
   */
  hasTokenFinished(position: number, color: Color): boolean {
    const homeColumnStart = this.getHomeColumnStart(color);
    const homeColumnEnd = homeColumnStart + 5; // Home column has 6 squares (0-5)
    
    return position > homeColumnEnd;
  }

  /**
   * Find a token by ID across all players
   */
  findTokenById(gameState: GameState, tokenId: string): Token | undefined {
    for (const player of gameState.players) {
      const token = player.tokens.find(t => t.id === tokenId);
      if (token) return token;
    }
    return undefined;
  }
}
