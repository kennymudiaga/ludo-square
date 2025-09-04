import { GameState, Move, Player, Token, DiceRoll, Color, GameConfig, SplitMove, TurnMove } from './types';

export class RulesEngine {
  /**
   * Check if a move is valid given the current game state and dice roll
   */
  isValidMove(gameState: GameState, move: Move, diceRoll: DiceRoll): boolean {
    const player = gameState.players.find(p => p.id === move.playerId);
    if (!player) return false;

    const token = player.tokens.find(t => t.id === move.tokenId);
    if (!token) return false;

    // Check if move steps match dice sum
    if (move.steps !== diceRoll.sum) return false;

    // Check if token is in home and trying to move out
    if (token.position === -1) {
      // Must have a valid six to move out of home
      if (!diceRoll.hasValidSix) return false;
      
      // Check if starting position is occupied by own token
      const startingPosition = this.getStartingPosition(player.color);
      const occupyingTokenIds = gameState.board[startingPosition];
      if (occupyingTokenIds && occupyingTokenIds.length > 0) {
        // In stacking mode, check if any token belongs to same player
        if (!gameState.config.allowTokenStacking) {
          const occupyingToken = this.findTokenById(gameState, occupyingTokenIds[0]);
          if (occupyingToken && occupyingToken.playerId === move.playerId) {
            return false; // Cannot land on own token
          }
        }
      }
      
      return true;
    }

    // Check if token is finished
    if (token.state === 'finished') return false;

    // Calculate new position
    const newPosition = this.calculateNewPosition(token.position, move.steps, player.color);
    
    // Check if new position would be occupied by own token
    if (newPosition < 52 && gameState.board[newPosition].length > 0) {
      const occupyingTokenIds = gameState.board[newPosition];
      
      // Check if any occupying token belongs to same player
      for (const tokenId of occupyingTokenIds) {
        const occupyingToken = this.findTokenById(gameState, tokenId);
        if (occupyingToken && occupyingToken.playerId === move.playerId) {
          // In stacking mode, allow multiple own tokens
          if (!gameState.config.allowTokenStacking) {
            return false; // Cannot land on own token
          }
        }
      }
    }

    // Check if trying to capture on a safe square
    if (newPosition < 52 && gameState.board[newPosition].length > 0) {
      const occupyingTokenIds = gameState.board[newPosition];
      for (const tokenId of occupyingTokenIds) {
        const occupyingToken = this.findTokenById(gameState, tokenId);
        if (occupyingToken && occupyingToken.playerId !== move.playerId) {
          if (this.isSafeSquareForColor(newPosition, this.getPlayerColor(gameState, occupyingToken.playerId), gameState.config)) {
            return false; // Cannot capture on safe square
          }
        }
      }
    }

    return true;
  }

  /**
   * Check if a square is safe for a given player
   */
  isSafeSquare(position: number, playerId: string): boolean {
    // This method needs game state to find player color
    // For now, return basic safe square logic
    const safeSquares = [0, 8, 13, 21, 26, 34, 39, 47]; // Starting positions and safe squares
    return safeSquares.includes(position);
  }

  /**
   * Check if a square is safe for a given color
   */
  isSafeSquareForColor(position: number, color: Color, gameConfig: GameConfig): boolean {
    const startingPosition = this.getStartingPosition(color);
    const safePositions = this.getSafePositions(color);
    
    const isStartingSquareSafe = gameConfig.safeStartingSquares && position === startingPosition;
    const isRegularSafeSquare = safePositions.includes(position);
    
    return isStartingSquareSafe || isRegularSafeSquare;
  }

  /**
   * Get safe positions for a color (excluding starting position)
   */
  getSafePositions(color: Color): number[] {
    switch (color) {
      case 'red': return [8]; // Square 9 in 1-based indexing
      case 'blue': return [21]; // Square 22 in 1-based indexing  
      case 'green': return [34]; // Square 35 in 1-based indexing
      case 'yellow': return [47]; // Square 48 in 1-based indexing
      default: return [];
    }
  }

  /**
   * Get starting position for a color (0-based indexing)
   */
  getStartingPosition(color: Color): number {
    switch (color) {
      case 'red': return 0; // Square 1
      case 'blue': return 13; // Square 14
      case 'green': return 26; // Square 27
      case 'yellow': return 39; // Square 40
      default: return 0;
    }
  }

  /**
   * Check if a capture can happen at a position
   */
  canCaptureAt(gameState: GameState, position: number, capturingPlayerId: string): boolean {
    const occupyingTokenIds = gameState.board[position];
    if (!occupyingTokenIds || occupyingTokenIds.length === 0) return false;

    // Check if any token can be captured
    for (const tokenId of occupyingTokenIds) {
      const occupyingToken = this.findTokenById(gameState, tokenId);
      if (!occupyingToken) continue;

      // Cannot capture own token
      if (occupyingToken.playerId === capturingPlayerId) continue;

      // Cannot capture on safe squares
      const occupyingPlayerColor = this.getPlayerColor(gameState, occupyingToken.playerId);
      if (this.isSafeSquareForColor(position, occupyingPlayerColor, gameState.config)) continue;

      return true; // Found at least one capturable token
    }

    return false;
  }

  /**
   * Get home column entry point for a color
   */
  getHomeColumnEntry(color: Color): number {
    // This is the last square before entering home column
    switch (color) {
      case 'red': return 51;
      case 'blue': return 12; // Blue's lap ends at square 12
      case 'green': return 25; // Green's lap ends at square 25  
      case 'yellow': return 38; // Yellow's lap ends at square 38
      default: return 51;
    }
  }

