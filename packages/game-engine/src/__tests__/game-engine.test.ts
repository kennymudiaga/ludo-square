// Integration tests for the complete game engine
import { GameStateManager } from '../game-state';
import { RulesEngine } from '../rules-engine';
import { ActionHandler } from '../action-handler';
import { GameConfig } from '../types';

describe('Game Engine Integration', () => {
  let gameManager: GameStateManager;
  let rulesEngine: RulesEngine;
  let actionHandler: ActionHandler;
  let config: GameConfig;

  beforeEach(() => {
    gameManager = new GameStateManager();
    rulesEngine = new RulesEngine();
    actionHandler = new ActionHandler();
    
    config = {
      diceMode: 'double',
      captureMode: 'finish',
      maxConsecutiveSixes: 3,
      safeStartingSquares: true,
      allowTokenStacking: false,
      enforceFullDiceUsage: false
    };
  });

  test('should create a complete game', () => {
    const playerConfigs = [
      { id: 'player1', color: 'red' as const },
      { id: 'player2', color: 'blue' as const }
    ];
    const game = gameManager.createGame(playerConfigs, config);
    
    expect(game.players).toHaveLength(2);
    expect(game.config).toEqual(config);
    expect(game.status).toBe('waiting');
    expect(game.currentPlayerIndex).toBe(0);
    expect(game.consecutiveSixes).toBe(0);
  });

  test('should handle a complete turn cycle', () => {
    const playerConfigs = [
      { id: 'player1', color: 'red' as const },
      { id: 'player2', color: 'blue' as const }
    ];
    const game = gameManager.createGame(playerConfigs, config);
    
    // Start the game
    gameManager.startGame(game);
    expect(game.status).toBe('in-progress');
    
    // Roll dice
    const diceRoll = actionHandler.rollDice(config);
    expect(diceRoll.values).toHaveLength(2);
    
    // Get available moves
    const moves = rulesEngine.getAvailableMoves(game, 'player1', diceRoll);
    expect(Array.isArray(moves)).toBe(true);
    
    // Advance turn
    gameManager.nextTurn(game, diceRoll.canMoveAgain);
    expect(game.consecutiveSixes).toBeGreaterThanOrEqual(0);
  });
});