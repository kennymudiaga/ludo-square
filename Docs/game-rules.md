# Ludo Game Rules Specification

## Overview
Ludo is a strategy board game for 2-4 players, where each player races their four tokens from start to finish according to dice rolls. This specification follows the Nigerian Ludo style with configurable gameplay options.

## Game Configuration Options

### Dice Settings
- **Default (Nigerian Style)**: Two dice - roll sum for movement
- **Classic Mode**: Single die option available
- **Getting Out Rule**: Requires at least one 6 (regardless of single/double dice)

### Capture Settings
- **Default (Nigerian Style)**: Capturing token goes straight to finish line
- **Classic Mode**: Capturing token stays at capture square

### Safe Square Rules
- **Starting Squares**: Each color's starting square is a safe square
- **Additional Safe Squares**: Designated colored squares on the track

## Game Setup

### Board Layout
- **Main Track**: 52 squares forming a circular path
- **Home Areas**: 4 colored areas (Red, Blue, Green, Yellow) with 4 starting positions each
- **Home Columns**: 5 squares leading to the center (finish area) for each color
- **Safe Squares**: Starting squares + designated colored squares where tokens cannot be captured

### Players and Tokens
- **2-4 players**: Each player chooses a color (Red, Blue, Green, Yellow)
- **4 tokens per player**: All tokens start in their respective home area
- **Turn Order**: Clockwise starting with Red, then Blue, Green, Yellow

### Starting Positions (Safe Squares)
- **Red**: Square 1 (Red safe square)
- **Blue**: Square 14 (Blue safe square) 
- **Green**: Square 27 (Green safe square)
- **Yellow**: Square 40 (Yellow safe square)

## Game Rules

### Dice Rolling (Configurable)
- **Default (Two Dice)**: Roll two dice, use sum for movement (2-12 range)
- **Classic (Single Die)**: Roll one die for movement (1-6 range)
- **Extra Turn**: Rolling double 6s (two dice) or single 6 (one die) gives extra turn
- **Consecutive 6s Limit**: Maximum 3 consecutive extra turns to prevent exploitation

### Getting Tokens Out of Home
- **Requirement**: Must have at least one 6 in the dice roll
  - Two dice: At least one die shows 6 (e.g., 6+3, 6+6, 2+6)
  - Single die: Must roll exactly 6
- **Options with 6**: Player can either:
  - Move a new token out of home to the starting square, OR
  - Move an existing token on the board using the full dice value

### Basic Movement
1. **Dice Roll**: Player rolls dice according to game configuration
2. **Token Selection**: Player chooses which token to move (if multiple options available)
3. **Movement**: Token moves clockwise the number of squares equal to dice sum
4. **Mandatory Move**: If possible moves exist, player must make a move

### Special Rules

#### Capturing (Configurable)
- **When**: A token lands on a square occupied by an opponent's token
- **Default (Nigerian Style)**: 
  - Captured token returns to home
  - Capturing token immediately goes to finish line (wins the race)
- **Classic Mode**: 
  - Captured token returns to home
  - Capturing token stays at the capture square
  - Capturing player gets an extra turn
- **Safe Square Protection**: Tokens on safe squares cannot be captured

#### Safe Squares
- **Starting Squares**: Each color's starting square (1, 14, 27, 40) is safe
- **Additional Safe Squares**: 
  - Square 9 (Red safe)
  - Square 22 (Blue safe)
  - Square 35 (Green safe)
  - Square 48 (Yellow safe)
- **Protection**: Tokens on safe squares cannot be captured by opponents

#### Winning
- **Individual Token**: A token reaches the center finish area
- **Capture Victory**: A token captures an opponent and goes straight to finish (default mode)
- **Game Victory**: First player to get all 4 tokens to the finish area wins

### Detailed Movement Rules

#### Dice Rolling Mechanics
- **Two Dice (Default)**: 
  - Roll both dice, use sum for movement
  - Double 6s (6+6) grants extra turn
  - At least one 6 allows moving token out of home
- **Single Die (Classic)**: 
  - Roll 1-6, move that many squares
  - Rolling 6 grants extra turn and allows moving out of home
- **Consecutive Limits**: Maximum 3 consecutive extra turns

#### Valid Moves
1. **From Home**: Requires at least one 6, moves to starting square
2. **On Board**: Move forward the rolled number of squares (dice sum)
3. **Into Home Column**: Must complete full lap, then enter home stretch
4. **In Home Column**: Move toward center, must roll exact number to finish

#### Invalid Moves
- Moving a token that would land on own token (no stacking in MVP)
- Moving without meeting the "6 to get out" requirement
- Moving past the finish line (must land exactly in home column)

### Board Position Numbering
```
Squares 1-52 form the main circular track:

Safe squares (cannot be captured):
- Square 1 (Red starting square - SAFE)
- Square 9 (Red safe)
- Square 14 (Blue starting square - SAFE) 
- Square 22 (Blue safe)
- Square 27 (Green starting square - SAFE)
- Square 35 (Green safe)
- Square 40 (Yellow starting square - SAFE)
- Square 48 (Yellow safe)
```

### Game States
- **Waiting**: Game not started, waiting for players
- **In Progress**: Game is active, players taking turns
- **Finished**: One player has won

### Victory Conditions
- **Primary**: First player to move all 4 tokens to the finish area
- **Capture Victory**: Token captures opponent and goes to finish (configurable)
- **Secondary**: If game reaches maximum turns, player with most tokens finished wins

## Implementation Notes

### Simplified Rules for MVP
1. **No Stacking**: Each square holds maximum one token
2. **No Team Play**: Individual players only
3. **Configurable Dice**: Support both single and double dice modes
4. **Configurable Capture**: Support both "stay at square" and "go to finish" modes
5. **Safe Starting Squares**: All starting squares are safe zones
6. **Exact Finish**: Must roll exact number to reach finish in home column

### Game Configuration Object
```typescript
interface GameConfig {
  diceMode: 'single' | 'double';
  captureMode: 'stay' | 'finish';
  maxConsecutiveSixes: number;
  safeSStartingSquares: boolean;
}
```

### Future Enhancements
- Team play (2v2)
- Power-ups and special abilities  
- Different board layouts
- Custom dice rules and betting
- Tournament modes
- Voice chat integration

This specification provides the foundation for our Nigerian-style Ludo implementation with configurable classic mode support.
