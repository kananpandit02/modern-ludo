import { db, ref, set, onValue } from './firebase-config.js';

const roomCode = localStorage.getItem('roomCode');
const player = localStorage.getItem('player');
const colorMap = {
  player1: 'red',
  player2: 'green',
  player3: 'yellow',
  player4: 'blue',
  computer: 'blue'
};

const safeCells = [0, 8, 13, 21, 26, 34, 39, 47];

const boardPath = [
  5, 6, 7, 8, 9, 10,
  21, 32, 43, 54, 65, 76,
  75, 74, 73, 72, 71, 70,
  59, 48, 37, 26, 15, 4,
  3, 2, 1, 0, 11, 22,
  33, 44, 55, 66, 77, 88,
  87, 86, 85, 84, 83, 82,
  71, 60, 49, 38, 27, 16,
  17, 18, 19, 20, 30
];

const homePaths = {
  red: [200, 201, 202, 203, 204, 205],
  green: [210, 211, 212, 213, 214, 215],
  yellow: [220, 221, 222, 223, 224, 225],
  blue: [230, 231, 232, 233, 234, 235]
};

const diceSound = new Audio('assets/sounds/dice.mp3');
const moveSound = new Audio('assets/sounds/move.mp3');
const killSound = new Audio('assets/sounds/kill.mp3');
const winSound = new Audio('assets/sounds/win.mp3');

document.getElementById('roomCodeDisplay').innerText = roomCode;
document.getElementById('playerRole').innerText = player;

const roomRef = ref(db, 'rooms/' + roomCode);
const board = document.getElementById('board');

// Create 250 grid cells
for (let i = 0; i < 250; i++) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  cell.id = 'cell-' + i;
  board.appendChild(cell);
}

// Initialize game if first player
if (player === 'player1') {
  set(roomRef, {
    dice: "-",
    turn: "player1",
    positions: {
      red: [-1, -1, -1, -1],
      green: [-1, -1, -1, -1],
      yellow: [-1, -1, -1, -1],
      blue: [-1, -1, -1, -1]
    }
  });
}

// Real-time listener
onValue(roomRef, (snapshot) => {
  const data = snapshot.val();
  if (!data) return;
  document.getElementById('diceResult').innerText = data.dice ?? '-';
  document.getElementById('currentTurn').innerText = data.turn ?? '-';
  if (data.positions) renderAllTokens(data.positions);

  // If it's computer's turn
  if (data.turn === 'computer') {
    setTimeout(() => {
      simulateComputerTurn(data);
    }, 1000);
  }
});

// Render tokens on board
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

// Roll dice
window.rollDice = function () {
  onValue(roomRef, (snapshot) => {
    const data = snapshot.val();
    if (data.turn !== player) return;

    const dice = Math.floor(Math.random() * 6) + 1;
    diceSound.play();

    const color = colorMap[player];
    const tokens = data.positions[color];
    const movable = [];

    tokens.forEach((step, idx) => {
      if (step === -1 && dice === 6) movable.push({ index: idx, action: 'enter' });
      else if ((step >= 0 && step <= 51 && step + dice <= 51) || (step >= 52 && step + dice <= 57)) {
        movable.push({ index: idx, action: 'move' });
      } else if (step <= 51 && step + dice > 51) {
        movable.push({ index: idx, action: 'toHome' });
      }
    });

    if (movable.length === 0) {
      set(roomRef, {
        ...data,
        dice,
        turn: player === 'player1' ? 'computer' : 'player1'
      });
      return;
    }

    if (movable.length === 1) {
      moveToken(movable[0].index, tokens, dice, data);
    } else {
      alert("Tap your token to move");
      document.querySelectorAll('.token.' + color).forEach((el, idx) => {
        el.style.cursor = 'pointer';
        el.onclick = () => {
          moveToken(idx, tokens, dice, data);
          el.onclick = null;
        };
      });
    }
  }, { onlyOnce: true });
};

// Move token logic
function moveToken(index, tokens, dice, data) {
  const color = colorMap[player];
  if (tokens[index] === -1 && dice === 6) tokens[index] = 0;
  else if (tokens[index] >= 0 && tokens[index] <= 51) {
    tokens[index] = tokens[index] + dice <= 51 ? tokens[index] + dice : 52 + (tokens[index] + dice - 52);
  } else if (tokens[index] >= 52 && tokens[index] + dice <= 57) {
    tokens[index] += dice;
  }

  moveSound.play();

  // Check kill
  Object.entries(data.positions).forEach(([enemy, tks]) => {
    if (enemy === color) return;
    data.positions[enemy] = tks.map(p => {
      const match = (tokens[index] === p) && (p <= 51) && !safeCells.includes(boardPath[p]);
      if (match) {
        killSound.play();
        return -1;
      }
      return p;
    });
  });

  const allHome = tokens.every(t => t === 57);
  if (allHome) {
    winSound.play();
    alert(`${color.toUpperCase()} WINS! 🎉`);
  }

  set(roomRef, {
    ...data,
    dice,
    turn: (dice === 6 && !allHome) ? player : (player === 'player1' ? 'computer' : 'player1'),
    positions: {
      ...data.positions,
      [color]: tokens
    }
  });
}

// Computer AI
function simulateComputerTurn(data) {
  const color = colorMap['computer'];
  const tokens = data.positions[color];
  const dice = Math.floor(Math.random() * 6) + 1;

  const movable = [];
  tokens.forEach((step, idx) => {
    if (step === -1 && dice === 6) movable.push({ index: idx, action: 'enter' });
    else if ((step >= 0 && step <= 51 && step + dice <= 51) || (step >= 52 && step + dice <= 57)) {
      movable.push({ index: idx, action: 'move' });
    } else if (step <= 51 && step + dice > 51) {
      movable.push({ index: idx, action: 'toHome' });
    }
  });

  if (movable.length === 0) {
    set(roomRef, {
      ...data,
      dice,
      turn: 'player1'
    });
    return;
  }

  const choice = movable[Math.floor(Math.random() * movable.length)].index;
  moveToken(choice, tokens, dice, data);
}
