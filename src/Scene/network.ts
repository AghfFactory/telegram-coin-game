export type JoinMessage = {
  type: 'join';
  room: string;
  playerId: string;
};

export type FlipMessage = {
  type: 'flip';
  room: string;
  playerId: string;
  result: 'heads' | 'tails';
};

export function connectToServer(
  room: string,
  playerId: string,
  onReady: (socket: WebSocket, yourTurn: boolean) => void,
  onOffline: () => void
) {
  try {
    const socket = new WebSocket('wss://your-server.com'); // Replace this

    socket.onopen = () => {
      const join: JoinMessage = { type: 'join', room, playerId };
      socket.send(JSON.stringify(join));
    };

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'start') {
        const yourTurn = msg.yourTurn;
        onReady(socket, yourTurn);
      }
    };

    socket.onerror = () => {
      onOffline();
    };

    socket.onclose = () => {
      onOffline();
    };
  } catch (e) {
    onOffline();
  }
}
