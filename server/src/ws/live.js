import { WebSocket, WebSocketServer } from 'ws';

let wss = null;
let heartbeat = null;

export function attachLiveWebSocket(server) {
  if (wss) return wss;

  wss = new WebSocketServer({ server, path: '/ws/live' });

  wss.on('connection', (socket) => {
    socket.isAlive = true;

    socket.on('pong', () => {
      socket.isAlive = true;
    });

    socket.on('message', (raw) => {
      try {
        const message = JSON.parse(raw.toString());
        if (message?.type === 'ping') {
          socket.send(
            JSON.stringify({
              type: 'pong',
              data: { timestamp: new Date().toISOString() },
              timestamp: new Date().toISOString(),
            }),
          );
        }
      } catch {
        // Ignore malformed client messages.
      }
    });

    socket.send(
      JSON.stringify({
        type: 'welcome',
        data: { message: 'Connected to the RwandaScore live feed' },
        timestamp: new Date().toISOString(),
      }),
    );
  });

  heartbeat = setInterval(() => {
    if (!wss) return;
    for (const socket of wss.clients) {
      if (socket.isAlive === false) {
        socket.terminate();
        continue;
      }
      socket.isAlive = false;
      socket.ping();
    }
  }, 30_000);
  heartbeat.unref?.();

  wss.on('close', () => {
    if (heartbeat) clearInterval(heartbeat);
    heartbeat = null;
  });

  return wss;
}

export function broadcast(type, data) {
  if (!wss) return;

  let message;
  try {
    message = JSON.stringify({
      type,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return;
  }

  for (const socket of wss.clients) {
    if (socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(message);
      } catch {
        try {
          socket.terminate();
        } catch {
          // A failed client socket must not fail the REST update that triggered the broadcast.
        }
      }
    }
  }
}

export function closeLiveWebSocket() {
  if (heartbeat) clearInterval(heartbeat);
  heartbeat = null;

  if (wss) {
    for (const socket of wss.clients) socket.terminate();
    wss.close();
    wss = null;
  }
}
