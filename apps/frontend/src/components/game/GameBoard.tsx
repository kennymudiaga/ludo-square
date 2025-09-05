import React from 'react';
import { Color } from '@ludo-square/game-engine';

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
  const getColorStyle = () => {
    const baseStyle = {
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      border: '2px solid white',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      cursor: 'pointer',
      transition: 'all 0.2s',
      position: 'relative' as const
    };
    
    let backgroundColor = '';
    switch (color) {
      case 'red': backgroundColor = '#ef4444'; break;
      case 'blue': backgroundColor = '#3b82f6'; break;
      case 'green': backgroundColor = '#10b981'; break;
      case 'yellow': backgroundColor = '#f59e0b'; break;
    }
    
    const selectableStyle = isSelectable ? {
      outline: '2px solid #fbbf24',
      outlineOffset: '1px',
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
    } : {};
    
    const selectedStyle = isSelected ? {
      outline: '4px solid white'
    } : {};
    
    return { ...baseStyle, backgroundColor, ...selectableStyle, ...selectedStyle };
  };

  return (
    <div
      style={getColorStyle()}
      onClick={onClick}
      title={`${color} token ${id}`}
    >
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        backgroundColor: 'white',
        opacity: 0.2
      }} />
    </div>
  );
};

interface GameBoardProps {
  tokens: Record<string, GameTokenProps>;
  onTokenClick?: (tokenId: string) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ tokens, onTokenClick }) => {
  
  // Function to check if a square is in the central 3x3 finish area
  const isFinishArea = (row: number, col: number): boolean => {
    return row >= 6 && row <= 8 && col >= 6 && col <= 8;
  };

  // Function to check if a square is in a player's 6x6 home area
  const getPlayerArea = (row: number, col: number): string | null => {
    // Red player area (top-left corner): rows 0-5, cols 0-5
    if (row >= 0 && row <= 5 && col >= 0 && col <= 5) return 'red';
    
    // Blue player area (top-right corner): rows 0-5, cols 9-14
    if (row >= 0 && row <= 5 && col >= 9 && col <= 14) return 'blue';
    
    // Green player area (bottom-left corner): rows 9-14, cols 0-5
    if (row >= 9 && row <= 14 && col >= 0 && col <= 5) return 'green';
    
    // Yellow player area (bottom-right corner): rows 9-14, cols 9-14
    if (row >= 9 && row <= 14 && col >= 9 && col <= 14) return 'yellow';
    
    return null;
  };

  // Function to check if a square is on the perimeter (border) of a player area
  const isPlayerAreaPerimeter = (row: number, col: number, playerArea: string): boolean => {
    if (!playerArea) return false;

    switch (playerArea) {
      case 'red': // rows 0-5, cols 0-5
        return (row === 0 || row === 5 || col === 0 || col === 5) &&
               (row >= 0 && row <= 5 && col >= 0 && col <= 5);
      case 'blue': // rows 0-5, cols 9-14
        return (row === 0 || row === 5 || col === 9 || col === 14) &&
               (row >= 0 && row <= 5 && col >= 9 && col <= 14);
      case 'green': // rows 9-14, cols 0-5
        return (row === 9 || row === 14 || col === 0 || col === 5) &&
               (row >= 9 && row <= 14 && col >= 0 && col <= 5);
      case 'yellow': // rows 9-14, cols 9-14
        return (row === 9 || row === 14 || col === 9 || col === 14) &&
               (row >= 9 && row <= 14 && col >= 9 && col <= 14);
      default:
        return false;
    }
  };

  // Function to get player area colors
  const getPlayerAreaStyle = (playerColor: string) => {
    switch (playerColor) {
      case 'red':
        return {
          backgroundColor: '#fef2f2', // Light red background
          border: '1px solid #ef4444', // Red border
          color: '#991b1b' // Dark red text
        };
      case 'blue':
        return {
          backgroundColor: '#eff6ff', // Light blue background
          border: '1px solid #3b82f6', // Blue border
          color: '#1e3a8a' // Dark blue text
        };
      case 'green':
        return {
          backgroundColor: '#f0fdf4', // Light green background
          border: '1px solid #10b981', // Green border
          color: '#14532d' // Dark green text
        };
      case 'yellow':
        return {
          backgroundColor: '#fffbeb', // Light yellow background
          border: '1px solid #f59e0b', // Yellow border
          color: '#92400e' // Dark yellow text
        };
      default:
        return {
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          color: '#6b7280'
        };
    }
  };
  
  return (
    <div style={{
      padding: '24px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      maxWidth: '600px',
      width: '100%',
      margin: '0 auto'
    }}>
      <h3 style={{
        fontSize: '20px',
        fontWeight: 'bold',
        marginBottom: '16px',
        textAlign: 'center'
      }}>
        Ludo Board: Home Areas & Finish Zone
      </h3>
      
      {/* 15x15 Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(15, 1fr)',
        gridTemplateRows: 'repeat(15, 1fr)',
        gap: '1px',
        aspectRatio: '1',
        border: '2px solid #374151',
        borderRadius: '8px',
        padding: '4px',
        backgroundColor: '#f3f4f6'
      }}>
        
        {/* Generate 15x15 = 225 squares */}
        {Array.from({ length: 225 }, (_, index) => {
          const row = Math.floor(index / 15);
          const col = index % 15;
          const isFinish = isFinishArea(row, col);
          const playerArea = getPlayerArea(row, col);
          const isPerimeter = playerArea ? isPlayerAreaPerimeter(row, col, playerArea) : false;
          
          // Determine styling based on area type
          let squareStyle;
          let displayContent;
          let titleText;
          
          if (isFinish) {
            // Finish area styling
            squareStyle = {
              backgroundColor: '#e9d5ff', // Soft lavender purple
              border: '1px solid #8b5cf6', // Purple border
              color: '#5b21b6', // Deep purple text
              fontWeight: 'bold'
            };
            displayContent = '🏁';
            titleText = `Finish Area: Row ${row}, Col ${col}`;
          } else if (playerArea && isPerimeter) {
            // Player area perimeter styling (colored border)
            squareStyle = {
              ...getPlayerAreaStyle(playerArea),
              fontWeight: 'bold'
            };
            displayContent = playerArea === 'red' ? '🔴' : 
                           playerArea === 'blue' ? '🔵' : 
                           playerArea === 'green' ? '🟢' : '🟡';
            titleText = `${playerArea.charAt(0).toUpperCase() + playerArea.slice(1)} Home Border: Row ${row}, Col ${col}`;
          } else if (playerArea && !isPerimeter) {
            // Player area inner squares (uncolored)
            squareStyle = {
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              color: '#6b7280',
              fontWeight: 'normal'
            };
            displayContent = `${row},${col}`;
            titleText = `${playerArea.charAt(0).toUpperCase() + playerArea.slice(1)} Home Interior: Row ${row}, Col ${col}`;
          } else {
            // Regular board square styling
            squareStyle = {
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              color: '#6b7280',
              fontWeight: 'normal'
            };
            displayContent = `${row},${col}`;
            titleText = `Row ${row}, Col ${col}`;
          }
          
          return (
            <div
              key={`${row}-${col}`}
              style={{
                ...squareStyle,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                minHeight: '20px'
              }}
              title={titleText}
            >
              {displayContent}
            </div>
          );
        })}
        
      </div>
      
      {/* Info */}
      <div style={{
        marginTop: '16px',
        textAlign: 'center',
        fontSize: '14px',
        color: '#6b7280'
      }}>
        <p>15x15 Grid with Player Home Area Borders (6x6) & Central Finish Zone (3x3)</p>
        <p>🔴 Red Border | 🔵 Blue Border | 🟢 Green Border | 🟡 Yellow Border | 🏁 Finish Zone</p>
      </div>
    </div>
  );
};
