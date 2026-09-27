import { db } from "./firebase.js";
import { ref, set, get, onValue, update, onDisconnect, remove } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";

// --------------------- DOM Elements ---------------------
const landing = document.getElementById('landingPage');
const gamePage = document.getElementById('gamePage');
const playerNameInput = document.getElementById('playerName');
const createRoomBtn = document.getElementById('createRoomBtn');
const playAiBtn = document.getElementById('playAiBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const roomInput = document.getElementById('roomInput');
const statusMsg = document.getElementById('statusMsg');

const boxes = document.querySelectorAll('.box');
const turnIndicator = document.getElementById('turnIndicator');
const roomInfo = document.getElementById('roomInfo');
const leaveBtn = document.getElementById('leaveBtn');
const resetBtn = document.getElementById('resetBtn');
const winnerBanner = document.getElementById('winnerBanner');
const gameStatus = document.getElementById('gameStatus'); 
const roomUtilityRow = document.getElementById('roomUtilityRow');
const alertContainer = document.getElementById('alertContainer');
const joinNotification = document.getElementById('joinNotification');

const profileLeft = document.getElementById('profileLeft');
const profileRight = document.getElementById('profileRight');
const leftNameDisplay = document.getElementById('leftNameDisplay');
const rightNameDisplay = document.getElementById('rightNameDisplay');
const avatarSymbolLeft = document.getElementById('avatarSymbolLeft');
const avatarSymbolRight = document.getElementById('avatarSymbolRight');
const statusDotLeft = document.getElementById('statusDotLeft');
const statusDotRight = document.getElementById('statusDotRight');
const emojiBubbleLeft = document.getElementById('emojiBubbleLeft');
const emojiBubbleRight = document.getElementById('emojiBubbleRight');

const leftScoreEl = document.getElementById('leftScore');
const rightScoreEl = document.getElementById('rightScore');
const drawsScoreEl = document.getElementById('drawsScore');

const copyCodeBtn = document.getElementById('copyCodeBtn');
const shareLinkBtn = document.getElementById('shareLinkBtn');
const winningLine = document.getElementById('winningLine');

// --------------------- System States ---------------------
let playerName = "";
let roomId = "";
let mySymbol = ""; // Host = 'O', Joiner = 'X'
let isAiMode = false;
let audioCtx = null;
let roomStateListener = null;
let welcomeBannerTriggered = false;

const winPatterns = [
  { p: [0,1,2], style: { width: "100%", height: "6px", top: "16.5%", left: "0", transform: "none" } },
  { p: [3,4,5], style: { width: "100%", height: "6px", top: "50%", left: "0", transform: "none" } },
  { p: [6,7,8], style: { width: "100%", height: "6px", top: "83.5%", left: "0", transform: "none" } },
  { p: [0,3,6], style: { width: "6px", height: "100%", top: "0", left: "16.5%", transform: "none" } },
  { p: [1,4,7], style: { width: "6px", height: "100%", top: "0", left: "50%", transform: "none" } },
  { p: [2,5,8], style: { width: "6px", height: "100%", top: "0", left: "83.5%", transform: "none" } },
  { p: [0,4,8], style: { width: "135%", height: "6px", top: "0", left: "0", transform: "rotate(45deg)" } },
  { p: [2,4,6], style: { width: "135%", height: "6px", top: "100%", left: "0", transform: "rotate(-45deg)" } }
];

// --------------------- Web Audio Synthesizer ---------------------
function triggerTone(action) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.connect(gainNode); gainNode.connect(audioCtx.destination);

  if (action === 'click') {
    osc.frequency.setValueAtTime(450, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.08);
    osc.start(); osc.stop(audioCtx.currentTime + 0.08);
  } else if (action === 'victory') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    osc.frequency.setValueAtTime(554, audioCtx.currentTime + 0.1);
    osc.frequency.setValueAtTime(659, audioCtx.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.35);
    osc.start(); osc.stop(audioCtx.currentTime + 0.35);
  } else if (action === 'tie') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
    osc.start(); osc.stop(audioCtx.currentTime + 0.2);
  }
}

// --------------------- In-Game Notifications ---------------------
function triggerFlashAlert(message) {
  alertContainer.innerText = message;
  alertContainer.classList.remove('hide');
  setTimeout(() => { alertContainer.classList.add('hide'); }, 3000);
}

