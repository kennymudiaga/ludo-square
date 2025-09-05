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

  // Function to determine which token slot (1-4) a position represents in a player's home area
  const getTokenSlotNumber = (row: number, col: number, playerArea: string): number | null => {
    if (!playerArea || isPlayerAreaPerimeter(row, col, playerArea)) return null;

    // Calculate relative position within the inner 4x4 area of each 6x6 home zone
    let relativeRow: number, relativeCol: number;

    switch (playerArea) {
      case 'red': // inner area: rows 1-4, cols 1-4
        relativeRow = row - 1;
        relativeCol = col - 1;
        break;
      case 'blue': // inner area: rows 1-4, cols 10-13  
        relativeRow = row - 1;
        relativeCol = col - 10;
        break;
      case 'green': // inner area: rows 10-13, cols 1-4
        relativeRow = row - 10;
        relativeCol = col - 1;
        break;
      case 'yellow': // inner area: rows 10-13, cols 10-13
        relativeRow = row - 10;
        relativeCol = col - 10;
        break;
      default:
        return null;
    }

    // Check if position is within the inner 4x4 area
    if (relativeRow < 0 || relativeRow > 3 || relativeCol < 0 || relativeCol > 3) return null;

    // Map 4x4 inner area to 4 token slots (each 2x2):
    // Slot 1: top-left (0-1, 0-1)     Slot 2: top-right (0-1, 2-3)
    // Slot 3: bottom-left (2-3, 0-1)  Slot 4: bottom-right (2-3, 2-3)
    const slotRow = Math.floor(relativeRow / 2); // 0 or 1
    const slotCol = Math.floor(relativeCol / 2); // 0 or 1
    
    return slotRow * 2 + slotCol + 1; // Convert to slot number 1-4
  };

  // Function to check if a position is the center of a token slot (for token display)
  const isTokenSlotCenter = (row: number, col: number, playerArea: string): boolean => {
    if (!playerArea || isPlayerAreaPerimeter(row, col, playerArea)) return false;

    let relativeRow: number, relativeCol: number;

    switch (playerArea) {
      case 'red':
        relativeRow = row - 1;
        relativeCol = col - 1;
        break;
      case 'blue':
        relativeRow = row - 1;
        relativeCol = col - 10;
        break;
      case 'green':
        relativeRow = row - 10;
        relativeCol = col - 1;
        break;
      case 'yellow':
        relativeRow = row - 10;
        relativeCol = col - 10;
        break;
      default:
        return false;
    }

    // Check if position is within the inner 4x4 area
    if (relativeRow < 0 || relativeRow > 3 || relativeCol < 0 || relativeCol > 3) return false;

    // Better centered token positions within each 2x2 slot:
    // Slot 1 (top-left): center at (0.5, 0.5) -> use (1, 1) 
    // Slot 2 (top-right): center at (0.5, 2.5) -> use (1, 2)
    // Slot 3 (bottom-left): center at (2.5, 0.5) -> use (2, 1)
    // Slot 4 (bottom-right): center at (2.5, 2.5) -> use (2, 2)
    
    // More centered positions within the 4x4 grid
    return (relativeRow === 1 || relativeRow === 2) && (relativeCol === 1 || relativeCol === 2);
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
        Ludo Board: Token Home Areas & Finish Zone
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
            // Player area inner squares - show token slots
            const tokenSlot = getTokenSlotNumber(row, col, playerArea);
            const isSlotCenter = isTokenSlotCenter(row, col, playerArea);
            
            if (isSlotCenter && tokenSlot) {
              // Token slot center - show token placeholder
              squareStyle = {
                backgroundColor: '#f9fafb',
                border: '2px dashed #d1d5db',
                color: '#374151',
                fontWeight: 'bold'
              };
              
              // Create a sample token for demonstration
              const playerColors = { red: '#ef4444', blue: '#3b82f6', green: '#10b981', yellow: '#f59e0b' };
              const tokenColor = playerColors[playerArea as keyof typeof playerColors];
              
              displayContent = (
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: tokenColor,
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  margin: 'auto'
                }} />
              );
              titleText = `${playerArea.charAt(0).toUpperCase() + playerArea.slice(1)} Token Slot ${tokenSlot}: Row ${row}, Col ${col}`;
            } else {
              // Regular inner square
              squareStyle = {
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                color: '#9ca3af',
                fontWeight: 'normal',
                fontSize: '6px'
              };
              displayContent = tokenSlot ? `S${tokenSlot}` : `${row},${col}`;
              titleText = tokenSlot 
                ? `${playerArea.charAt(0).toUpperCase() + playerArea.slice(1)} Token Slot ${tokenSlot} Area: Row ${row}, Col ${col}`
                : `${playerArea.charAt(0).toUpperCase() + playerArea.slice(1)} Home Interior: Row ${row}, Col ${col}`;
            }
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
        <p>15x15 Ludo Board with Token Home Areas & Finish Zone</p>
        <p>🔴 Red | 🔵 Blue | 🟢 Green | 🟡 Yellow | 🏁 Finish Zone</p>
        <p style={{ fontSize: '12px', marginTop: '8px' }}>
          Each player's 6x6 home area contains 4 token slots (2x2 each) where tokens start the game
        </p>
      </div>
    </div>
  );
};
