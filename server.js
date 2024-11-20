/**
 * ##########################################################
 *  Secure Real Time Multiplayer Game - 2024-11-20
 * ##########################################################
 */

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const socket = require('socket.io');
const cors = require('cors');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();

// Adding helmet module
const helmet = require('helmet');

app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.noCache());
app.use(helmet.hidePoweredBy({
  setTo: 'PHP 7.4.3'
}));

/*
app.use(helmet.frameguard({action: 'sameorigin'}));
app.use(helmet.dnsPrefetchControl({allow: false}));
app.use(helmet.referrerPolicy({policy: 'same-origin'}));
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'"]
  }
}));
*/

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//For FCC testing purposes and enables user to connect from outside the hosting platform
app.use(cors({origin: '*'})); 

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  }); 

//For FCC testing purposes
fccTestingRoutes(app);
    
// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const portNum = process.env.PORT || 3000;

// Set up server and tests
const server = app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});


// Initialize player array
let gameState = {
  'players': {},
  'coin': null
};

// Available colors for players
let colors = ['#c9a3ff', '#5eff7c', '#96fcff', '#e39802', '#ffffff', '#ffc9fa'];

// Socket setups
const io = socket(server);

// Add the connection event listener to the io object
io.on('connection', (socket) => {
  console.log('A new user connected: ', socket.id);

  // Emit new player to client
  socket.emit('new player', Object.keys(gameState['players']).length, socket.id, colors.pop(), (response) => {
    // Update gameState
    gameState['players'][response['player'].id] = response['player'];

    if (response.coin) {
      gameState['coin'] = response.coin;
    }

    // Broadcast updated gameState
    io.emit('current state', gameState);
  });

  // Update game state and broadcase it to all clients
  socket.on('player moved', function(arg) {
    gameState['players'][arg.player['id']] = arg.player;

    // If new coin object was created
    if (arg.coin) {
      gameState['coin'] = arg.coin;
    }

    // Broadcast updated gameState
    io.emit('current state', gameState);
  });

  // Handle socket disconnect event
  socket.on('disconnect', function() {
    console.log('User disconnected: ', socket.id);

    // Return the player's color to the beginning of the colors array
    colors.unshift(gameState['players'][socket.id].color);

    // Delete the player and broadcast the new state
    delete gameState['players'][socket.id];

    // Broadcast updated gameState
    io.emit('current state', gameState);

  });


});

module.exports = app; // For testing