function triggerJoinNotification(message) {
  joinNotification.innerText = message;
  joinNotification.classList.remove('hide');
  setTimeout(() => { joinNotification.classList.add('hide'); }, 4000);
}

function checkPlayerName() {
  playerName = playerNameInput.value.trim();
  if (!playerName) {
    statusMsg.innerText = "🚨 Please enter your name to start the game!";
    return false;
  }
  return true;
}

// --------------------- Presence Core Hook ---------------------
function setPresenceTracking() {
  if (isAiMode) {
    statusDotLeft.className = "status-dot online";
    statusDotRight.className = "status-dot online";
    return;
  }
  const myPath = `games/${roomId}/players/${mySymbol === 'O' ? 'p1' : 'p2'}/online`;
  set(ref(db, myPath), true);
  
  // Safe fail-safe trigger: Mark offline if the window drops out completely
  onDisconnect(ref(db, myPath)).set(false);
}

window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const sharedRoom = urlParams.get('room');
  if (sharedRoom) {
    roomInput.value = sharedRoom;
    statusMsg.innerText = "Shared Link Detected! Enter your name and click Join Room.";
  }
});

function openGameUI() {
  landing.classList.add('hide');
  gamePage.classList.remove('hide');
  winningLine.classList.add('hide');
  welcomeBannerTriggered = false;

  if (isAiMode) {
    roomUtilityRow.classList.add('hide');
  } else {
    roomUtilityRow.classList.remove('hide');
    roomInfo.innerText = `Room: ${roomId}`;
  }
  setPresenceTracking();
}

// --------------------- Subjective Screen Alignment Synchronization ---------------------
function listenRoom() {
  if (isAiMode) return;
  const roomRef = ref(db, `games/${roomId}`);

  roomStateListener = onValue(roomRef, snapshot => {
    const data = snapshot.val();
    if (!data) return;

    const turn = data.turn;
    const winner = data.winner;
    const p1 = data.players.p1;
    const p2 = data.players.p2;

    // CHECK DISCONNECTION REAL-TIME STATE FIRST
    if (p1 && !p1.online && p2) {
      handleAbruptDisconnect(p1.name);
      return;
    }
    if (p2 && !p2.online) {
      handleAbruptDisconnect(p2.name);
      return;
    }

    // Subjective Assignment Matrix: Left side ALWAYS displays "YOU"
    if (mySymbol === 'O') {
      leftNameDisplay.innerText = `${p1.name} (YOU)`;
      avatarSymbolLeft.innerText = "⭕";
      statusDotLeft.className = p1.online ? "status-dot online" : "status-dot disconnected";
      leftScoreEl.innerText = data.scores?.p1 || 0;

      rightNameDisplay.innerText = p2 ? p2.name : "Waiting...";
      avatarSymbolRight.innerText = "❌";
      statusDotRight.className = (p2 && p2.online) ? "status-dot online" : "status-dot disconnected";
      rightScoreEl.innerText = data.scores?.p2 || 0;
    } else {
      leftNameDisplay.innerText = `${p2 ? p2.name : 'Player'} (YOU)`;
      avatarSymbolLeft.innerText = "❌";
      statusDotLeft.className = (p2 && p2.online) ? "status-dot online" : "status-dot disconnected";
      leftScoreEl.innerText = data.scores?.p2 || 0;

      rightNameDisplay.innerText = p1.name;
      avatarSymbolRight.innerText = "⭕";
      statusDotRight.className = p1.online ? "status-dot online" : "status-dot disconnected";
      rightScoreEl.innerText = data.scores?.p1 || 0;
    }

    drawsScoreEl.innerText = data.scores?.draws || 0;
    gameStatus.innerText = !p2 ? "Waiting for opponent to connect..." : "Match in progress!";

    // Highlight the subjective processing node turn indicator states
    if (turn === mySymbol) {
      profileLeft.classList.add('active-turn');
      profileRight.classList.remove('active-turn');
    } else {
      profileRight.classList.add('active-turn');
      profileLeft.classList.remove('active-turn');
    }

    const board = data.board;
    boxes.forEach((b, i) => {
      const pastText = b.innerText;
      b.innerText = board[i] || '';
      if (pastText !== b.innerText && b.innerText !== "") triggerTone('click');
      b.disabled = !p2 || board[i] !== "" || turn !== mySymbol || winner;
    });

    if (!winner && p2) {
      turnIndicator.innerText = (turn === mySymbol) ? "Turn: Your Turn 🌟" : "Turn: Opponent's Turn";
    } else {
      turnIndicator.innerText = "Turn: Match Over";
      profileLeft.classList.remove('active-turn');
      profileRight.classList.remove('active-turn');
    }

    if (p2 && !welcomeBannerTriggered) {
      triggerJoinNotification(`🎉 ${p2.name} Joined the game!`);
      welcomeBannerTriggered = true;
    }

    if (data.lastEmoji && data.lastEmoji.sender !== mySymbol) {
      renderProfileBubble(data.lastEmoji.emoji, 'opponent');
      update(roomRef, { lastEmoji: null });
    }

    if (winner) {
      resetBtn.classList.remove('hide');
      if (winner === "Draw") {
        winnerBanner.innerText = "It's a Draw! 👔";
        winnerBanner.classList.remove('hide');
        triggerTone('tie');
      } else {
        const currentUserStr = (mySymbol === 'O' ? p1.name : p2.name);
        winnerBanner.innerText = (winner === currentUserStr) ? "You Won! 🏆" : `${winner} Wins! 👑`;
        winnerBanner.classList.remove('hide');
        renderWinStrike(board);
      }
    } else {
      winnerBanner.classList.add('hide');
      winningLine.classList.add('hide');
      resetBtn.classList.add('hide');
    }
  });
}

