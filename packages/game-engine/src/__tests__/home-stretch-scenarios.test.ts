// Tests for home stretch and finish line scenarios
import { RulesEngine } from '../rules-engine';
import { ActionHandler } from '../action-handler';
import { GameState, TurnMove, Player, GameConfig } from '../types';

describe('Home Stretch and Finish Line Scenarios', () => {
  let rulesEngine: RulesEngine;
  let actionHandler: ActionHandler;
  let gameState: GameState;
  let configWithFullDiceUsage: GameConfig;

  beforeEach(() => {
    rulesEngine = new RulesEngine();
    actionHandler = new ActionHandler();
    
    configWithFullDiceUsage = {
      diceMode: 'double',
      captureMode: 'finish',
      maxConsecutiveSixes: 3,
      safeStartingSquares: true,
      allowTokenStacking: false,
      enforceFullDiceUsage: true
    };
    
    // Create test game state with token near finish
    const players: Player[] = [
      {
        id: 'player1',
        color: 'red',
        status: 'active',
        tokens: [
          { id: 'r1', playerId: 'player1', position: 99, state: 'finished' },
          { id: 'r2', playerId: 'player1', position: 99, state: 'finished' },
          { id: 'r3', playerId: 'player1', position: 99, state: 'finished' },
          { id: 'r4', playerId: 'player1', position: 55, state: 'home-column' } // 3 away from finish (red home column: 52-57, so 55+3=58 would finish)
        ]
      }
    ];

    gameState = {
      id: 'test-game',
      config: configWithFullDiceUsage,
      players,
      currentPlayerIndex: 0,
      board: Array.from({ length: 52 }, () => []),
      status: 'in-progress',
      consecutiveSixes: 0
    };
  });

  describe('Token 3 Steps Away from Finish', () => {
    test('Scenario 1: Throws {5, 4} - should not be able to move (both overshoot)', () => {
      const turnMove: TurnMove = {
        playerId: 'player1',
        diceValues: [5, 4],
        moves: [] // No valid moves
      };

      // Should validate as true since no moves attempted and no moves are possible
      const isValid = rulesEngine.validateTurnMove(gameState, turnMove);
      expect(isValid).toBe(true);

      // Check that no valid moves are generated
      const validTurnMoves = actionHandler.getValidTurnMoves(gameState, 'player1', [5, 4]);
      expect(validTurnMoves.length).toBe(0); // No valid moves should be found
    });

    test('Scenario 2: Throws {3, 2} - should allow using 3 to finish (optimal)', () => {
      const optimalTurnMove: TurnMove = {
        playerId: 'player1',
        diceValues: [3, 2],
        moves: [
          { tokenId: 'r4', steps: 3, dieIndex: 0 } // Use 3 to finish, 2 becomes unusable
        ]
      };

      const isValid = rulesEngine.validateTurnMove(gameState, optimalTurnMove);
      expect(isValid).toBe(true);

      // Execute the move
      const result = actionHandler.executeTurnMove(gameState, optimalTurnMove);
      expect(result.movesExecuted).toBe(1);
      
      // Token should be finished
      const token = gameState.players[0].tokens[3];
      expect(token.position).toBe(99);
      expect(token.state).toBe('finished');
    });

    test('Scenario 2 Alternative: Throws {3, 2} - should allow using 2 first (suboptimal but legal)', () => {
      const suboptimalTurnMove: TurnMove = {
        playerId: 'player1',
        diceValues: [3, 2],
        moves: [
          { tokenId: 'r4', steps: 2, dieIndex: 1 } // Use 2 first, 3 becomes unusable due to overshoot
        ]
      };

      const isValid = rulesEngine.validateTurnMove(gameState, suboptimalTurnMove);
      expect(isValid).toBe(true);

      // Execute the move
      const result = actionHandler.executeTurnMove(gameState, suboptimalTurnMove);
      expect(result.movesExecuted).toBe(1);
      
      // Token should advance but not finish
      const token = gameState.players[0].tokens[3];
      expect(token.position).toBe(57); // 55 + 2
      expect(token.state).toBe('home-column');
    });

    test('Scenario 3: Throws {2, 1} - should allow both moves in sequence', () => {
      const turnMove: TurnMove = {
        playerId: 'player1',
        diceValues: [2, 1],
        moves: [
          { tokenId: 'r4', steps: 2, dieIndex: 0 }, // Move 2 first
          { tokenId: 'r4', steps: 1, dieIndex: 1 }  // Then move 1
        ]
      };

      const isValid = rulesEngine.validateTurnMove(gameState, turnMove);
      expect(isValid).toBe(true);

      // Execute the moves
      const result = actionHandler.executeTurnMove(gameState, turnMove);
      expect(result.movesExecuted).toBe(2);
      
      // Token should finish after both moves
      const token = gameState.players[0].tokens[3];
      expect(token.position).toBe(99); // Should finish when reaching position 57 (52+5)
      expect(token.state).toBe('finished');
    });

    test('Scenario 3 Alternative: Throws {2, 1} - should allow reverse order {1, 2}', () => {
      const turnMove: TurnMove = {
        playerId: 'player1',
        diceValues: [2, 1],
        moves: [
          { tokenId: 'r4', steps: 1, dieIndex: 1 }, // Move 1 first
          { tokenId: 'r4', steps: 2, dieIndex: 0 }  // Then move 2
        ]
      };

      const isValid = rulesEngine.validateTurnMove(gameState, turnMove);
      expect(isValid).toBe(true);

      // Execute the moves
      const result = actionHandler.executeTurnMove(gameState, turnMove);
      expect(result.movesExecuted).toBe(2);
      
      // Token should finish after both moves
      const token = gameState.players[0].tokens[3];
      expect(token.position).toBe(99);
      expect(token.state).toBe('finished');
    });

    test('Scenario 4: Throws {1, 1} - should require using both dice', () => {
      const turnMove: TurnMove = {
        playerId: 'player1',
        diceValues: [1, 1],
        moves: [
          { tokenId: 'r4', steps: 1, dieIndex: 0 }, // First die
          { tokenId: 'r4', steps: 1, dieIndex: 1 }  // Second die
        ]
      };

      const isValid = rulesEngine.validateTurnMove(gameState, turnMove);
      expect(isValid).toBe(true);

      // Execute the moves
      const result = actionHandler.executeTurnMove(gameState, turnMove);
      expect(result.movesExecuted).toBe(2);
      
      // Token should advance but not finish (55 + 1 + 1 = 57, needs >57 to finish)
      const token = gameState.players[0].tokens[3];
      expect(token.position).toBe(57);
      expect(token.state).toBe('home-column');
    });

    test('Scenario 4: Throws {1, 1} - should reject partial usage (only one die)', () => {
      const partialTurnMove: TurnMove = {
        playerId: 'player1',
        diceValues: [1, 1],
        moves: [
          { tokenId: 'r4', steps: 1, dieIndex: 0 } // Only using one die
        ]
      };

      // Should be rejected due to all-or-nothing rule
      const isValid = rulesEngine.validateTurnMove(gameState, partialTurnMove);
      expect(isValid).toBe(false);
    });
  });

  describe('Token 1 Step Away from Finish', () => {
    beforeEach(() => {
      // Position token 1 step away from finish
      gameState.players[0].tokens[3].position = 57; // 1 away from finish (57+1=58 would finish)
    });

    test('Throws {1, 3} - should allow using 1 to finish, 3 becomes unusable', () => {
      const turnMove: TurnMove = {
        playerId: 'player1',
        diceValues: [1, 3],
        moves: [
          { tokenId: 'r4', steps: 1, dieIndex: 0 } // Use 1 to finish
        ]
      };

      const isValid = rulesEngine.validateTurnMove(gameState, turnMove);
      expect(isValid).toBe(true);

      // Execute the move
      const result = actionHandler.executeTurnMove(gameState, turnMove);
      expect(result.movesExecuted).toBe(1);
      
      // Token should finish
      const token = gameState.players[0].tokens[3];
      expect(token.position).toBe(99);
      expect(token.state).toBe('finished');
    });

    test('Throws {2, 3} - should not allow any moves (both overshoot)', () => {
      const turnMove: TurnMove = {
        playerId: 'player1',
        diceValues: [2, 3],
        moves: [] // No valid moves
      };

      const isValid = rulesEngine.validateTurnMove(gameState, turnMove);
      expect(isValid).toBe(true);

      // Check that no valid moves are generated
      const validTurnMoves = actionHandler.getValidTurnMoves(gameState, 'player1', [2, 3]);
      expect(validTurnMoves).toEqual([]);
    });
  });

  describe('Token 2 Steps Away from Finish', () => {
    beforeEach(() => {
      // Position token 2 steps away from finish
      gameState.players[0].tokens[3].position = 56; // 2 away from finish (56+2=58 would finish)
    });

    test('Throws {2, 4} - should allow using 2 to finish, 4 becomes unusable', () => {
      const turnMove: TurnMove = {
        playerId: 'player1',
        diceValues: [2, 4],
        moves: [
          { tokenId: 'r4', steps: 2, dieIndex: 0 } // Use 2 to finish
        ]
      };

      const isValid = rulesEngine.validateTurnMove(gameState, turnMove);
      expect(isValid).toBe(true);

      // Execute the move
      const result = actionHandler.executeTurnMove(gameState, turnMove);
      expect(result.movesExecuted).toBe(1);
      
      // Token should finish
      const token = gameState.players[0].tokens[3];
      expect(token.position).toBe(99);
      expect(token.state).toBe('finished');
    });

    test('Throws {1, 1} - should require using both dice to finish', () => {
      const turnMove: TurnMove = {
        playerId: 'player1',
        diceValues: [1, 1],
        moves: [
          { tokenId: 'r4', steps: 1, dieIndex: 0 }, // First die
          { tokenId: 'r4', steps: 1, dieIndex: 1 }  // Second die
        ]
      };

      const isValid = rulesEngine.validateTurnMove(gameState, turnMove);
      expect(isValid).toBe(true);

      // Execute the moves
      const result = actionHandler.executeTurnMove(gameState, turnMove);
      expect(result.movesExecuted).toBe(2);
      
      // Token should finish after both moves
      const token = gameState.players[0].tokens[3];
      expect(token.position).toBe(99);
      expect(token.state).toBe('finished');
    });
  });

  describe('Multiple Tokens in Home Stretch', () => {
    beforeEach(() => {
      // Set up two tokens in home stretch
      gameState.players[0].tokens[2].position = 56; // r3: 2 away from finish
      gameState.players[0].tokens[2].state = 'home-column';
      gameState.players[0].tokens[3].position = 55; // r4: 3 away from finish
    });

    test('Throws {2, 3} - should allow optimal usage (r3 uses 2, r4 uses 3)', () => {
      const turnMove: TurnMove = {
        playerId: 'player1',
        diceValues: [2, 3],
        moves: [
          { tokenId: 'r3', steps: 2, dieIndex: 0 }, // r3 finishes with 2
          { tokenId: 'r4', steps: 3, dieIndex: 1 }  // r4 finishes with 3
        ]
      };

      const isValid = rulesEngine.validateTurnMove(gameState, turnMove);
      expect(isValid).toBe(true);

      // Execute the moves
      const result = actionHandler.executeTurnMove(gameState, turnMove);
      expect(result.movesExecuted).toBe(2);
      
      // Both tokens should finish
      const token3 = gameState.players[0].tokens[2];
      const token4 = gameState.players[0].tokens[3];
      expect(token3.position).toBe(99);
      expect(token3.state).toBe('finished');
      expect(token4.position).toBe(99);
      expect(token4.state).toBe('finished');
    });

    test('Throws {1, 4} - should allow r3 to move 1, 4 becomes unusable', () => {
      const suboptimalTurnMove: TurnMove = {
        playerId: 'player1',
        diceValues: [1, 4],
        moves: [
          { tokenId: 'r3', steps: 1, dieIndex: 0 } // r3 moves 1, 4 is unusable (both tokens would overshoot)
        ]
      };

      // This should be accepted because neither token can use the 4 (both would overshoot)
      const isValid = rulesEngine.validateTurnMove(gameState, suboptimalTurnMove);
      expect(isValid).toBe(true);
    });

    test('Throws {1, 4} - should enforce all-or-nothing rule', () => {
      const fullUsageTurnMove: TurnMove = {
        playerId: 'player1',
        diceValues: [1, 4],
        moves: [
          { tokenId: 'r3', steps: 1, dieIndex: 0 }, // r3 advances to 56
          { tokenId: 'r4', steps: 4, dieIndex: 1 }  // r4 would overshoot - this should be invalid
        ]
      };

      // This should be rejected because r4 moving 4 from position 54 would overshoot
      const isValid = rulesEngine.validateTurnMove(gameState, fullUsageTurnMove);
      expect(isValid).toBe(false);
    });
  });

  describe('Edge Cases with Home Column Calculations', () => {
    test('Should correctly identify when token can finish', () => {
      // Test various positions and step combinations
      const testCases = [
        { position: 56, steps: 1, shouldFinish: true },   // 56+1=57 (stay in home column)
        { position: 55, steps: 2, shouldFinish: true },   // 55+2=57 (stay in home column)  
        { position: 54, steps: 3, shouldFinish: true },   // 54+3=57 (stay in home column)
        { position: 56, steps: 2, shouldFinish: true },   // 56+2=58 (finish exactly)
        { position: 55, steps: 3, shouldFinish: true },   // 55+3=58 (finish exactly)
        { position: 54, steps: 5, shouldFinish: false },  // 54+5=59 (overshoot)
      ];

      testCases.forEach(({ position, steps, shouldFinish }) => {
        // Set up token at specific position
        gameState.players[0].tokens[3].position = position;
        gameState.players[0].tokens[3].state = 'home-column';

        const turnMove: TurnMove = {
          playerId: 'player1',
          diceValues: [steps],
          moves: [
            { tokenId: 'r4', steps, dieIndex: 0 }
          ]
        };

        const combinations = rulesEngine.getAllValidMoveCombinations(gameState, 'player1', [steps]);
        const hasValidMove = combinations.some(combo => combo.length > 0);

        if (shouldFinish) {
          expect(hasValidMove).toBe(true);
        } else {
          expect(hasValidMove).toBe(false);
        }
      });
    });
  });
});
