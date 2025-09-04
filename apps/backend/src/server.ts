// Placeholder Express server
import express from 'express';
import { GameStateManager } from '@ludo-square/game-engine';

const app = express();
const port = 3001;

app.get('/', (req, res) => {
  res.send('Ludo Backend - Game engine loaded: ' + typeof GameStateManager);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
