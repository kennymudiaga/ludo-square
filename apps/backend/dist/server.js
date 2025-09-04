"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Placeholder Express server
const express_1 = __importDefault(require("express"));
const game_engine_1 = require("@ludo-square/game-engine");
const app = (0, express_1.default)();
const port = 3001;
app.get('/', (req, res) => {
    res.send('Ludo Backend - Game engine loaded: ' + typeof game_engine_1.GameStateManager);
});
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
