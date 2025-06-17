# 🎮 Two-Player Coin Flip Game (Phaser + Telegram + WebSocket)

This document describes how the `CoinFlipScene.ts` script operates to enable a two-player Telegram coin flip game using Phaser and WebSocket communication.

---

## 🎮 1. Game Initialization (Phaser)

### ▶️ `preload()`
Loads the assets for the coin:
```ts
this.load.image('coin-heads', '/head.png');
this.load.image('coin-tails', '/tail.png');
```

---

### ▶️ `create()`
- Renders a **Flip Coin** button and a placeholder for result text.
- Calls:
  - `initTelegram()` to load Telegram user data
  - `connectToServer()` to join a game session via WebSocket

---

## 👥 2. Telegram User Identification

```ts
const tg = (window as any).Telegram?.WebApp;
const user = tg?.initDataUnsafe?.user;
this.playerId = user?.id?.toString() || crypto.randomUUID();
```

- Retrieves the Telegram user's `id` to use as their player identity.
- Falls back to a randomly generated ID if not in Telegram.
- Also extracts a `roomId` from the query string (e.g., `?room=abc123`).

---

## 🌍 3. WebSocket Server Connection

```ts
this.socket = new WebSocket('wss://your-server.com');
```

- Upon connection, sends a `join` message containing:
  - the `roomId`
  - the player's `playerId`

### Example outgoing message:
```json
{ "type": "join", "room": "abc123", "playerId": "123456789" }
```

---

## 🔁 4. Game State Coordination

### ▶️ Game Start
When both players have joined, the server sends:
```json
{ "type": "start", "yourTurn": true }
```

This is processed as:
```ts
if (msg.type === 'start') {
  this.isMyTurn = msg.yourTurn;
  this.resultText.setText(this.isMyTurn ? 'Your turn!' : 'Opponent\'s turn...');
}
```

---

## 🪙 5. Handling Coin Flips

### ▶️ When a player flips the coin:
```ts
this.socket.send(JSON.stringify({
  type: 'flip',
  room: this.roomId,
  playerId: this.playerId,
  result
}));
```

The server broadcasts:
```json
{
  "type": "flipResult",
  "result": "heads",
  "flipper": "123456789"
}
```

Handled by:
```ts
if (msg.type === 'flipResult') {
  this.animateCoin(msg.result);
  this.resultText.setText(`${msg.flipper === this.playerId ? 'You' : 'Opponent'} flipped: ${msg.result.toUpperCase()}`);
  this.isMyTurn = msg.flipper !== this.playerId;
}
```

---

## 🎞️ 6. Coin Animation Logic

### ▶️ `animateCoin(result: 'heads' | 'tails')`
- Plays a spinning animation.
- Changes the texture mid-animation to show the result.
- Updates the UI and enables the next turn.

---

## 📋 Responsibilities Summary

| Component | Purpose |
|----------|---------|
| `initTelegram()` | Gets player identity from Telegram |
| `connectToServer()` | Establishes multiplayer session |
| `onFlip()` | Sends flip results to the server |
| `animateCoin()` | Displays visual feedback |
| WebSocket Server | Synchronizes players and state |

---

## 🔜 What’s Next?

You can request:
- A complete WebSocket backend (`server.ts`)
- Telegram Web App setup instructions for publishing and testing
- Firebase/Supabase-based implementation if preferred
