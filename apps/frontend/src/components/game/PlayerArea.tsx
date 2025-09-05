import React from 'react';
import { Color } from '@ludo-square/game-engine';
import { motion } from 'framer-motion';
import { GameToken } from './GameBoard';
import { Crown, Users } from 'lucide-react';

interface PlayerAreaProps {
  playerId: string;
  color: Color;
  name: string;
  isActive?: boolean;
  isWinner?: boolean;
  homeTokens: Array<{
    id: string;
    color: Color;
    position: number;
    state: 'home' | 'in-play' | 'home-column' | 'finished';
  }>;
  finishedTokens: number;
  onTokenClick?: (tokenId: string) => void;
  score?: number;
}

export const PlayerArea: React.FC<PlayerAreaProps> = ({
  playerId,
  color,
  name,
  isActive = false,
  isWinner = false,
  homeTokens,
  finishedTokens,
  onTokenClick,
  score = 0
}) => {
  const getColorName = (color: Color) => {
    return color.charAt(0).toUpperCase() + color.slice(1);
  };

  const getPlayerAreaClasses = () => {
    let classes = `player-area ${color}`;
    if (isActive) classes += ' active';
    return classes;
  };

  const renderHomeTokens = () => {
    const homeGrid = Array.from({ length: 4 }, (_, index) => {
      const token = homeTokens[index];
      
      return (
        <div
          key={index}
          className={`w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center ${
            token ? 'bg-gray-50' : 'bg-gray-100'
          }`}
        >
          {token && (
            <GameToken
              {...token}
              onClick={() => onTokenClick?.(token.id)}
            />
          )}
        </div>
      );
    });

    return (
      <div className="grid grid-cols-2 gap-2">
        {homeGrid}
      </div>
    );
  };

  const renderFinishedTokens = () => {
    if (finishedTokens === 0) return null;

    return (
      <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">Finished</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: finishedTokens }, (_, index) => (
            <div
              key={index}
              className={`w-6 h-6 rounded-full bg-${color} border-2 border-white shadow-sm`}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      className={getPlayerAreaClasses()}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Player Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full bg-${color} border-2 border-white shadow-md`} />
          <div>
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              {name}
              {isWinner && <Crown className="w-4 h-4 text-yellow-500" />}
            </h3>
            <p className="text-sm text-gray-600">{getColorName(color)} Player</p>
          </div>
        </div>
        
        {isActive && (
          <motion.div
            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            Your Turn
          </motion.div>
        )}
      </div>

      {/* Home Area */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Home ({homeTokens.length}/4)
        </h4>
        {renderHomeTokens()}
      </div>

      {/* Finished Tokens */}
      {renderFinishedTokens()}

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Finished:</span>
            <span className="ml-2 font-semibold">{finishedTokens}/4</span>
          </div>
          <div>
            <span className="text-gray-600">Score:</span>
            <span className="ml-2 font-semibold">{score}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface PlayersAreaProps {
  players: Array<{
    id: string;
    color: Color;
    name: string;
    tokens: Array<{
      id: string;
      color: Color;
      position: number;
      state: 'home' | 'in-play' | 'home-column' | 'finished';
    }>;
  }>;
  currentPlayerId?: string;
  winnerId?: string;
  onTokenClick?: (tokenId: string) => void;
}

export const PlayersArea: React.FC<PlayersAreaProps> = ({
  players,
  currentPlayerId,
  winnerId,
  onTokenClick
}) => {
  return (
    <div className="space-y-4">
      {players.map((player) => {
        const homeTokens = player.tokens.filter(token => token.state === 'home');
        const finishedTokens = player.tokens.filter(token => token.state === 'finished').length;
        
        return (
          <PlayerArea
            key={player.id}
            playerId={player.id}
            color={player.color}
            name={player.name}
            isActive={player.id === currentPlayerId}
            isWinner={player.id === winnerId}
            homeTokens={homeTokens}
            finishedTokens={finishedTokens}
            onTokenClick={onTokenClick}
            score={finishedTokens * 10} // Simple scoring system
          />
        );
      })}
    </div>
  );
};
