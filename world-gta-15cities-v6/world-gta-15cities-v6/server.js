const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(__dirname));

const players = new Map();
const worldState = {
  timeMinutes: 14 * 60,
  isNight: false,
  isRaining: false
};

wss.on('connection', (ws) => {
  const id = 'P_' + Math.random().toString(36).substring(2, 8).toUpperCase();
  players.set(id, { id, x: 0, y: 2.2, z: 0, yaw: 0, mode: 'walk', city: 'Алматы', hp: 100 });

  ws.send(JSON.stringify({
    type: 'init',
    id,
    players: Array.from(players.values()),
    worldState
  }));

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'state' && players.has(id)) {
        Object.assign(players.get(id), data.state);
        const packet = JSON.stringify({ type: 'sync', players: Array.from(players.values()) });
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) client.send(packet);
        });
      } else if (data.type === 'world' && data.worldState) {
        Object.assign(worldState, data.worldState);
        const packet = JSON.stringify({ type: 'world', worldState });
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) client.send(packet);
        });
      } else if (data.type === 'chat') {
        const chatMsg = JSON.stringify({ type: 'chat', id, text: String(data.text || '').slice(0, 160) });
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) client.send(chatMsg);
        });
      }
    } catch (e) {}
  });

  ws.on('close', () => players.delete(id));
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Ортақ мультиплеер сервері қосылды: http://localhost:${PORT}`);
});
