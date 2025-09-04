import { GameState, Move, DiceRoll, GameConfig, Color, Token, SplitMove, TurnMove } from './types';
import { RulesEngine } from './rules-engine';
import { MoveExecutor } from './move-executor';

export class ActionHandler {
  private rulesEngine: RulesEngine;
  private moveExecutor: MoveExecutor;

  constructor() {
    this.rulesEngine = new RulesEngine();
    this.moveExecutor = new MoveExecutor();
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
    // Use shared MoveExecutor for consistent logic
    return this.moveExecutor.executeMove(gameState, move);
  }

  /**
   * Execute a complete turn with multiple moves
   */
  executeTurnMove(gameState: GameState, turnMove: TurnMove): { 
    captured: boolean; 
    capturedTokenIds: string[];
    movesExecuted: number;
  } {
    let totalCaptured = false;
    const capturedTokenIds: string[] = [];
    let movesExecuted = 0;

    // Execute each move in the specified order
    for (const moveData of turnMove.moves) {
      const move: Move = {
        playerId: turnMove.playerId,
        tokenId: moveData.tokenId,
        steps: moveData.steps
      };

      const result = this.executeMove(gameState, move);
      movesExecuted++;

      if (result.captured) {
        totalCaptured = true;
        if (result.capturedTokenId) {
          capturedTokenIds.push(result.capturedTokenId);
        }
      }
    }

    return { captured: totalCaptured, capturedTokenIds, movesExecuted };
  }

  /**
   * Get all valid turn moves for given dice values
   */
  getValidTurnMoves(gameState: GameState, playerId: string, diceValues: number[]): TurnMove[] {
    const allCombinations = this.rulesEngine.getAllValidMoveCombinations(gameState, playerId, diceValues);
    const validTurnMoves: TurnMove[] = [];

    for (const combination of allCombinations) {
      const turnMove: TurnMove = {
        playerId,
        moves: combination,
        diceValues
      };

      if (this.rulesEngine.validateTurnMove(gameState, turnMove)) {
        validTurnMoves.push(turnMove);
      }
    }

    return validTurnMoves;
  }

  /**
   * Get starting position for a color
   */
  getStartingPosition(color: Color): number {
    return this.moveExecutor.getStartingPosition(color);
  }

  /**
   * Get home column start position for a color
   */
  getHomeColumnStart(color: Color): number {
    return this.moveExecutor.getHomeColumnStart(color);
  }

  /**
   * Calculate new position after movement
   */
  calculateNewPosition(currentPosition: number, steps: number, color: Color): number {
    return this.moveExecutor.calculateNewPosition(currentPosition, steps, color);
  }

  /**
   * Check if a token has finished based on its position and color
   */
  private hasTokenFinished(position: number, color: Color): boolean {
    return this.moveExecutor.hasTokenFinished(position, color);
  }

  /**
   * Find a token by ID across all players
   */
  private findTokenById(gameState: GameState, tokenId: string): Token | undefined {
    return this.moveExecutor.findTokenById(gameState, tokenId);
  }
}
