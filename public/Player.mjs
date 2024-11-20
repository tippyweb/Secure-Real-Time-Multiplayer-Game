import { baseX, baseY, maxOffsetX, maxOffsetY } from './game.mjs';
const collision_dist = 12;

class Player {
  constructor({x, y, score, id, color}) {
    this.x = x;
    this.y = y;
    this.score = score;
    this.id = id;
    this.color = color;
//    this.collection = [];
  }

  movePlayer(dir, speed) {
    const x = this.x;
    const y = this.y;

    // Check with the game board limits
    switch(dir) {
      case 'Up':
        this.y = y - speed > baseY ? y - speed : baseY;
        break;
      case 'Down':
        this.y = y + speed < baseY + maxOffsetY ? y + speed : baseY + maxOffsetY;
        break;
      case 'Left':
        this.x = x - speed > baseX ? x - speed : baseX;
        break;
      case 'Right':
        this.x = x + speed < baseX + maxOffsetX ? x + speed : baseX + maxOffsetX;
        break;
      default:
        this.y = y - speed > baseY ? y - speed : baseY;
    }

    // If the player moved, return true
    return x != this.x || y != this.y;
  }

  collision(item) {
    const dist = Math.sqrt((this.x - item.x) ** 2 + (this.y - item.y) ** 2);

    // Collision happened
    if (dist < collision_dist) {
      return true;

    // Collision didn't happen
    } else {
      return false;
    }
  }

  calculateRank(arr) {
    // Sort the score array in descending order
    const scores = arr.sort(function(a, b){return b-a});
    return scores.indexOf(this.score) + 1;
  }
}

export default Player;
