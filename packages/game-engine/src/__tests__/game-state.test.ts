// Tests for GameStateManager class
import { GameStateManager } from '../game-state';
import { Player, GameState, GameConfig } from '../types';

describe('GameStateManager', () => {
  let gameManager: GameStateManager;
  let defaultConfig: GameConfig;

  beforeEach(() => {
    gameManager = new GameStateManager();
    defaultConfig = {
      diceMode: 'double',
      captureMode: 'finish',
      maxConsecutiveSixes: 3,
      safeStartingSquares: true,
      allowTokenStacking: false,
      enforceFullDiceUsage: false
    };
  });

  describe('Game Creation', () => {
    test('should create game with valid players and config', () => {
      const players = [
        { id: 'p1', color: 'red' as const },
        { id: 'p2', color: 'blue' as const }
      ];
      
      const game = gameManager.createGame(players, defaultConfig);
      
      expect(game.id).toBeDefined();
      expect(game.players).toHaveLength(2);
      expect(game.status).toBe('waiting');
      expect(game.board).toHaveLength(52);
      expect(game.currentPlayerIndex).toBe(0);
      expect(game.config).toEqual(defaultConfig);
      expect(game.consecutiveSixes).toBe(0);
    });

    test('should assign unique token IDs with playerId', () => {
      const players = [{ id: 'p1', color: 'red' as const }];
      const game = gameManager.createGame(players, defaultConfig);
      
      const tokens = game.players[0].tokens;
      expect(tokens).toHaveLength(4);
      
      const tokenIds = tokens.map(t => t.id);
      const uniqueIds = new Set(tokenIds);
      expect(uniqueIds.size).toBe(4); // All token IDs should be unique
      
      tokens.forEach(token => {
        expect(token.playerId).toBe('p1');
        expect(token.position).toBe(-1);
        expect(token.state).toBe('home');
      });
    });

    test('should initialize board as empty', () => {
      const players = [{ id: 'p1', color: 'red' as const }];
      const game = gameManager.createGame(players, defaultConfig);
      
      expect(game.board.every(square => Array.isArray(square) && square.length === 0)).toBe(true);
    });
  });

  describe('Game State Updates', () => {
    test('should update game state immutably', () => {
      const players = [{ id: 'p1', color: 'red' as const }];
      const originalGame = gameManager.createGame(players, defaultConfig);
      
      const updates = { status: 'in-progress' as const };
      const updatedGame = gameManager.updateGameState(originalGame, updates);
      
      expect(originalGame.status).toBe('waiting');
      expect(updatedGame.status).toBe('in-progress');
      expect(updatedGame).not.toBe(originalGame); // Different objects
    });

    test('should preserve unmodified properties', () => {
      const players = [{ id: 'p1', color: 'red' as const }];
      const originalGame = gameManager.createGame(players, defaultConfig);
      
      const updates = { currentPlayerIndex: 1 };
      const updatedGame = gameManager.updateGameState(originalGame, updates);
      
      expect(updatedGame.id).toBe(originalGame.id);
      expect(updatedGame.players).toEqual(originalGame.players);
      expect(updatedGame.config).toEqual(originalGame.config);
      expect(updatedGame.currentPlayerIndex).toBe(1);
    });
  });

  describe('Turn Management', () => {
    test('should advance turn to next player', () => {
      const players = [
        { id: 'p1', color: 'red' as const },
        { id: 'p2', color: 'blue' as const }
      ];
      const game = gameManager.createGame(players, defaultConfig);
      
      gameManager.nextTurn(game, false);
      
      expect(game.currentPlayerIndex).toBe(1);
      expect(game.consecutiveSixes).toBe(0);
    });

    test('should stay on same player with extra turn', () => {
      const players = [
        { id: 'p1', color: 'red' as const },
        { id: 'p2', color: 'blue' as const }
      ];
      const game = gameManager.createGame(players, defaultConfig);
      
      gameManager.nextTurn(game, true);
      
      expect(game.currentPlayerIndex).toBe(0);
      expect(game.consecutiveSixes).toBe(1);
    });

    test('should limit consecutive sixes', () => {
      const players = [
        { id: 'p1', color: 'red' as const },
        { id: 'p2', color: 'blue' as const }
      ];
      const game = gameManager.createGame(players, defaultConfig);
      game.consecutiveSixes = 2;
      
      gameManager.nextTurn(game, true); // Third consecutive six
      
      expect(game.currentPlayerIndex).toBe(1); // Should advance despite six
      expect(game.consecutiveSixes).toBe(0);
    });

    test('should cycle back to first player', () => {
      const players = [
        { id: 'p1', color: 'red' as const },
        { id: 'p2', color: 'blue' as const }
      ];
      const game = gameManager.createGame(players, defaultConfig);
      game.currentPlayerIndex = 1;
      
      gameManager.nextTurn(game, false);
      
      expect(game.currentPlayerIndex).toBe(0);
    });
  });

  describe('Game End Detection', () => {
    test('should detect game end when player wins', () => {
      const players = [{ id: 'p1', color: 'red' as const }];
      const game = gameManager.createGame(players, defaultConfig);
      
      // Set all tokens to finished
      game.players[0].tokens.forEach(token => {
        token.position = 99;
        token.state = 'finished';
      });
      
      gameManager.checkGameEnd(game);
      
      expect(game.status).toBe('finished');
      expect(game.winner).toBe('p1');
    });

    test('should not end game prematurely', () => {
      const players = [{ id: 'p1', color: 'red' as const }];
      const game = gameManager.createGame(players, defaultConfig);
      
      // Only 3 tokens finished
      game.players[0].tokens.slice(0, 3).forEach(token => {
        token.position = 99;
        token.state = 'finished';
      });
      
      gameManager.checkGameEnd(game);
      
      expect(game.status).not.toBe('finished');
      expect(game.winner).toBeUndefined();
    });
  });
});
