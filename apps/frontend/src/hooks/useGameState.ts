import { useState, useCallback, useEffect } from 'react';
import { 
  GameStateManager, 
  ActionHandler, 
  RulesEngine,
  GameState, 
  Color, 
  TurnMove,
  Move,
  GameConfig
} from '@ludo-square/game-engine';

interface UseGameStateReturn {
  gameState: GameState | null;
  currentPlayer: any;
  isLoading: boolean;
  error: string | null;
  diceValues: [number, number] | null;
  isRolling: boolean;
  usedDice: [boolean, boolean];
  availableMoves: Array<{ tokenId: string; steps: number; dieIndex: number }>;
  selectedToken: string | null;
  
  // Actions
  startGame: (playerNames: string[]) => void;
  rollDice: () => void;
  selectToken: (tokenId: string) => void;
  makeMove: (move: { tokenId: string; steps: number; dieIndex: number }) => void;
  executeTurn: (moves: Array<{ tokenId: string; steps: number; dieIndex: number }>) => void;
  resetGame: () => void;
}

export const useGameState = (): UseGameStateReturn => {
  const [gameStateManager] = useState(() => new GameStateManager());
  const [actionHandler] = useState(() => new ActionHandler());
  const [rulesEngine] = useState(() => new RulesEngine());
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diceValues, setDiceValues] = useState<[number, number] | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [usedDice, setUsedDice] = useState<[boolean, boolean]>([false, false]);
  const [availableMoves, setAvailableMoves] = useState<Array<{ tokenId: string; steps: number; dieIndex: number }>>([]);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [pendingMoves, setPendingMoves] = useState<Array<{ tokenId: string; steps: number; dieIndex: number }>>([]);

  const currentPlayer = gameState?.players[gameState.currentPlayerIndex];

  const startGame = useCallback((playerNames: string[]) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const colors: Color[] = ['red', 'blue', 'green', 'yellow'];
      const players = playerNames.map((name, index) => ({
        id: `player-${index + 1}`,
        color: colors[index]
      }));
      
      const config: GameConfig = {
        diceMode: 'double',
        captureMode: 'finish',
        maxConsecutiveSixes: 3,
        safeStartingSquares: true,
        allowTokenStacking: false,
        enforceFullDiceUsage: true
      };
      
      const newGameState = gameStateManager.createGame(players, config);
      gameStateManager.startGame(newGameState);
      setGameState(newGameState);
      setDiceValues(null);
      setUsedDice([false, false]);
      setPendingMoves([]);
      setSelectedToken(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
    } finally {
      setIsLoading(false);
    }
  }, [gameStateManager]);

  const rollDice = useCallback(async () => {
    if (!gameState || isRolling || diceValues) return;
    
    try {
      setIsRolling(true);
      setError(null);
      
      // Simulate dice rolling animation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const dice1 = Math.floor(Math.random() * 6) + 1;
      const dice2 = Math.floor(Math.random() * 6) + 1;
      const newDiceValues: [number, number] = [dice1, dice2];
      
      setDiceValues(newDiceValues);
      setUsedDice([false, false]);
      
      // Calculate available moves
      const currentPlayerId = gameState.players[gameState.currentPlayerIndex].id;
      const allCombinations = rulesEngine.getAllValidMoveCombinations(
        gameState, 
        currentPlayerId, 
        newDiceValues
      );
      
      // Flatten all possible moves
      const allMoves = allCombinations.flat();
      setAvailableMoves(allMoves);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to roll dice');
    } finally {
      setIsRolling(false);
    }
  }, [gameState, isRolling, diceValues, rulesEngine]);

  const selectToken = useCallback((tokenId: string) => {
    if (!gameState || !diceValues) return;
    
    setSelectedToken(tokenId === selectedToken ? null : tokenId);
  }, [gameState, diceValues, selectedToken]);

  const makeMove = useCallback((move: { tokenId: string; steps: number; dieIndex: number }) => {
    if (!gameState || !diceValues) return;
    
    try {
      // Add move to pending moves
      const newPendingMoves = [...pendingMoves, move];
      setPendingMoves(newPendingMoves);
      
      // Mark die as used
      const newUsedDice: [boolean, boolean] = [...usedDice];
      newUsedDice[move.dieIndex] = true;
      setUsedDice(newUsedDice);
      
      // Update available moves
      const remainingMoves = availableMoves.filter(m => 
        m.tokenId !== move.tokenId || m.dieIndex !== move.dieIndex
      );
      setAvailableMoves(remainingMoves);
      
      setSelectedToken(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to make move');
    }
  }, [gameState, diceValues, pendingMoves, usedDice, availableMoves]);

  const executeTurn = useCallback((moves: Array<{ tokenId: string; steps: number; dieIndex: number }>) => {
    if (!gameState || !diceValues) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const currentPlayerId = gameState.players[gameState.currentPlayerIndex].id;
      const turnMove: TurnMove = {
        playerId: currentPlayerId,
        diceValues,
        moves
      };
      
      // Validate the turn
      const isValid = rulesEngine.validateTurnMove(gameState, turnMove);
      if (!isValid) {
        throw new Error('Invalid turn move');
      }
      
      // Execute the turn
      const result = actionHandler.executeTurnMove(gameState, turnMove);
      
      // Update game state - need to handle the void return and extra turn logic
      const hasDouble = diceValues[0] === diceValues[1];
      gameStateManager.nextTurn(gameState, hasDouble);
      gameStateManager.checkGameEnd(gameState);
      
      // Force re-render by creating new state reference
      setGameState({ ...gameState });
      
      // Reset turn state
      setDiceValues(null);
      setUsedDice([false, false]);
      setPendingMoves([]);
      setAvailableMoves([]);
      setSelectedToken(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute turn');
    } finally {
      setIsLoading(false);
    }
  }, [gameState, diceValues, rulesEngine, actionHandler, gameStateManager]);

  const resetGame = useCallback(() => {
    setGameState(null);
    setDiceValues(null);
    setUsedDice([false, false]);
    setPendingMoves([]);
    setAvailableMoves([]);
    setSelectedToken(null);
    setError(null);
  }, []);

  // Auto-execute turn when all dice are used
  useEffect(() => {
    if (usedDice[0] && usedDice[1] && pendingMoves.length > 0) {
      executeTurn(pendingMoves);
    }
  }, [usedDice, pendingMoves, executeTurn]);

  return {
    gameState,
    currentPlayer,
    isLoading,
    error,
    diceValues,
    isRolling,
    usedDice,
    availableMoves,
    selectedToken,
    
    startGame,
    rollDice,
    selectToken,
    makeMove,
    executeTurn,
    resetGame
  };
};
