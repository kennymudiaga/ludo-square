import React from 'react';
import { Color } from '@ludo-square/game-engine';
import { motion } from 'framer-motion';

interface GameTokenProps {
  id: string;
  color: Color;
  position: number;
  state: 'home' | 'in-play' | 'home-column' | 'finished';
  isSelectable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export const GameToken: React.FC<GameTokenProps> = ({
  id,
  color,
  position,
  state,
  isSelectable = false,
  isSelected = false,
  onClick
}) => {
  const getColorClasses = () => {
    const baseClasses = 'game-token';
    const colorClass = color;
    const selectableClass = isSelectable ? 'selectable' : '';
    const selectedClass = isSelected ? 'ring-4 ring-white' : '';
    
    return `${baseClasses} ${colorClass} ${selectableClass} ${selectedClass}`;
  };

  if (state === 'home') {
    return null; // Home tokens are rendered in player areas
  }

  return (
    <motion.div
      className={getColorClasses()}
      onClick={onClick}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      title={`${color} token ${id}`}
    >
      <div className="w-full h-full rounded-full bg-white opacity-20" />
    </motion.div>
  );
};

interface GameBoardSquareProps {
  position: number;
  tokens: GameTokenProps[];
  isStart?: boolean;
  isSafe?: boolean;
  color?: Color;
}

export const GameBoardSquare: React.FC<GameBoardSquareProps> = ({
  position,
  tokens,
  isStart = false,
  isSafe = false,
  color
}) => {
  const getSquareClasses = () => {
    let classes = 'game-board-square';
    
    if (isSafe) classes += ' safe';
    if (isStart && color) classes += ` start ${color}-start`;
    
    return classes;
  };

  const renderTokens = () => {
    if (tokens.length === 0) return null;
    
    if (tokens.length === 1) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <GameToken {...tokens[0]} />
        </div>
      );
    }
    
    // Multiple tokens - stack them
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {tokens.map((token, index) => (
            <div
              key={token.id}
              className="absolute"
              style={{
                left: `${index * 4}px`,
                top: `${index * 4}px`,
                zIndex: index
              }}
            >
              <GameToken {...token} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={getSquareClasses()}>
      {isStart && (
        <span className="text-xs font-bold z-10">
          {position + 1}
        </span>
      )}
      {renderTokens()}
    </div>
  );
};

interface GameBoardProps {
  tokens: Record<string, GameTokenProps>;
  onTokenClick?: (tokenId: string) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ tokens, onTokenClick }) => {
  const boardSize = 15; // 15x15 grid for Ludo board
  
  const getTokensAtPosition = (position: number): GameTokenProps[] => {
    return Object.values(tokens).filter(token => 
      token.position === position && token.state === 'in-play'
    );
  };

  const isStartSquare = (position: number): { isStart: boolean; color?: Color } => {
    const startPositions = {
      0: 'red' as Color,    // Red start
      13: 'blue' as Color,  // Blue start  
      26: 'green' as Color, // Green start
      39: 'yellow' as Color // Yellow start
    };
    
    return {
      isStart: position in startPositions,
      color: startPositions[position as keyof typeof startPositions]
    };
  };

  const isSafeSquare = (position: number): boolean => {
    // Safe squares are typically starting squares and some others
    return [0, 8, 13, 21, 26, 34, 39, 47].includes(position);
  };

  const renderBoardSquares = () => {
    const squares = [];
    
    // Create the main 52-square board path
    for (let position = 0; position < 52; position++) {
      const tokensAtPosition = getTokensAtPosition(position);
      const { isStart, color } = isStartSquare(position);
      const isSafe = isSafeSquare(position);
      
      squares.push(
        <GameBoardSquare
          key={position}
          position={position}
          tokens={tokensAtPosition.map(token => ({
            ...token,
            onClick: () => onTokenClick?.(token.id)
          }))}
          isStart={isStart}
          isSafe={isSafe}
          color={color}
        />
      );
    }
    
    return squares;
  };

  return (
    <div className="game-board bg-white p-8 rounded-2xl shadow-2xl">
      {/* Simplified board layout - we'll make this more sophisticated */}
      <div className="grid grid-cols-13 gap-1 max-w-2xl mx-auto">
        {renderBoardSquares()}
      </div>
      
      {/* Center area with game logo/info */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full w-32 h-32 flex items-center justify-center shadow-lg">
          <span className="text-2xl font-bold text-gray-800">LUDO</span>
        </div>
      </div>
    </div>
  );
};