function handleAbruptDisconnect(name) {
  gameStatus.innerText = `Game Discontinued: ${name} left the match.`;
  turnIndicator.innerText = "Room Expired";
  winnerBanner.classList.add('hide');
  
  // Set accurate presentation parameters on UI
  if (mySymbol === 'O') {
    statusDotRight.className = "status-dot disconnected";
  } else {
    statusDotRight.className = "status-dot disconnected";
  }

  boxes.forEach(b => b.disabled = true);
  profileLeft.classList.remove('active-turn');
  profileRight.classList.remove('active-turn');
  
  if (roomStateListener) roomStateListener(); // Detach the live event loop safely
}

// --------------------- Winner Calculation Algorithms ---------------------
function checkGameMatrix(board) {
  for (let node of winPatterns) {
    const [a, b, c] = node.p;
    if (board[a] && board[a] === board[b] && board[b] === board[c]) return { sym: board[a], node };
  }
  if (board.every(c => c !== "")) return { sym: "Draw", node: null };
  return null;
}

function renderWinStrike(board) {
  const result = checkGameMatrix(board);
  if (result && result.node) {
    const coords = result.node.style;
    winningLine.style.width = coords.width;
    winningLine.style.height = coords.height;
    winningLine.style.top = coords.top;
    winningLine.style.left = coords.left;
    winningLine.style.transform = coords.transform;
    winningLine.classList.remove('hide');
    triggerTone('victory');
  }
}

// --------------------- Navigation Click Triggers ---------------------
createRoomBtn.addEventListener('click', async () => {
  if (!checkPlayerName()) return;
  roomId = Math.random().toString(36).slice(2, 8).toUpperCase();
  mySymbol = "O";
  isAiMode = false;

  const randomFirstTurn = Math.random() < 0.5 ? "O" : "X";

  await set(ref(db, `games/${roomId}`), {
    players: { p1: { name: playerName, online: true }, p2: null },
    board: Array(9).fill(''),
    turn: randomFirstTurn,
    winner: "",
    scores: { p1: 0, p2: 0, draws: 0 }
  });

  openGameUI();
  listenRoom();
});

joinRoomBtn.addEventListener('click', async () => {
  if (!checkPlayerName()) return;
  roomId = roomInput.value.trim().toUpperCase();
  isAiMode = false;

  const targetRef = ref(db, `games/${roomId}`);
  const snapshot = await get(targetRef);
  if (!snapshot.exists()) { statusMsg.innerText = "Error: Room Code not found."; return; }
  if (snapshot.val().players.p2) { statusMsg.innerText = "Error: Room is full."; return; }

  mySymbol = "X";
  await update(targetRef, { "players/p2": { name: playerName, online: true } });
  openGameUI();
  listenRoom();
});

// --------------------- Standalone Offline Local AI Matrix Loop ---------------------
let botGrid = Array(9).fill('');
let botMetrics = { user: 0, bot: 0, ties: 0 };
let botWinner = "";
let localTurn = "O";

