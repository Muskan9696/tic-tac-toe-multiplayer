# 🎮 Tic-Tac-Toe Multiplayer

A responsive **online Tic-Tac-Toe game** built with **HTML, CSS, JavaScript, Firebase Realtime Database, and a Service Worker**.

The project supports real-time multiplayer rooms, shareable room links, player presence detection, emoji reactions, score tracking, sound effects, and a local AI opponent powered by the **Minimax algorithm**. It also includes basic **PWA** support for installable/offline-friendly UI behavior.

---

### 🌐Live link

[https://tic-tac-battle-ground.netlify.app/](https://tic-tac-battle-ground.netlify.app/)

## ✨ Features

### 🌐 Online Multiplayer
- Create a private game room with a randomly generated room code.
- Join an existing room using the room code.
- Real-time board synchronization using **Firebase Realtime Database**.
- Host is assigned **⭕ (O)**.
- Joining player is assigned **❌ (X)**.
- Both players see the same board and game state in real time.
- Turn synchronization prevents moves when it is not the player's turn.

### 🔗 Room Sharing
- Copy the room code directly from the game screen.
- Generate and copy a shareable room URL.
- Opening a shared URL automatically pre-fills the room code.
- Players can enter their name and join directly from the shared link.

### 🤖 Play Against AI
- Play locally against a computer opponent without creating a Firebase room.
- AI uses a **Minimax-based decision algorithm**.
- The AI plays as ❌ (X).
- The player plays as ⭕ (O).
- Includes separate AI-game win, loss, and draw counters.

### 🏆 Score Tracking
Online games track:
- Player 1 wins
- Player 2 wins
- Draws

Scores persist for the current Firebase room and can be used across multiple rounds with **Play Again**.

### 🟢 Player Presence
The multiplayer mode tracks whether players are online:
- Online/offline status indicators.
- Firebase `onDisconnect()` is used to mark a player offline when their connection/window drops.
- If a player leaves the match, the remaining player receives a game-discontinued state.

### 😂 Emoji Reactions
Players can send quick reactions during multiplayer games:

`😂` `😮` `👑` `👍` `💥`

Reactions appear as temporary animated bubbles beside the player's profile.

### 🔊 Sound Effects
The project uses the browser **Web Audio API** to generate sounds for:
- Moves
- Victories
- Draws

No external audio files are required for these effects.

### 📱 Responsive UI
The interface is designed for desktop and mobile screens with:
- Responsive 3×3 game board.
- Mobile-specific sizing.
- Player profile cards.
- Turn indicators.
- Winning-line animation.
- Animated notifications and emoji bubbles.

### 📦 PWA Support
The project includes:
- `manifest.json`
- `sw.js`
- PWA metadata
- 192×192 and 512×512 app icons
- Service worker registration

The service worker caches essential application files and uses a **network-first with cache fallback** strategy.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **HTML5** | Application structure and game UI |
| **CSS3** | Responsive styling, animations and layout |
| **JavaScript (ES Modules)** | Game logic, UI interactions and AI |
| **Firebase Realtime Database** | Real-time multiplayer synchronization |
| **Firebase JavaScript SDK** | Database connection and real-time listeners |
| **Web Audio API** | Client-side game sound effects |
| **Service Worker** | Caching and offline fallback |
| **Web App Manifest** | PWA installation metadata |
| **Minimax Algorithm** | Local Tic-Tac-Toe AI |
| **VS Code / Live Server** | Local development |

---

## 📁 Project Structure

```text
Multiplayer TicTacToe/
│
├── index.html
├── style.css
├── app.js
├── firebase.js
├── manifest.json
├── sw.js
│
├── images/
│   ├── favicon.ico
│   ├── icon-192.png
│   └── icon-512.png
│
└── .vscode/
    └── settings.json
```

### File Overview

#### `index.html`
Contains the main application interface:
- Player name input
- Create Room
- Join Room
- Play vs AI
- Multiplayer game board
- Player profiles
- Score display
- Emoji tray
- Room sharing controls
- Game status and winner messages

#### `style.css`
Contains the complete visual design:
- Responsive layout
- Game board
- Player cards
- Status indicators
- Animations
- Winning line
- Mobile breakpoints
- Buttons, notifications and emoji bubbles

#### `app.js`
Contains the main application logic:
- Room creation and joining
- Firebase synchronization
- Turn management
- Win/draw detection
- Score management
- Player presence
- Disconnect handling
- Room sharing
- Emoji reactions
- Web Audio sound generation
- Local AI
- Minimax algorithm
- Game reset and leave-room logic

#### `firebase.js`
Initializes the Firebase application and exports the Realtime Database instance.

#### `manifest.json`
Defines the PWA metadata, including:
- Application name
- Short name
- Start URL
- Standalone display mode
- Theme/background colors
- Application icons

#### `sw.js`
Registers the service worker and:
- Caches essential application files during installation.
- Uses network-first loading.
- Falls back to cached resources when network requests fail.

---

# 🎮 How to Play

## Multiplayer Mode

### 1. Enter Your Name

Enter a player name on the landing page.

### 2. Create a Room

Click:

```text
Create Room
```

The application generates a random room code.

The room creator becomes:

```text
⭕ O
```

### 3. Share the Room

Use:

```text
📋 Copy
```

to copy the room code, or:

```text
🔗 Share
```

to copy the complete room URL.

Send the code/link to another player.

### 4. Join the Room

The second player enters the room code and clicks:

```text
Join Room
```

The joining player becomes:

```text
❌ X
```

### 5. Play

The game synchronizes the board through Firebase in real time.

Players can:
- Make moves when it is their turn.
- View the opponent's moves.
- See online/offline status.
- Send emoji reactions.
- Track wins and draws.

### 6. Play Again

After a game finishes, click:

```text
Play Again 🔄
```

to start another round in the same room.

---

# 🤖 AI Mode

Select:

```text
Play vs AI 🤖
```

This mode does not create a Firebase multiplayer room.

The game runs locally in the browser.

### AI implementation

The AI uses the **Minimax algorithm** to evaluate possible game states and choose a move.

The scoring logic considers:
- AI wins
- Player wins
- Draws
- Search depth

This allows the AI to evaluate future moves instead of choosing randomly.

---

# 🧠 Game Logic

The game board is represented as an array containing nine positions:

```text
[0, 1, 2]
[3, 4, 5]
[6, 7, 8]
```

The application checks the following winning patterns:

```text
Rows:
[0,1,2]
[3,4,5]
[6,7,8]

Columns:
[0,3,6]
[1,4,7]
[2,5,8]

Diagonals:
[0,4,8]
[2,4,6]
```

When one of these combinations contains the same non-empty symbol, that player wins.

If all nine cells are filled without a winner, the result is a draw.

---

# 🔥 Firebase Architecture

The multiplayer state is stored under a room-specific path:

```text
games/
└── ROOM_ID/
    ├── players/
    │   ├── p1/
    │   │   ├── name
    │   │   └── online
    │   │
    │   └── p2/
    │       ├── name
    │       └── online
    │
    ├── board/
    ├── turn
    ├── winner
    ├── scores/
    │   ├── p1
    │   ├── p2
    │   └── draws
    │
    └── lastEmoji/
        ├── emoji
        └── sender
```

### Real-time synchronization

The application uses Firebase Realtime Database listeners to receive room updates.

A player's move updates the shared game state:

```text
Player
   ↓
Firebase Realtime Database
   ↓
Other player's listener
   ↓
Updated board/UI
```

This allows both players to see changes without refreshing the page.

---

# 🟢 Presence & Disconnect Handling

The application uses Firebase's `onDisconnect()` mechanism.

When a player connects, their presence is set to:

```text
online: true
```

The application also registers a disconnect handler:

```text
onDisconnect(...).set(false)
```

If the connection is unexpectedly lost, Firebase can mark the player as offline.

When the other player detects the offline state, the game is stopped and displays a room-expired/disconnected message.

---

# 🧹 Room Cleanup

When a player explicitly leaves:

1. The real-time listener is detached.
2. The current room is retrieved.
3. The application checks whether the opponent is still online.
4. If both players are gone, the entire room node is removed.
5. Otherwise, the leaving player's presence is marked offline.

This helps prevent abandoned room data from remaining indefinitely.

---

# 📲 Progressive Web App

The application includes PWA functionality.

### Manifest

`manifest.json` defines:

```json
{
  "display": "standalone",
  "orientation": "portrait"
}
```

and provides 192×192 and 512×512 application icons.

### Service Worker

`sw.js` currently caches:

```text
index.html
style.css
app.js
firebase.js
```

It uses:

```text
Network first
      ↓
If network fails
      ↓
Use cached resource
```

### Important limitation

The cached application shell does **not** make Firebase multiplayer available offline.

The local AI game can run without a multiplayer connection, but online multiplayer requires access to Firebase.

---

# 🚀 Getting Started

## Prerequisites

You need:

- A modern web browser
- A Firebase project with **Realtime Database**
- A local web server for development

A simple option is the **Live Server** extension in VS Code.

---

## 1. Clone the Repository

```bash
git clone https://github.com/Muskan9696/tic-tac-toe-multiplayer.git
cd tic-tac-toe-multiplayer
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## 2. Configure Firebase

Create a Firebase project and enable:

```text
Realtime Database
```

Then add your web application and obtain its Firebase configuration.

Update:

```text
firebase.js
```

with your project configuration.

Example structure:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

> **Security note:** Firebase web configuration values such as the API key are normally included in client-side applications. The important security control is your Firebase Authentication/Realtime Database Security Rules. Do not put private server credentials, service-account keys, or other secrets in the frontend.

---

## 3. Start the Application

Because ES modules, Firebase and service workers work best when served through HTTP, use a local web server instead of opening `index.html` directly.

### VS Code + Live Server

Open the project in VS Code and use:

```text
Right Click → Open with Live Server
```

The included VS Code settings use port:

```text
5501
```

You can then open:

```text
http://127.0.0.1:5501
```

or the URL displayed by Live Server.

---

# 🌐 Deployment

The project is a static frontend and can be deployed to services that support static websites.

Examples include:

- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting

Before deploying, make sure:

1. Firebase Realtime Database is configured.
2. Database security rules are appropriate.
3. `manifest.json` and `sw.js` are deployed.
4. The site is served over HTTPS in production.
5. Service-worker scope/path matches the deployed location.

---

# 🔐 Firebase Security

The application currently uses Firebase Realtime Database directly from the browser.

For a production deployment, configure database rules carefully.

Do **not** use unrestricted rules such as:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

Use Firebase Security Rules appropriate for your application's authentication and data model.

Also consider validating important game-state transitions on a trusted backend if the game is intended to be resistant to client-side manipulation.

---

# ⚙️ Browser APIs Used

The project uses several native browser APIs:

### Clipboard API

Used to copy:
- Room codes
- Shareable room URLs

### Web Audio API

Used to generate:
- Move sounds
- Victory sounds
- Draw sounds

### Service Worker API

Used for:
- Resource caching
- Offline fallback
- PWA support

### URLSearchParams

Used to read shared room links:

```text
?room=ROOM_CODE
```

---

# 📱 Responsive Design

The UI includes a mobile breakpoint at:

```css
@media(max-width: 480px)
```

Mobile-specific adjustments include:
- Smaller game cells
- Smaller player avatars
- Compact buttons
- Smaller emoji controls
- Reduced header spacing
- Compact score display

---

# 🎨 UI Highlights

The interface includes:

- Gradient background
- Card-based layout
- Player profile panels
- Online status indicators
- Active-turn highlighting
- Animated notifications
- Emoji reaction bubbles
- Winning-line visualization
- Responsive game board
- Hover effects
- Mobile layout optimization

---

# 📊 Core Game State

A multiplayer room contains the following major state:

| State | Purpose |
|---|---|
| `players.p1` | Host/player O information |
| `players.p2` | Joining/player X information |
| `board` | Current 9-cell board |
| `turn` | Current player's symbol |
| `winner` | Winner or draw state |
| `scores.p1` | Player 1 wins |
| `scores.p2` | Player 2 wins |
| `scores.draws` | Total draws |
| `lastEmoji` | Latest multiplayer emoji reaction |

---

# 🧩 Main Functions

Some of the major functions in `app.js` include:

| Function | Responsibility |
|---|---|
| `checkPlayerName()` | Validates player name |
| `setPresenceTracking()` | Tracks online presence |
| `openGameUI()` | Opens the game screen |
| `listenRoom()` | Listens for Firebase room updates |
| `handleAbruptDisconnect()` | Handles opponent disconnection |
| `checkGameMatrix()` | Detects wins and draws |
| `renderWinStrike()` | Displays winning line |
| `computeMinimaxDecision()` | Selects AI move |
| `minimaxTreeEval()` | Evaluates AI game states |
| `refreshLocalAiLayouts()` | Updates AI game UI |
| `renderProfileBubble()` | Displays emoji reaction |
| `triggerTone()` | Generates game sounds |

---

# 🏗️ Application Flow

## Multiplayer

```text
Enter Name
    ↓
Create / Join Room
    ↓
Firebase Room
    ↓
Assign O / X
    ↓
Real-time Board
    ↓
Player Move
    ↓
Validate Turn
    ↓
Update Firebase
    ↓
Opponent Receives Update
    ↓
Win / Draw
    ↓
Play Again
```

## AI

```text
Enter Name
    ↓
Play vs AI
    ↓
Local Game State
    ↓
Player Move
    ↓
Check Result
    ↓
Minimax AI
    ↓
AI Move
    ↓
Check Result
    ↓
Repeat
```

---

# 📌 Current Limitations

The current implementation has a few architectural limitations worth knowing:

- Multiplayer game state is controlled from the client.
- Strong anti-cheat validation is not implemented on a trusted backend.
- Multiplayer requires an active Firebase connection.
- The service worker only caches the listed application files.
- `manifest.json` and image assets are not currently included in `ASSETS_TO_CACHE`.
- There is no user authentication/account system.
- Room codes are randomly generated and do not use authenticated ownership.
- The project does not currently include automated tests.
- Game history is not stored separately from the active room state.

These can be addressed in future versions.

---

# 🚧 Future Improvements

Potential upgrades include:

- 🔐 Firebase Authentication
- 🛡️ Stronger Firebase Security Rules
- 🧑‍🤝‍🧑 Player profiles and accounts
- 🏅 Global leaderboard
- 📈 Match history
- 🕐 Rematch invitations
- 💬 In-game chat
- 🎨 Multiple board themes
- 🌙 Dark mode
- 🏆 Achievements
- 🔊 Sound controls
- 🔔 Browser notifications
- 📡 Improved offline/PWA caching
- 🧪 Automated unit and integration tests
- 🖥️ Spectator mode
- 🎮 Additional game modes
- ⚡ Server-side game validation

---

# 📄 License

This project can be used as a personal learning and portfolio project.

If you plan to distribute the project publicly, add a specific open-source license such as the MIT License according to your intended usage.

---

# 👨‍💻 Author

**Muskan Pandey**

GitHub: `https://github.com/Muskan9696`

---

## ⭐ Project Highlights

> A real-time browser-based Tic-Tac-Toe game combining **Firebase multiplayer synchronization**, **Minimax AI**, **player presence tracking**, **emoji reactions**, **Web Audio effects**, **responsive UI**, and **PWA functionality** in a lightweight vanilla JavaScript application.

If you found the project useful, consider giving the repository a ⭐ on GitHub.
