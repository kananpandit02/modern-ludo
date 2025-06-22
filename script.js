const { db, ref, set, onValue } = window.firebaseInfo;

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

// Board setup
for (let i = 0; i < 250; i++) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  cell.id = 'cell-' + i;
  board.appendChild(cell);
}

// Init game
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

// Game sync
onValue(roomRef, (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  document.getElementById('diceResult').innerText = data.dice ?? '-';
  document.getElementById('currentTurn').innerText = data.turn ?? '-';
  if (data.positions) renderAllTokens(data.positions);

  // Computer auto move
  if (vsComputer && player === 'player1' && data.turn === 'player2') {
    setTimeout(() => window.rollDice(), 1000);
  }
});

// Rendering tokens
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

// Roll dice function
window.rollDice = function () {
  onValue(roomRef, (snapshot) => {
    const data = snapshot.val();
    if (data.turn !== player && !(vsComputer && player === 'player1' && data.turn === 'player2')) return;

    const dice = Math.floor(Math.random() * 6) + 1;
    diceSound.play();

    const currentPlayer = data.turn;
    const color = colorMap[currentPlayer];
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
        turn: currentPlayer === 'player1' ? 'player2' : 'player1'
      });
      return;
    }

    if (vsComputer && currentPlayer === 'player2') {
      moveToken(movable[0].index, tokens, dice, data);
    } else if (movable.length === 1) {
      moveToken(movable[0].index, tokens, dice, data);
    } else {
      alert("Tap your token to move");
      document.querySelectorAll(`.token.${color}`).forEach((el, idx) => {
        el.style.cursor = 'pointer';
        el.onclick = () => {
          moveToken(idx, tokens, dice, data);
          el.onclick = null;
        };
      });
    }
  }, { onlyOnce: true });
};

// Token movement
function moveToken(index, tokens, dice, data) {
  const currentPlayer = data.turn;
  const color = colorMap[currentPlayer];

  if (tokens[index] === -1 && dice === 6) tokens[index] = 0;
  else if (tokens[index] >= 0 && tokens[index] <= 51) {
    tokens[index] = tokens[index] + dice <= 51 ? tokens[index] + dice : 52 + (tokens[index] + dice - 52);
  } else if (tokens[index] >= 52 && tokens[index] + dice <= 57) {
    tokens[index] += dice;
  }

  moveSound.play();

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
    turn: (dice === 6 && !allHome) ? currentPlayer : (currentPlayer === 'player1' ? 'player2' : 'player1'),
    positions: {
      ...data.positions,
      [color]: tokens
    }
  });
}
