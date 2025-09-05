import React from 'react';
import { Game } from '../components/game/Game';

export default function Home() {
  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Ludo Square</h1>
        
        {/* Full game component with SimpleLudoBoard */}
        <Game />
      </div>
    </div>
  );
}