playAiBtn.addEventListener('click', () => {
  playerName = playerNameInput.value.trim() || "Guest User 👤";
  roomId = "LOCAL_BOT";
  mySymbol = "O";
  isAiMode = true;

  leftNameDisplay.innerText = `${playerName} (YOU)`;
  avatarSymbolLeft.innerText = "⭕";
  rightNameDisplay.innerText = "Robot AI 🤖";
  avatarSymbolRight.innerText = "❌";
  
  localTurn = Math.random() < 0.5 ? "O" : "X";

  openGameUI();
  triggerJoinNotification(`🤖 Robot AI joined the game! Match starting...`);
  
  setTimeout(() => {
    refreshLocalAiLayouts();
    if (localTurn === "X") {
      setTimeout(computeMinimaxDecision, 1200);
    }
  }, 1000);
});

function refreshLocalAiLayouts() {
  setPresenceTracking();
  leftScoreEl.innerText = botMetrics.user;
  rightScoreEl.innerText = botMetrics.bot;
  drawsScoreEl.innerText = botMetrics.ties;

  if (localTurn === "O") {
    profileLeft.classList.add('active-turn');
    profileRight.classList.remove('active-turn');
  } else {
    profileRight.classList.add('active-turn');
    profileLeft.classList.remove('active-turn');
  }

  boxes.forEach((b, i) => {
    b.innerText = botGrid[i];
    b.disabled = botGrid[i] !== "" || botWinner !== "" || localTurn !== "O";
  });

  if (botWinner) {
    resetBtn.classList.remove('hide');
    profileLeft.classList.remove('active-turn');
    profileRight.classList.remove('active-turn');
    if (botWinner === "Draw") {
      winnerBanner.innerText = "It's a Draw! 👔";
      triggerTone('tie');
    } else {
      winnerBanner.innerText = botWinner === "O" ? "You Won! 🏆" : "AI Wins! 👑";
      renderWinStrike(botGrid);
    }
    winnerBanner.classList.remove('hide');
    turnIndicator.innerText = "Turn: Match Over";
  } else {
    turnIndicator.innerText = localTurn === "O" ? "Turn: Your Turn 🌟" : "Turn: AI Thinking...";
    winnerBanner.classList.add('hide');
    winningLine.classList.add('hide');
    resetBtn.classList.add('hide');
  }
}

function computeMinimaxDecision() {
  if (botWinner) return;
  let alphaVal = -Infinity;
  let optimalCell;
  for (let i = 0; i < 9; i++) {
    if (botGrid[i] === '') {
      botGrid[i] = 'X';
      let branchScore = minimaxTreeEval(botGrid, 0, false);
      botGrid[i] = '';
      if (branchScore > alphaVal) { alphaVal = branchScore; optimalCell = i; }
    }
  }
  if (optimalCell !== undefined) {
    botGrid[optimalCell] = 'X';
    triggerTone('click');
    const status = checkGameMatrix(botGrid);
    if (status) {
      botWinner = status.sym;
      if (botWinner === "X") botMetrics.bot++;
      if (botWinner === "Draw") botMetrics.ties++;
    }
    localTurn = "O";
    refreshLocalAiLayouts();
  }
}

// Minimax scoring engine
function minimaxTreeEval(grid, depth, maximizeActive) {
  const evaluate = checkGameMatrix(grid);
  if (evaluate) {
    if (evaluate.sym === 'X') return 10 - depth;
    if (evaluate.sym === 'O') return depth - 10;
    if (evaluate.sym === 'Draw') return 0;
  }
  if (maximizeActive) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (grid[i] === '') {
        grid[i] = 'X';
        let res = minimaxTreeEval(grid, depth + 1, false);
        grid[i] = ''; best = Math.max(res, best);
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (grid[i] === '') {
        grid[i] = 'O';
        let res = minimaxTreeEval(grid, depth + 1, true);
        grid[i] = ''; best = Math.min(res, best);
      }
    }
    return best;
  }
}

