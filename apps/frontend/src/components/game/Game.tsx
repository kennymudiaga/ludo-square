import React, { useState } from 'react';
import { GameBoard } from './GameBoard';
import { PlayersArea } from './PlayerArea';
import { DicePair } from './Dice';
import { useGameState } from '../../hooks/useGameState';
import { Color } from '@ludo-square/game-engine';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Settings } from 'lucide-react';

interface GameProps {
  onExit?: () => void;
}

export const Game: React.FC<GameProps> = ({ onExit }) => {
  const {
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
    resetGame
  } = useGameState();

  const [showSettings, setShowSettings] = useState(false);

  // Convert tokens for the board
  const boardTokens = gameState ? 
    gameState.players.flatMap(player => 
      player.tokens
        .filter(token => token.state === 'in-play')
        .map(token => ({
          id: token.id,
          color: player.color,
          position: token.position,
          state: token.state,
          isSelectable: availableMoves.some(move => move.tokenId === token.id),
          isSelected: selectedToken === token.id,
          onClick: () => selectToken(token.id)
        }))
    ).reduce((acc, token) => {
      acc[token.id] = token;
      return acc;
    }, {} as Record<string, any>) : {};

  const handleTokenClick = (tokenId: string) => {
    if (!diceValues || usedDice[0] && usedDice[1]) return;
    
    // Find available moves for this token
    const tokenMoves = availableMoves.filter(move => move.tokenId === tokenId);
    
    if (tokenMoves.length === 1) {
      // Auto-move if only one option
      makeMove(tokenMoves[0]);
    } else if (tokenMoves.length > 1) {
      // Select token and let user choose die
      selectToken(tokenId);
    }
  };

  const handleDieMove = (dieIndex: number) => {
    if (!selectedToken || !diceValues || usedDice[dieIndex]) return;
    
    const move = availableMoves.find(m => 
      m.tokenId === selectedToken && m.dieIndex === dieIndex
    );
    
    if (move) {
      makeMove(move);
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
            Ludo Square
          </h1>
          
          <div className="space-y-4">
            <button
              onClick={() => startGame(['Player 1', 'Player 2'])}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              <Play className="w-5 h-5" />
              Start 2-Player Game
            </button>
            
            <button
              onClick={() => startGame(['Player 1', 'Player 2', 'Player 3', 'Player 4'])}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              <Play className="w-5 h-5" />
              Start 4-Player Game
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <Settings className="w-5 h-5" />
              Settings
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Ludo Square</h1>
          <div className="flex gap-3">
            <button
              onClick={resetGame}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              New Game
            </button>
            {onExit && (
              <button
                onClick={onExit}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Exit
              </button>
            )}
          </div>
        </div>

        {/* Game Status */}
        {gameState.status === 'finished' && gameState.winner && (
          <motion.div
            className="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-lg font-medium text-yellow-800">
                  🎉 Game Over! Player {gameState.winner} wins!
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 rounded-lg"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <p className="text-red-700">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Game Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Players Area */}
          <div className="lg:col-span-1">
            <PlayersArea
              players={gameState.players.map(player => ({
                id: player.id,
                color: player.color,
                name: `Player ${player.color}`,
                tokens: player.tokens.map(token => ({
                  ...token,
                  color: player.color
                }))
              }))}
              currentPlayerId={currentPlayer?.id}
              winnerId={gameState.winner}
              onTokenClick={handleTokenClick}
            />
          </div>

          {/* Game Board */}
          <div className="lg:col-span-2 flex justify-center">
            <GameBoard
              tokens={boardTokens}
              onTokenClick={handleTokenClick}
            />
          </div>

          {/* Dice and Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Current Player Info */}
            {currentPlayer && (
              <div className="bg-white rounded-xl shadow-lg p-4">
                <h3 className="text-lg font-semibold mb-2">Current Turn</h3>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full bg-${currentPlayer.color}`} />
                  <span className="font-medium">Player {currentPlayer.color}</span>
                </div>
              </div>
            )}

            {/* Dice Area */}
            <DicePair
              values={diceValues}
              isRolling={isRolling}
              onRoll={rollDice}
              disabled={isLoading || gameState.status === 'finished'}
              usedDice={usedDice}
              canRoll={!diceValues && gameState.status === 'in-progress'}
            />

            {/* Move Selection */}
            {selectedToken && diceValues && (
              <div className="bg-white rounded-xl shadow-lg p-4">
                <h4 className="font-semibold mb-3">Choose Die</h4>
                <div className="space-y-2">
                  {diceValues.map((value, index) => (
                    <button
                      key={index}
                      onClick={() => handleDieMove(index)}
                      disabled={usedDice[index]}
                      className={`w-full p-3 rounded-lg border-2 transition-colors ${
                        usedDice[index]
                          ? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-800'
                      }`}
                    >
                      Use die {index + 1}: {value}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Available Moves Info */}
            {availableMoves.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-4">
                <h4 className="font-semibold mb-2">Available Moves</h4>
                <p className="text-sm text-gray-600">
                  {availableMoves.length} move{availableMoves.length !== 1 ? 's' : ''} available
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
