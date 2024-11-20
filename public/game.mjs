/**
 * ##########################################################
 *  Secure Real Time Multiplayer Game - 2024-11-20
 * ##########################################################
 */

import Player from './Player.mjs';
import Collectible from './Collectible.mjs';

const socket = io();
const canvas = document.getElementById('game-window');
const context = canvas.getContext('2d');

// Define play area
canvas.width = 640;
canvas.height = 480;
const baseX = 25;
const baseY = 70;
const maxOffsetX = 590;
const maxOffsetY = 385;
export { baseX, baseY, maxOffsetX, maxOffsetY };

// Player and coin instances
let player;
let coin;
const speed = 20;
const coin_radius = 6;
const player_radius = 18;
const max_coin_id = 1000000;

// Receiving 'new player' from server
socket.on('new player', (numPlayers, player_id, color, callback) => {
  const playerX = Math.floor(Math.random() * (maxOffsetX + 1)) + baseX;
  const playerY = Math.floor(Math.random() * (maxOffsetY + 1)) + baseY;
  player = new Player({x: playerX, y: playerY, score: 0, id: player_id, color: color});

  if (numPlayers == 0) {
    const coinX = Math.floor(Math.random() * (maxOffsetX + 1)) + baseX;
    const coinY = Math.floor(Math.random() * (maxOffsetY + 1)) + baseY;
    coin = new Collectible({x: coinX, y: coinY, value: 1, id: Math.floor(Math.random() * max_coin_id)});
    callback({
      player: player,
      coin: coin
    });

  } else {
    callback({
      player: player
    });
  }
});

// Receiving 'current state' from server
socket.on('current state', (gameState) => {
  const numPlayers = Object.keys(gameState['players']).length;
  let scores = [];

  // Save the coin instance
  coin = gameState['coin'];

  // Clear the current canvas
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the background and the coin
  drawBackground(context);
  drawCoin(context, gameState['coin']['x'], gameState['coin']['y']);

  // Draw all players in the game
  for (const id in gameState['players']) {
    drawPlayer(context, gameState['players'][id].x, gameState['players'][id].y, gameState['players'][id].color);
    scores.push(gameState['players'][id].score);
  }

  // Add control, title, and rank on top
  drawTexts(context, player.calculateRank(scores), numPlayers);
});

document.addEventListener('keydown', (e) => {
  let direction = '';  
  switch(e.code) {
    case 'KeyW':
    case 'ArrowUp':
      direction = 'Up';
      break;
    case 'KeyS':
    case 'ArrowDown':
      direction = 'Down';
      break;
    case 'KeyA':
    case 'ArrowLeft':
      direction = 'Left';
      break;
    case 'KeyD':
    case 'ArrowRight':
      direction = 'Right';
      break;
    default:
      direction = 'Up';
  }

  // If the player moved
  if (player.movePlayer(direction, speed)) {
    // Check collision between the player and the coin
    // Collision happened
    if (player.collision(coin)) {
      player.score += coin.value;
      const coinX = Math.floor(Math.random() * (maxOffsetX + 1)) + baseX;
      const coinY = Math.floor(Math.random() * (maxOffsetY + 1)) + baseY;
      coin = new Collectible({x: coinX, y: coinY, value: 1, id: Math.floor(Math.random() * max_coin_id)});
      // Update the server
      socket.emit('player moved', {'player': player, 'coin': coin});

    // Collision didn't happen
    } else {
      // Update the server
      socket.emit('player moved', {'player': player});
    }
  }
});

function drawBackground(context) {
  // Draw game box
  context.fillStyle = "black";
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Draw inner rectangular line
  context.strokeStyle = "gray";
  context.lineWidth = 3;
  context.rect(5, 50, canvas.width - 10, canvas.height - 55);
  context.stroke();
}

function drawCoin(context, x, y) {
  context.beginPath();
  context.arc(x, y, coin_radius, 0, Math.PI * 2);
  context.fillStyle = "gray";
  context.fill();
}

function drawPlayer(context, x, y, color) {
  // Draw circle
  context.beginPath();
  context.arc(x, y, player_radius, 0, Math.PI * 2);
  context.fillStyle = color;
  context.fill();

  // Draw face
  context.strokeStyle = "black";
  context.lineWidth = 2;
  context.beginPath();

  // Left eye
  context.moveTo(x - 5, y - 2);
  context.lineTo(x - 5, y + 4);

  // Right eye
  context.moveTo(x + 5, y - 2);
  context.lineTo(x + 5, y + 4);

  // Mouth
  context.moveTo(x - 4, y + 9);
  context.lineTo(x + 4, y + 9);

  context.stroke();
  context.closePath();

  // Draw cheeks
  const radius = 2.5

  // Left cheek
  context.beginPath();
  context.arc(x - 10, y + 6, radius, 0, Math.PI * 2);
  context.fillStyle = "red";
  context.fill();

  // Right cheek
  context.beginPath();
  context.arc(x + 10, y + 6, radius, 0, Math.PI * 2);
  context.fillStyle = "red";
  context.fill();

  // These are added to remove extra circle near the face
  context.beginPath();
  context.closePath();
}

function drawTexts(context, rank, numPlayers) {
  context.fillStyle = "white";

  // Add controls
  context.font = "bold 20px Helvetica";
  context.fillText("Controls: WASD", 8, 35);

  // Add title
  context.font = "bold 28px Helvetica";
  context.fillText("Coin Race", 250, 35);

  // Add rank
  context.font = "bold 20px Helvetica";
  context.fillText(`Rank:  ${rank}  /  ${numPlayers}`, 512, 35);
}