// --------------------- Interactive Box Clicks ---------------------
boxes.forEach((b, i) => {
  b.addEventListener('click', async () => {
    if (isAiMode) {
      if (botGrid[i] !== "" || botWinner || localTurn !== "O") return;
      botGrid[i] = 'O';
      triggerTone('click');
      const step = checkGameMatrix(botGrid);
      if (step) {
        botWinner = step.sym;
        if (botWinner === "O") botMetrics.user++;
        if (botWinner === "Draw") botMetrics.ties++;
        refreshLocalAiLayouts();
      } else {
        localTurn = "X";
        refreshLocalAiLayouts();
        setTimeout(computeMinimaxDecision, 1200);
      }
      return;
    }

    const liveRef = ref(db, `games/${roomId}`);
    const snap = await get(liveRef);
    const data = snap.val();
    if (!data || data.winner || data.board[i] !== "" || data.turn !== mySymbol) return;

    const nextBoardState = [...data.board];
    nextBoardState[i] = mySymbol;
    const toggledTurn = mySymbol === "O" ? "X" : "O";

    let payload = { board: nextBoardState, turn: toggledTurn };
    const scanOutcome = checkGameMatrix(nextBoardState);

    if (scanOutcome) {
      if (scanOutcome.sym === "Draw") {
        payload.winner = "Draw";
        payload["scores/draws"] = (data.scores?.draws || 0) + 1;
      } else {
        const champString = scanOutcome.sym === "O" ? data.players.p1.name : data.players.p2.name;
        payload.winner = champString;
        if (scanOutcome.sym === "O") payload["scores/p1"] = (data.scores?.p1 || 0) + 1;
        else payload["scores/p2"] = (data.scores?.p2 || 0) + 1;
      }
    }
    await update(liveRef, payload);
  });
});

resetBtn.addEventListener('click', async () => {
  if (isAiMode) {
    botGrid = Array(9).fill('');
    botWinner = "";
    localTurn = Math.random() < 0.5 ? "O" : "X";
    refreshLocalAiLayouts();
    if (localTurn === "X") setTimeout(computeMinimaxDecision, 1200);
    return;
  }
  const randomFirstTurn = Math.random() < 0.5 ? "O" : "X";
  await update(ref(db, `games/${roomId}`), {
    board: Array(9).fill(''),
    turn: randomFirstTurn,
    winner: ""
  });
});

// --------------------- Copy Share Hooks ---------------------
copyCodeBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(roomId);
  triggerFlashAlert("Code copied to game panel! 📋");
});

shareLinkBtn.addEventListener('click', () => {
  const calculatedLink = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
  navigator.clipboard.writeText(calculatedLink);
  triggerFlashAlert("Invite Link copied to game panel! 🔗");
});

// --------------------- Interactive Emoji Systems ---------------------
document.querySelectorAll('.emoji-trigger').forEach(node => {
  node.addEventListener('click', async () => {
    const asset = node.getAttribute('data-emoji');
    renderProfileBubble(asset, 'me');
    if (!isAiMode) {
      await update(ref(db, `games/${roomId}`), {
        lastEmoji: { emoji: asset, sender: mySymbol }
      });
    }
  });
});

function renderProfileBubble(emoji, targetWhom) {
  const targetBubble = (targetWhom === 'me') ? emojiBubbleLeft : emojiBubbleRight;
  targetBubble.innerText = emoji;
  targetBubble.classList.remove('hide');
  
  const oldTimeout = targetBubble.dataset.timeoutId;
  if (oldTimeout) clearTimeout(parseInt(oldTimeout));

  const timeoutId = setTimeout(() => { targetBubble.classList.add('hide'); }, 1200);
  targetBubble.dataset.timeoutId = timeoutId.toString();
}

// --------------------- Safe Leave / Destroy Logic ---------------------
leaveBtn.addEventListener('click', async () => {
  if (!isAiMode && roomId) {
    if (roomStateListener) roomStateListener(); // Detach live listener
    
    const roomRef = ref(db, `games/${roomId}`);
    const snap = await get(roomRef);
    
    if (snap.exists()) {
      const data = snap.val();
      const p1 = data.players?.p1;
      const p2 = data.players?.p2;
      
      // Determine if I am the absolute LAST person inside this room instance
      const isP1Leaving = (mySymbol === 'O');
      const isOpponentAlreadyOffline = isP1Leaving ? (!p2 || !p2.online) : (!p1 || !p1.online);
      
      if (isOpponentAlreadyOffline) {
        // Both players are gone now, clean up the data node completely
        await remove(roomRef);
      } else {
        // Opponent is still there, just mark ourselves offline so they receive the disconnect message
        const myOnlinePath = `games/${roomId}/players/${mySymbol === 'O' ? 'p1' : 'p2'}/online`;
        await set(ref(db, myOnlinePath), false);
      }
    }
  }
  location.reload();
});