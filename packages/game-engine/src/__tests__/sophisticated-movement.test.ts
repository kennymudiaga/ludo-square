// Tests for sophisticated individual die movement rules
import { RulesEngine } from '../rules-engine';
import { ActionHandler } from '../action-handler';
import { GameState, TurnMove, Player, GameConfig } from '../types';

describe('Sophisticated Movement Rules', () => {
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
      enforceFullDiceUsage: true // Enable sophisticated rule
    };
    
    // Create test game state with complex setup
    const players: Player[] = [
      {
        id: 'player1',
        color: 'red',
        status: 'active',
        tokens: [
          { id: 'r1', playerId: 'player1', position: -1, state: 'home' },
          { id: 'r2', playerId: 'player1', position: 5, state: 'in-play' },
          { id: 'r3', playerId: 'player1', position: 15, state: 'in-play' },
          { id: 'r4', playerId: 'player1', position: 25, state: 'in-play' }
        ]
      },
      {
        id: 'player2',
        color: 'blue',
        status: 'waiting',
        tokens: [
          { id: 'b1', playerId: 'player2', position: -1, state: 'home' },
          { id: 'b2', playerId: 'player2', position: 10, state: 'in-play' },
          { id: 'b3', playerId: 'player2', position: 20, state: 'in-play' },
          { id: 'b4', playerId: 'player2', position: 30, state: 'in-play' }
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

    // Set up board
    gameState.board[5] = ['r2'];
    gameState.board[15] = ['r3'];
    gameState.board[25] = ['r4'];
    gameState.board[10] = ['b2'];
    gameState.board[20] = ['b3'];
    gameState.board[30] = ['b4'];
  });

  describe('Individual Die Usage Rules', () => {
    test('should validate moves using individual dice values (no summing)', () => {
      const validTurnMove: TurnMove = {
        playerId: 'player1',
        diceValues: [3, 4],
        moves: [
          { tokenId: 'r2', steps: 3, dieIndex: 0 }, // Use first die (3)
          { tokenId: 'r3', steps: 4, dieIndex: 1 }  // Use second die (4)
        ]
      };

      const isValid = rulesEngine.validateTurnMove(gameState, validTurnMove);
      expect(isValid).toBe(true);
    });

    test('should reject moves that try to sum dice values', () => {
      const invalidTurnMove: TurnMove = {
        playerId: 'player1',
        diceValues: [3, 4],
        moves: [
          { tokenId: 'r2', steps: 7, dieIndex: 0 } // Invalid: trying to use sum (3+4)
        ]
      };

      const isValid = rulesEngine.validateTurnMove(gameState, invalidTurnMove);
      expect(isValid).toBe(false);
    });

    test('should allow using same die value on different tokens', () => {
      const validTurnMove: TurnMove = {
        playerId: 'player1',
        diceValues: [3, 3],
        moves: [
          { tokenId: 'r2', steps: 3, dieIndex: 0 }, // Use first die (3)
          { tokenId: 'r3', steps: 3, dieIndex: 1 }  // Use second die (3)
        ]
      };

      const isValid = rulesEngine.validateTurnMove(gameState, validTurnMove);
      expect(isValid).toBe(true);
    });
  });

  describe('All-or-Nothing Rule Enforcement', () => {
    test('should enforce full dice usage when all dice can be used', () => {
      // Both dice can be used, so partial usage should be rejected
      const partialUsageTurnMove: TurnMove = {
        playerId: 'player1',
        diceValues: [2, 3],
        moves: [
          { tokenId: 'r2', steps: 2, dieIndex: 0 } // Only using one die
        ]
      };

      const isValid = rulesEngine.validateTurnMove(gameState, partialUsageTurnMove);
      expect(isValid).toBe(false); // Should be rejected due to all-or-nothing rule
    });

    test('should prevent cherry-picking favorable moves', () => {
      // Setup: r2 can capture with die value 5, r3 can move safely with die value 3
      // Place opponent token at position 10 (5+5=10)
      const cherryPickState = { ...gameState };
      cherryPickState.board[10] = ['b1'];
      cherryPickState.players[1].tokens[0].position = 10;
      cherryPickState.players[1].tokens[0].state = 'in-play';

      const cherryPickTurnMove: TurnMove = {
        playerId: 'player1',
        diceValues: [5, 3],
        moves: [
          { tokenId: 'r2', steps: 5, dieIndex: 0 } // Cherry-pick capture, ignore die value 3
        ]
      };

      const isValid = rulesEngine.validateTurnMove(cherryPickState, cherryPickTurnMove);
      expect(isValid).toBe(false); // Should be rejected - must use both dice
    });
  });

  describe('Move Combination Generation', () => {
    test('should generate all valid move combinations', () => {
      const combinations = rulesEngine.getAllValidMoveCombinations(
        gameState, 
        'player1', 
        [2, 3]
      );

      expect(combinations.length).toBeGreaterThan(0);
      
      // Each combination should use specific dice
      combinations.forEach(combination => {
        expect(combination.length).toBeGreaterThanOrEqual(1);
        combination.forEach(move => {
          expect([2, 3]).toContain(move.steps);
          expect(move.dieIndex).toBeGreaterThanOrEqual(0);
          expect(move.dieIndex).toBeLessThan(2);
        });
      });
    });

    test('should find full dice usage combinations when possible', () => {
      const combinations = rulesEngine.getAllValidMoveCombinations(
        gameState, 
        'player1', 
        [2, 3]
      );

      // Should find at least one combination that uses both dice
      const fullUsageCombinations = combinations.filter(combo => combo.length === 2);
      expect(fullUsageCombinations.length).toBeGreaterThan(0);
    });

    test('should handle complex scenarios with captures', () => {
      // Place opponent token where it can be captured
      const captureState = { ...gameState };
      captureState.board[7] = ['b1']; // Can be captured by r2 moving 2 steps (5+2=7)
      captureState.players[1].tokens[0].position = 7;
      captureState.players[1].tokens[0].state = 'in-play';

      const combinations = rulesEngine.getAllValidMoveCombinations(
        captureState, 
        'player1', 
        [2, 3]
      );

      // Should generate combinations that include the capture move
      const captureMoveCombos = combinations.filter(combo => 
        combo.some(move => move.tokenId === 'r2' && move.steps === 2)
      );
      expect(captureMoveCombos.length).toBeGreaterThan(0);
    });
  });

  describe('Strategic Move Ordering', () => {
    test('should allow player to choose move order', () => {
      const turnMove1: TurnMove = {
        playerId: 'player1',
        diceValues: [2, 3],
        moves: [
          { tokenId: 'r2', steps: 2, dieIndex: 0 }, // Use 2 first
          { tokenId: 'r3', steps: 3, dieIndex: 1 }  // Use 3 second
        ]
      };

      const turnMove2: TurnMove = {
        playerId: 'player1',
        diceValues: [2, 3],
        moves: [
          { tokenId: 'r3', steps: 3, dieIndex: 1 }, // Use 3 first
          { tokenId: 'r2', steps: 2, dieIndex: 0 }  // Use 2 second
        ]
      };

      expect(rulesEngine.validateTurnMove(gameState, turnMove1)).toBe(true);
      expect(rulesEngine.validateTurnMove(gameState, turnMove2)).toBe(true);
    });

    test('should validate die index consistency', () => {
      const invalidTurnMove: TurnMove = {
        playerId: 'player1',
        diceValues: [2, 3],
        moves: [
          { tokenId: 'r2', steps: 2, dieIndex: 0 },
          { tokenId: 'r3', steps: 2, dieIndex: 0 } // Invalid: reusing same die index
        ]
      };

      const isValid = rulesEngine.validateTurnMove(gameState, invalidTurnMove);
      expect(isValid).toBe(false);
    });
  });

  describe('ActionHandler TurnMove Integration', () => {
    test('should execute valid turn moves correctly', () => {
      const turnMove: TurnMove = {
        playerId: 'player1',
        diceValues: [2, 3],
        moves: [
          { tokenId: 'r2', steps: 2, dieIndex: 0 },
          { tokenId: 'r3', steps: 3, dieIndex: 1 }
        ]
      };

      const result = actionHandler.executeTurnMove(gameState, turnMove);
      
      expect(result.movesExecuted).toBe(2);
      expect(result.captured).toBe(false);
      
      // Check final positions
      const token2 = gameState.players[0].tokens[1];
      const token3 = gameState.players[0].tokens[2];
      expect(token2.position).toBe(7); // 5 + 2
      expect(token3.position).toBe(18); // 15 + 3
    });

    test('should generate valid turn moves', () => {
      const validTurnMoves = actionHandler.getValidTurnMoves(
        gameState, 
        'player1', 
        [2, 3]
      );

      expect(validTurnMoves.length).toBeGreaterThan(0);
      
      // All generated moves should be valid
      validTurnMoves.forEach(turnMove => {
        expect(rulesEngine.validateTurnMove(gameState, turnMove)).toBe(true);
      });
    });

    test('should handle 6s for getting out of home', () => {
      const homeState = { ...gameState };
      // Reset tokens to home
      homeState.players[0].tokens.forEach(token => {
        token.position = -1;
        token.state = 'home';
      });
      homeState.board = Array.from({ length: 52 }, () => []);

      const validTurnMoves = actionHandler.getValidTurnMoves(
        homeState, 
        'player1', 
        [6, 3]
      );

      // Should include moves that use the 6 to get out of home
      const homeExitMoves = validTurnMoves.filter(turnMove =>
        turnMove.moves.some(move => 
          move.steps === 6 && 
          homeState.players[0].tokens.find(t => t.id === move.tokenId)?.state === 'home'
        )
      );
      expect(homeExitMoves.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty dice values', () => {
      const emptyTurnMove: TurnMove = {
        playerId: 'player1',
        diceValues: [],
        moves: []
      };

      const isValid = rulesEngine.validateTurnMove(gameState, emptyTurnMove);
      expect(isValid).toBe(true); // Empty turn is technically valid
    });

    test('should reject moves for wrong player', () => {
      const wrongPlayerTurnMove: TurnMove = {
        playerId: 'player2', // Wrong player
        diceValues: [2, 3],
        moves: [
          { tokenId: 'r2', steps: 2, dieIndex: 0 } // Red token but blue player
        ]
      };

      const isValid = rulesEngine.validateTurnMove(gameState, wrongPlayerTurnMove);
      expect(isValid).toBe(false);
    });

    test('should handle invalid die indices', () => {
      const invalidDieIndexTurnMove: TurnMove = {
        playerId: 'player1',
        diceValues: [2, 3],
        moves: [
          { tokenId: 'r2', steps: 2, dieIndex: 5 } // Invalid die index
        ]
      };

      const isValid = rulesEngine.validateTurnMove(gameState, invalidDieIndexTurnMove);
      expect(isValid).toBe(false);
    });

    test('should handle step-die value mismatch', () => {
      const mismatchTurnMove: TurnMove = {
        playerId: 'player1',
        diceValues: [2, 3],
        moves: [
          { tokenId: 'r2', steps: 4, dieIndex: 0 } // Steps don't match die value at index 0 (2)
        ]
      };

      const isValid = rulesEngine.validateTurnMove(gameState, mismatchTurnMove);
      expect(isValid).toBe(false);
    });
  });

  describe('Configuration Toggle', () => {
    test('should allow partial dice usage when enforceFullDiceUsage is false', () => {
      const lenientConfig = { ...configWithFullDiceUsage, enforceFullDiceUsage: false };
      const lenientGameState = { ...gameState, config: lenientConfig };

      const partialUsageTurnMove: TurnMove = {
        playerId: 'player1',
        diceValues: [2, 3],
        moves: [
          { tokenId: 'r2', steps: 2, dieIndex: 0 } // Only using one die
        ]
      };

      const isValid = rulesEngine.validateTurnMove(lenientGameState, partialUsageTurnMove);
      expect(isValid).toBe(true); // Should be allowed when rule is disabled
    });

    test('should maintain basic move validation even with lenient config', () => {
      const lenientConfig = { ...configWithFullDiceUsage, enforceFullDiceUsage: false };
      const lenientGameState = { ...gameState, config: lenientConfig };

      const invalidBasicMove: TurnMove = {
        playerId: 'player1',
        diceValues: [2, 3],
        moves: [
          { tokenId: 'nonexistent-token', steps: 2, dieIndex: 0 } // Invalid: nonexistent token
        ]
      };

      const isValid = rulesEngine.validateTurnMove(lenientGameState, invalidBasicMove);
      expect(isValid).toBe(false); // Basic validation should still apply
    });
  });
});