  /**
   * Check if a player has won (all tokens finished)
   */
  hasPlayerWon(player: Player): boolean {
    return player.tokens.every(token => token.state === 'finished');
  }

  /**
   * Get all available moves for a player given a dice roll
   */
  getAvailableMoves(gameState: GameState, playerId: string, diceRoll: DiceRoll): Move[] {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return [];

    const moves: Move[] = [];

    for (const token of player.tokens) {
      const move: Move = {
        playerId,
        tokenId: token.id,
        steps: diceRoll.sum
      };

      if (this.isValidMove(gameState, move, diceRoll)) {
        moves.push(move);
      }
    }

    return moves;
  }

  /**
   * Validate a complete turn with multiple moves
   * Ensures all dice are used if possible (all-or-nothing rule)
   */
  validateTurnMove(gameState: GameState, turnMove: TurnMove): boolean {
    const diceValues = turnMove.diceValues;
    const moves = turnMove.moves;

    // Check if all dice values are accounted for
    const usedDiceIndices = moves.map(m => m.dieIndex);
    const allDiceUsed = diceValues.every((_, index) => usedDiceIndices.includes(index));

    // If not all dice used, check if full usage is possible
    if (!allDiceUsed) {
      const allPossibleCombinations = this.getAllValidMoveCombinations(gameState, turnMove.playerId, diceValues);
      const hasFullUsageCombination = allPossibleCombinations.some(combo => combo.length === diceValues.length);
      
      if (hasFullUsageCombination) {
        return false; // Must use all dice if possible
      }
    }

    // Validate each individual move in sequence
    let simulatedGameState = JSON.parse(JSON.stringify(gameState)); // Deep clone
    
    for (const move of moves) {
      const individualMove: Move = {
        playerId: turnMove.playerId,
        tokenId: move.tokenId,
        steps: move.steps
      };

      const diceRoll: DiceRoll = {
        values: [move.steps],
        sum: move.steps,
        canMoveAgain: false,
        hasValidSix: move.steps === 6
      };

      if (!this.isValidMove(simulatedGameState, individualMove, diceRoll)) {
        return false;
      }

      // Apply the move to the simulated state for next validation
      this.applyMoveToGameState(simulatedGameState, individualMove);
    }

    return true;
  }

  /**
   * Get all possible move combinations for given dice values
   */
  getAllValidMoveCombinations(gameState: GameState, playerId: string, diceValues: number[]): TurnMove['moves'][] {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return [];

    const combinations: TurnMove['moves'][] = [];
    
    // Generate all possible combinations recursively
    this.generateMoveCombinations(gameState, player, diceValues, [], 0, combinations);
    
    return combinations;
  }

  /**
   * Recursively generate move combinations
   */
  private generateMoveCombinations(
    gameState: GameState, 
    player: Player, 
    diceValues: number[], 
    currentCombination: TurnMove['moves'], 
    dieIndex: number, 
    allCombinations: TurnMove['moves'][]
  ): void {
    if (dieIndex >= diceValues.length) {
      if (currentCombination.length > 0) {
        allCombinations.push([...currentCombination]);
      }
      return;
    }

    const dieValue = diceValues[dieIndex];
    let validMoveFound = false;

    // Try this die value on each token
    for (const token of player.tokens) {
      const move: Move = {
        playerId: player.id,
        tokenId: token.id,
        steps: dieValue
      };

      const diceRoll: DiceRoll = {
        values: [dieValue],
        sum: dieValue,
        canMoveAgain: false,
        hasValidSix: dieValue === 6
      };

      if (this.isValidMove(gameState, move, diceRoll)) {
        validMoveFound = true;
        
        // Add this move to current combination
        const newCombination = [...currentCombination, {
          tokenId: token.id,
          steps: dieValue,
          dieIndex
        }];

        // Apply move to simulated state
        const simulatedState = JSON.parse(JSON.stringify(gameState));
        this.applyMoveToGameState(simulatedState, move);

        // Recurse for next die
        this.generateMoveCombinations(simulatedState, player, diceValues, newCombination, dieIndex + 1, allCombinations);
      }
    }

    // If no valid move for this die, try skipping it (if allowed)
    if (!validMoveFound) {
      this.generateMoveCombinations(gameState, player, diceValues, currentCombination, dieIndex + 1, allCombinations);
    }
  }

  /**
   * Apply a move to game state (for simulation)
   */
  private applyMoveToGameState(gameState: GameState, move: Move): void {
    const player = gameState.players.find(p => p.id === move.playerId);
    if (!player) return;

    const token = player.tokens.find(t => t.id === move.tokenId);
    if (!token) return;

    // Simple move application (without capture logic for simulation)
    if (token.position === -1) {
      token.position = this.getStartingPosition(player.color);
      token.state = 'in-play';
    } else {
      const newPosition = this.calculateNewPosition(token.position, move.steps, player.color);
      token.position = newPosition;
    }
  }

  /**
   * Calculate new position after moving
   */
  private calculateNewPosition(currentPosition: number, steps: number, color: Color): number {
    if (currentPosition === -1) {
      // Moving out of home
      return this.getStartingPosition(color);
    }

    const newPosition = (currentPosition + steps) % 52;
    return newPosition;
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

  /**
   * Get player color by ID from game state
   */
  private getPlayerColor(gameState: GameState, playerId: string): Color {
    const player = gameState.players.find(p => p.id === playerId);
    return player ? player.color : 'red'; // Default fallback
  }

  /**
   * Check if dice values contain a valid six
   */
  private hasValidSix(values: number[]): boolean {
    return values.includes(6);
  }
}
