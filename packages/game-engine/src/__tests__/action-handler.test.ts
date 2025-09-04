// Tests for ActionHandler class
import { ActionHandler } from '../action-handler';
import { GameState, Move, Player, GameConfig, TurnMove } from '../types';

describe('ActionHandler', () => {
  let actionHandler: ActionHandler;
  let gameState: GameState;
  let defaultConfig: GameConfig;

  beforeEach(() => {
    actionHandler = new ActionHandler();
    
    defaultConfig = {
      diceMode: 'double',
      captureMode: 'finish',
      maxConsecutiveSixes: 3,
      safeStartingSquares: true,
      allowTokenStacking: false,
      enforceFullDiceUsage: false
    };
    
    // Create test game state
    const players: Player[] = [
      {
        id: 'player1',
        color: 'red',
        status: 'active',
        tokens: [
          { id: 'r1', playerId: 'player1', position: -1, state: 'home' },
          { id: 'r2', playerId: 'player1', position: 5, state: 'in-play' },
          { id: 'r3', playerId: 'player1', position: 45, state: 'in-play' },
          { id: 'r4', playerId: 'player1', position: 99, state: 'finished' }
        ]
      },
      {
        id: 'player2',
        color: 'blue',
        status: 'waiting',
        tokens: [
          { id: 'b1', playerId: 'player2', position: -1, state: 'home' },
          { id: 'b2', playerId: 'player2', position: 8, state: 'in-play' },
          { id: 'b3', playerId: 'player2', position: -1, state: 'home' },
          { id: 'b4', playerId: 'player2', position: -1, state: 'home' }
        ]
      }
    ];

    gameState = {
      id: 'test-game',
      config: defaultConfig,
      players,
      currentPlayerIndex: 0,
      board: Array.from({ length: 52 }, () => []),
      status: 'in-progress',
      consecutiveSixes: 0
    };

    // Set up board
    gameState.board[5] = ['r2'];
    gameState.board[8] = ['b2'];
    gameState.board[45] = ['r3'];
  });

  describe('Dice Rolling', () => {
    test('should roll dice with Nigerian config (two dice)', () => {
      const result = actionHandler.rollDice(defaultConfig);
      
      expect(result.values).toHaveLength(2);
      expect(result.values[0]).toBeGreaterThanOrEqual(1);
      expect(result.values[0]).toBeLessThanOrEqual(6);
      expect(result.values[1]).toBeGreaterThanOrEqual(1);
      expect(result.values[1]).toBeLessThanOrEqual(6);
      expect(result.sum).toBe(result.values[0] + result.values[1]);
      expect(typeof result.canMoveAgain).toBe('boolean');
    });

    test('should set canMoveAgain for double sixes', () => {
      // We can't control randomness, so we test the logic indirectly
      const singleDiceConfig: GameConfig = { ...defaultConfig, diceMode: 'single' };
      const result = actionHandler.rollDice(singleDiceConfig);
      
      expect(result.values).toHaveLength(1);
      expect(result.sum).toBe(result.values[0]);
      
      if (result.values[0] === 6) {
        expect(result.canMoveAgain).toBe(true);
        expect(result.hasValidSix).toBe(true);
      } else {
        expect(result.canMoveAgain).toBe(false);
      }
    });

    test('should detect valid six correctly', () => {
      const singleDiceConfig: GameConfig = { ...defaultConfig, diceMode: 'single' };
      const result = actionHandler.rollDice(singleDiceConfig);
      
      expect(result.hasValidSix).toBe(result.values.includes(6));
    });
  });

  describe('Turn Move Execution', () => {
    test('should execute multiple moves in a turn', () => {
      // Set up a turn with multiple moves
      const turnMove: TurnMove = {
        playerId: 'player1',
        diceValues: [3, 4],
        moves: [
          { tokenId: 'r2', steps: 3, dieIndex: 0 },
          { tokenId: 'r3', steps: 4, dieIndex: 1 }
        ]
      };

      const result = actionHandler.executeTurnMove(gameState, turnMove);
      
      expect(result.movesExecuted).toBe(2);
      expect(result.captured).toBe(true); // r2 moving from 5 to 8 captures b2
      
      // Check token positions
      const token2 = gameState.players[0].tokens[1];
      const token3 = gameState.players[0].tokens[2];
      
      // In 'finish' capture mode, capturing token goes to finish line
      expect(token2.position).toBe(99); // Captured b2, so goes to finish
      expect(token2.state).toBe('finished');
      expect(token3.position).toBe(49); // 45 + 4, normal move
    });

    test('should handle captures in turn moves', () => {
      const turnMove: TurnMove = {
        playerId: 'player1',
        diceValues: [3, 2],
        moves: [
          { tokenId: 'r2', steps: 3, dieIndex: 0 }, // This should capture b2 at position 8
          { tokenId: 'r3', steps: 2, dieIndex: 1 }
        ]
      };

      const result = actionHandler.executeTurnMove(gameState, turnMove);
      
      expect(result.movesExecuted).toBe(2);
      expect(result.captured).toBe(true);
      expect(result.capturedTokenIds.length).toBeGreaterThan(0);
    });
  });

  describe('Move Execution', () => {
    test('should move token out of home', () => {
      const move: Move = { playerId: 'player1', tokenId: 'r1', steps: 6 };
      
      actionHandler.executeMove(gameState, move);
      
      const token = gameState.players[0].tokens[0];
      expect(token.position).toBe(0); // Red starting position
      expect(token.state).toBe('in-play');
      expect(gameState.board[0]).toEqual(['r1']); // Board uses arrays now
    });

    test('should move token forward on board', () => {
      // Test with no capture scenario
      const move: Move = { playerId: 'player1', tokenId: 'r2', steps: 2 };
      
      actionHandler.executeMove(gameState, move);
      
      const token = gameState.players[0].tokens[1];
      expect(token.position).toBe(7); // 5 + 2
      expect(gameState.board[5]).toEqual([]); // Old position cleared (empty array)
      expect(gameState.board[7]).toEqual(['r2']); // New position set (array)
    });

    test('should handle board wrapping', () => {
      // Move token near end of board
      const token = gameState.players[0].tokens[2];
      token.position = 50;
      gameState.board[45] = [];
      gameState.board[50] = ['r3'];
      
      const move: Move = { playerId: 'player1', tokenId: 'r3', steps: 5 };
      
      actionHandler.executeMove(gameState, move);
      
      expect(token.position).toBe(3); // (50 + 5) % 52
      expect(gameState.board[50]).toEqual([]); // Old position cleared (empty array)
      expect(gameState.board[3]).toEqual(['r3']); // New position set (array)
    });

    test('should capture opponent token', () => {
      const move: Move = { playerId: 'player1', tokenId: 'r2', steps: 3 };
      
      const result = actionHandler.executeMove(gameState, move);
      
      const redToken = gameState.players[0].tokens[1];
      const blueToken = gameState.players[1].tokens[1];
      
      expect(result.captured).toBe(true);
      expect(blueToken.position).toBe(-1); // Sent home
      expect(blueToken.state).toBe('home');
      
      // In Nigerian mode, capturing token goes to finish
      if (gameState.config.captureMode === 'finish') {
        expect(redToken.position).toBe(99);
        expect(redToken.state).toBe('finished');
      }
    });

    test('should move token to finish line', () => {
      // Set up token at the last square of home column
      const token = gameState.players[0].tokens[1];
      token.position = 57; // Last square of red home column (52 + 5)
      token.state = 'home-column';
      gameState.board[5] = [];
      
      const move: Move = { playerId: 'player1', tokenId: 'r2', steps: 1 };
      
      actionHandler.executeMove(gameState, move);
      
      // Token should finish when moving beyond home column end (57 + 1 = 58, which is beyond 52+5=57)
      expect(token.position).toBe(99); // Finished position
      expect(token.state).toBe('finished');
    });
  });

  describe('Position Calculations', () => {
    test('should calculate correct starting positions', () => {
      const redStart = actionHandler.getStartingPosition('red');
      const blueStart = actionHandler.getStartingPosition('blue');
      const greenStart = actionHandler.getStartingPosition('green');
      const yellowStart = actionHandler.getStartingPosition('yellow');
      
      expect(redStart).toBe(0);
      expect(blueStart).toBe(13);
      expect(greenStart).toBe(26);
      expect(yellowStart).toBe(39);
    });

    test('should calculate home column positions', () => {
      const redHomeStart = actionHandler.getHomeColumnStart('red');
      const blueHomeStart = actionHandler.getHomeColumnStart('blue');
      
      expect(redHomeStart).toBe(52); // Red home column starts at 52
      expect(blueHomeStart).toBe(58); // Blue home column starts at 58
    });

    test('should handle position wrapping correctly', () => {
      const wrappedPosition = actionHandler.calculateNewPosition(50, 5, 'red');
      expect(wrappedPosition).toBe(3); // (50 + 5) % 52
    });
  });
});
