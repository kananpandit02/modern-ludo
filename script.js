import { db, ref, set, onValue } from './firebase-config.js';

const roomCode = localStorage.getItem('roomCode');
const player = localStorage.getItem('player');
const vsComputer = localStorage.getItem('vsComputer') === 'true';

const colorMap = {
  player1: 'red',
  player2: 'green'
};
const safeCells = [0, 8, 13, 21, 26, 34, 39, 47];
const boardPath = Array.from({ length: 52 }, (_, i) => i);
const homePaths = {
  red: [200, 201, 202, 203, 204, 205],
  green: [210, 211, 212, 213, 214, 215]
};

const diceSound = new Audio('assets/sounds/dice.mp3');
const moveSound = new Audio('assets/sounds/move.mp3');
const killSound = new Audio('assets/sounds/kill.mp3');
const winSound = new Audio('assets/sounds/win.mp3');

document.getElementById('roomCodeDisplay').innerText = roomCode;
document.getElementById('playerRole').innerText = player;

const roomRef = ref(db, 'rooms/' + roomCode);
const board = document.getElementById('board');

for (let i = 0; i < 250; i++) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  cell.id = 'cell-' + i;
  board.appendChild(cell);
}

// Initialize game if player1
if (player === 'player1') {
  set(roomRef, {
    dice: "-",
    turn: "player1",
    positions: {
      red: [-1, -1, -1, -1],
      green: [-1, -1, -1, -1]
    }
  });
}

// Sync state
onValue(roomRef, (snapshot) => {
  const data = snapshot.val();
  if (!data) return;
  document.getElementById('diceResult').innerText = data.dice ?? '-';
  document.getElementById('currentTurn').innerText = data.turn ?? '-';
  if (data.positions) renderAllTokens(data.positions);

  // Let computer auto-play
  if (vsComputer && data.turn === 'player2') {
    setTimeout(() => {
      rollDice();
    }, 1000);
  }
});

// Render tokens
function renderAllTokens(positions) {
  document.querySelectorAll('.token').forEach(e => e.remove());
  Object.entries(positions).forEach(([color, tokens]) => {
    tokens.forEach((step, idx) => {
      if (step === -1) return;
      let cellId = -1;
      if (step >= 0 && step <= 51) cellId = boardPath[step];
      else if (step >= 52 && step <= 57) cellId = homePaths[color][step - 52];
      const cell = document.getElementById('cell-' + cellId);
      if (cell) {
        const token = document.createElement('div');
        token.className = `token ${color}`;
        token.style.top = `${5 + idx * 6}px`;
        token.style.left = `${5 + idx * 6}px`;
        token.title = `${color} #${idx + 1}`;
        cell.appendChild(token);
      }
    });
  });
}

// Roll Dice
window.rollDice = function () {
  onValue(roomRef, (snapshot) => {
    const data = snapshot.val();
    if (data.turn !== player) return;

    const dice = Math.floor(Math.random() * 6) + 1;
    diceSound.play();

    const color = colorMap[player];
    const tokens = data.positions[color];
    const movable = [];

    tok
