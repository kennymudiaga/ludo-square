// Basic test for types
import { Player, Token } from '../types';

describe('Game Engine Types', () => {
  it('should create a player', () => {
    const player: Player = {
      id: '1',
      color: 'red',
      tokens: [],
      status: 'waiting'
    };
    expect(player.id).toBe('1');
  });
});
