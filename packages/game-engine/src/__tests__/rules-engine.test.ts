// Tests for RulesEngine class
import { RulesEngine } from '../rules-engine';
import { GameState, Move, Player, Token, DiceRoll, GameConfig } from '../types';

describe('RulesEngine', () => {
  let rulesEngine: RulesEngine;
  let gameState: GameState;
  let defaultConfig: GameConfig;

  beforeEach(() => {
    rulesEngine = new RulesEngine();
    
    defaultConfig = {
      diceMode: 'double',
      captureMode: 'finish',
      maxConsecutiveSixes: 3,
      safeStartingSquares: true,
      allowTokenStacking: false,
      enforceFullDiceUsage: false
    };
    
    // Create basic game state for testing
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
          { id: 'b2', playerId: 'player2', position: 13, state: 'in-play' },
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

    // Set up board state
    gameState.board[5] = ['r2'];
    gameState.board[13] = ['b2'];
    gameState.board[45] = ['r3'];
  });

  describe('Move Validation', () => {
    test('should allow moving token out of home with 6', () => {
      const move: Move = { playerId: 'player1', tokenId: 'r1', steps: 6 };
      const diceRoll: DiceRoll = { values: [6], sum: 6, canMoveAgain: true, hasValidSix: true };
      const isValid = rulesEngine.isValidMove(gameState, move, diceRoll);
      
      expect(isValid).toBe(true);
    });

    test('should not allow moving token out of home without 6', () => {
      for (let steps = 1; steps <= 5; steps++) {
        const move: Move = { playerId: 'player1', tokenId: 'r1', steps };
        const diceRoll: DiceRoll = { values: [steps], sum: steps, canMoveAgain: false, hasValidSix: false };
        const isValid = rulesEngine.isValidMove(gameState, move, diceRoll);
        
        expect(isValid).toBe(false);
      }
    });

    test('should allow normal forward movement', () => {
      const move: Move = { playerId: 'player1', tokenId: 'r2', steps: 4 };
      const diceRoll: DiceRoll = { values: [4], sum: 4, canMoveAgain: false, hasValidSix: false };
      const isValid = rulesEngine.isValidMove(gameState, move, diceRoll);
      
      expect(isValid).toBe(true);
    });

    test('should not allow moving opponent tokens', () => {
      const move: Move = { playerId: 'player1', tokenId: 'b1', steps: 6 };
      const diceRoll: DiceRoll = { values: [6], sum: 6, canMoveAgain: true, hasValidSix: true };
      const isValid = rulesEngine.isValidMove(gameState, move, diceRoll);
      
      expect(isValid).toBe(false);
    });

    test('should not allow moving finished tokens', () => {
      const move: Move = { playerId: 'player1', tokenId: 'r4', steps: 3 };
      const diceRoll: DiceRoll = { values: [3], sum: 3, canMoveAgain: false, hasValidSix: false };
      const isValid = rulesEngine.isValidMove(gameState, move, diceRoll);
      
      expect(isValid).toBe(false);
    });
  });

  describe('Safe Squares', () => {
    test('should identify safe squares correctly', () => {
      // Starting squares are safe
      expect(rulesEngine.isSafeSquare(0, 'player1')).toBe(true); // Red start
      expect(rulesEngine.isSafeSquare(13, 'player2')).toBe(true); // Blue start
      
      // Additional safe squares
      expect(rulesEngine.isSafeSquare(8, 'player1')).toBe(true); // Red safe
      expect(rulesEngine.isSafeSquare(21, 'player2')).toBe(true); // Blue safe
    });
  });

  describe('Capturing Rules', () => {
    test('should identify capturable situations', () => {
      const canCapture = rulesEngine.canCaptureAt(gameState, 13, 'player1');
      
      expect(canCapture).toBe(false); // Blue token at starting square (safe)
    });

    test('should not capture own tokens', () => {
      const canCapture = rulesEngine.canCaptureAt(gameState, 0, 'player1');
      
      expect(canCapture).toBe(false); // Red token at 0, red cannot capture itself
    });
  });

  describe('Home Column Rules', () => {
    test('should calculate home column entry point', () => {
      const redEntry = rulesEngine.getHomeColumnEntry('red');
      const blueEntry = rulesEngine.getHomeColumnEntry('blue');
      const greenEntry = rulesEngine.getHomeColumnEntry('green');
      const yellowEntry = rulesEngine.getHomeColumnEntry('yellow');
      
      expect(redEntry).toBe(51);
      expect(blueEntry).toBe(12);
      expect(greenEntry).toBe(25);
      expect(yellowEntry).toBe(38);
    });
  });

  describe('Win Conditions', () => {
    test('should detect player win', () => {
      const player = gameState.players[0];
      
      // Set all tokens to finished
      player.tokens.forEach(token => {
        token.position = 99;
        token.state = 'finished';
      });
      
      const hasWon = rulesEngine.hasPlayerWon(player);
      expect(hasWon).toBe(true);
    });

    test('should not detect win with incomplete tokens', () => {
      const player = gameState.players[0];
      
      // Reset all tokens first
      player.tokens.forEach(token => {
        token.position = -1;
        token.state = 'home';
      });
      
      // Only 3 tokens finished
      player.tokens.slice(0, 3).forEach(token => {
        token.position = 99;
        token.state = 'finished';
      });
      
      const hasWon = rulesEngine.hasPlayerWon(player);
      expect(hasWon).toBe(false);
    });
  });

  describe('Available Moves', () => {
    test('should return all valid moves for dice roll', () => {
      const diceRoll: DiceRoll = { values: [2, 2], sum: 4, canMoveAgain: false, hasValidSix: false };
      const moves = rulesEngine.getAvailableMoves(gameState, 'player1', diceRoll);
      
      expect(moves.length).toBeGreaterThan(0);
      moves.forEach(move => {
        expect(move.steps).toBe(4);
        expect(move.playerId).toBe('player1');
      });
    });

    test('should return move out of home for roll of 6', () => {
      const diceRoll: DiceRoll = { values: [6], sum: 6, canMoveAgain: true, hasValidSix: true };
      const moves = rulesEngine.getAvailableMoves(gameState, 'player1', diceRoll);
      
      const homeMove = moves.find(move => move.tokenId === 'r1');
      expect(homeMove).toBeDefined();
    });
  });
});
