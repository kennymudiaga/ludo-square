// Placeholder Next.js page
import { GameStateManager } from '@ludo-square/game-engine';

export default function Home() {
  return (
    <div>
      <h1>Ludo Game</h1>
      <p>Game engine loaded: {typeof GameStateManager}</p>
    </div>
  );
}
