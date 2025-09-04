import { GameState, Move, DiceRoll, GameConfig, Color, Token, SplitMove } from './types';
import { RulesEngine } from './rules-engine';

export class ActionHandler {
  private rulesEngine: RulesEngine;

  constructor() {
    this.rulesEngine = new RulesEngine();
  }

  /**
   * Roll dice based on game configuration
   */
  rollDice(config: GameConfig): DiceRoll {
    const values: number[] = [];
    
    if (config.diceMode === 'single') {
      values.push(Math.floor(Math.random() * 6) + 1);
    } else {
      // Double dice mode
      values.push(Math.floor(Math.random() * 6) + 1);
      values.push(Math.floor(Math.random() * 6) + 1);
    }

    const sum = values.reduce((total, value) => total + value, 0);
    const hasValidSix = values.includes(6);
    const canMoveAgain = config.diceMode === 'single' ? 
      values[0] === 6 : 
      values[0] === 6 && values[1] === 6; // Double sixes for extra turn

    return {
      values,
      sum,
      canMoveAgain,
      hasValidSix
    };
  }

  /**
   * Execute a move and return the result
   */
  executeMove(gameState: GameState, move: Move): { captured: boolean; capturedTokenId?: string } {
    const player = gameState.players.find(p => p.id === move.playerId);
    if (!player) throw new Error('Player not found');

    const token = player.tokens.find(t => t.id === move.tokenId);
    if (!token) throw new Error('Token not found');

    let captured = false;
    let capturedTokenId: string | undefined;

    // Calculate new position
    const newPosition = this.calculateNewPosition(token.position, move.steps, player.color);

    // Check for capture
    if (newPosition < 52 && gameState.board[newPosition].length > 0) {
      const occupyingTokenIds = gameState.board[newPosition];
      
      // Capture all opponent tokens on this square
      for (const tokenId of occupyingTokenIds) {
        const occupyingToken = this.findTokenById(gameState, tokenId);
        
        if (occupyingToken && occupyingToken.playerId !== move.playerId) {
          // Capture the token
          occupyingToken.position = -1;
          occupyingToken.state = 'home';
          captured = true;
          capturedTokenId = tokenId;
        }
      }
      
      // Clear all tokens from the position if capture occurred
      if (captured) {
        gameState.board[newPosition] = [];
      }
    }

    // Clear old position if token was on board
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
   * Execute a split move (using each die value on separate tokens)
   */
  executeSplitMove(gameState: GameState, splitMove: SplitMove): { captured: boolean; capturedTokenIds: string[] } {
    let totalCaptured = false;
    const capturedTokenIds: string[] = [];

    // Execute each individual move in the split move
    for (const individualMove of splitMove.moves) {
      const move: Move = {
        playerId: splitMove.playerId,
        tokenId: individualMove.tokenId,
        steps: individualMove.steps
      };

      const result = this.executeMove(gameState, move);
      if (result.captured) {
        totalCaptured = true;
        if (result.capturedTokenId) {
          capturedTokenIds.push(result.capturedTokenId);
        }
      }
    }

    return { captured: totalCaptured, capturedTokenIds };
  }

  /**
   * Get starting position for a color
   */
  getStartingPosition(color: Color): number {
    return this.rulesEngine.getStartingPosition(color);
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
   * Calculate new position after movement
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
    const homeEntry = this.rulesEngine.getHomeColumnEntry(color);
    if (currentPosition <= homeEntry && newPosition > homeEntry) {
      // Entering home column
      const stepsIntoHome = newPosition - homeEntry - 1;
      return homeColumnStart + stepsIntoHome;
    }

    return newPosition;
  }

  /**
   * Check if a token has finished based on its position and color
   */
  private hasTokenFinished(position: number, color: Color): boolean {
    const homeColumnStart = this.getHomeColumnStart(color);
    const homeColumnEnd = homeColumnStart + 5; // Home column has 6 squares (0-5)
    
    return position > homeColumnEnd;
  }

  /**
   * Find a token by ID across all players
   */
  private findTokenById(gameState: GameState, tokenId: string): Token | undefined {
    for (const player of gameState.players) {
      const token = player.tokens.find(t => t.id === tokenId);
      if (token) return token;
    }
    return undefined;
  }
}
