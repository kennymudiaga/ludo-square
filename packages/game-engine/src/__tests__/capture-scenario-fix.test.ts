// Test for the specific capture scenario bug we identified
import { RulesEngine } from '../rules-engine';
import { ActionHandler } from '../action-handler';
import { GameState, TurnMove } from '../types';

describe('Capture Scenario Bug Fix', () => {
  let rulesEngine: RulesEngine;
  let actionHandler: ActionHandler;
  let gameState: GameState;

  beforeEach(() => {
    rulesEngine = new RulesEngine();
    actionHandler = new ActionHandler();
    
    // Setup: one token in play, one in home, dice {5,4} with capture opportunity
    gameState = {
      id: 'test-game',
      players: [
        {
          id: 'player1',
          color: 'red',
          status: 'active',
          tokens: [
            { id: 'r1', playerId: 'player1', position: -1, state: 'home' }, // in home
            { id: 'r2', playerId: 'player1', position: -1, state: 'home' }, // in home
            { id: 'r3', playerId: 'player1', position: 10, state: 'in-play' }, // on board
            { id: 'r4', playerId: 'player1', position: -1, state: 'home' } // in home
          ]
        },
        {
          id: 'player2', 
          color: 'blue',
          status: 'active',
          tokens: [
            { id: 'b1', playerId: 'player2', position: 14, state: 'in-play' }, // opponent token that can be captured
            { id: 'b2', playerId: 'player2', position: -1, state: 'home' },
            { id: 'b3', playerId: 'player2', position: -1, state: 'home' },
            { id: 'b4', playerId: 'player2', position: -1, state: 'home' }
          ]
        }
      ],
      currentPlayerIndex: 0,
      board: Array.from({ length: 52 }, () => []),
      status: 'in-progress',
      consecutiveSixes: 0,
      config: {
        diceMode: 'double',
        captureMode: 'finish', // Nigerian style - capturing token goes to finish
        maxConsecutiveSixes: 3,
        safeStartingSquares: true,
        allowTokenStacking: false,
        enforceFullDiceUsage: true
      }
    } as GameState;

    // Place the opponent token on board
    gameState.board[14] = ['b1']; // Blue token at position 14
  });

  test('should reject invalid capture+move sequence due to token finishing', () => {
    // This sequence was incorrectly validated before our fix:
    // 1. r3 captures with {4} (moves from 10 to 14, captures b1, goes to finish)
    // 2. Try to use {5} on r3 (but r3 is now finished and cannot move)
    const invalidTurnMove: TurnMove = {
      playerId: 'player1',
      diceValues: [5, 4],
      moves: [
        { tokenId: 'r3', steps: 4, dieIndex: 1 }, // Capture - token finishes
        { tokenId: 'r3', steps: 5, dieIndex: 0 }  // Should be invalid - token already finished
      ]
    };

    // This should now be correctly rejected
    const isValid = rulesEngine.validateTurnMove(gameState, invalidTurnMove);
    expect(isValid).toBe(false);
  });

  test('should allow valid non-capture sequence', () => {
    // This sequence should be valid:
    // 1. r3 moves with {5} (from 10 to 15)
    // 2. r3 moves with {4} (from 15 to 19)
    const validTurnMove: TurnMove = {
      playerId: 'player1',
      diceValues: [5, 4],
      moves: [
        { tokenId: 'r3', steps: 5, dieIndex: 0 }, // Move to position 15
        { tokenId: 'r3', steps: 4, dieIndex: 1 }  // Move to position 19
      ]
    };

    const isValid = rulesEngine.validateTurnMove(gameState, validTurnMove);
    expect(isValid).toBe(true);

    // Execute and verify no capture occurs
    const result = actionHandler.executeTurnMove(gameState, validTurnMove);
    expect(result.captured).toBe(false);
    expect(result.movesExecuted).toBe(2);
    
    // Verify final positions
    const r3 = gameState.players[0].tokens[2];
    const b1 = gameState.players[1].tokens[0];
    expect(r3.position).toBe(19);
    expect(r3.state).toBe('in-play');
    expect(b1.position).toBe(14); // Still at original position
    expect(b1.state).toBe('in-play');
  });

  test('should reject partial usage when full usage is possible', () => {
    // All partial usage attempts should be rejected
    const partialUsage1: TurnMove = {
      playerId: 'player1',
      diceValues: [5, 4],
      moves: [
        { tokenId: 'r3', steps: 4, dieIndex: 1 } // Only use {4} to capture
      ]
    };

    const partialUsage2: TurnMove = {
      playerId: 'player1',
      diceValues: [5, 4],
      moves: [
        { tokenId: 'r3', steps: 5, dieIndex: 0 } // Only use {5} to move
      ]
    };

    expect(rulesEngine.validateTurnMove(gameState, partialUsage1)).toBe(false);
    expect(rulesEngine.validateTurnMove(gameState, partialUsage2)).toBe(false);
  });

  test('should identify all valid move combinations correctly', () => {
    const diceValues = [5, 4];
    const allCombinations = rulesEngine.getAllValidMoveCombinations(gameState, 'player1', diceValues);
    
    // Should only find the valid non-capture sequence
    expect(allCombinations).toHaveLength(1);
    expect(allCombinations[0]).toEqual([
      { tokenId: 'r3', steps: 5, dieIndex: 0 },
      { tokenId: 'r3', steps: 4, dieIndex: 1 }
    ]);
  });

  test('execution should match validation for capture scenarios', () => {
    // Test the sequence that validation says is valid
    const validSequence: TurnMove = {
      playerId: 'player1',
      diceValues: [5, 4],
      moves: [
        { tokenId: 'r3', steps: 5, dieIndex: 0 },
        { tokenId: 'r3', steps: 4, dieIndex: 1 }
      ]
    };

    // Validation should pass
    const isValid = rulesEngine.validateTurnMove(gameState, validSequence);
    expect(isValid).toBe(true);

    // Execution should succeed without errors
    expect(() => {
      actionHandler.executeTurnMove(gameState, validSequence);
    }).not.toThrow();
  });
});
