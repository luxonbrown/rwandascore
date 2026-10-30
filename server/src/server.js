import http from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { attachLiveWebSocket, closeLiveWebSocket } from './ws/live.js';
import { startLiveClockScheduler } from './services/match.service.js';

const app = createApp();
const server = http.createServer(app);
attachLiveWebSocket(server);
const stopLiveClockScheduler = startLiveClockScheduler();

server.listen(env.PORT, () => {
  console.log(`RwandaScore API listening on http://localhost:${env.PORT}`);
});

async function shutdown(signal) {
  console.log(`${signal} received; closing RwandaScore API`);
  closeLiveWebSocket();
  stopLiveClockScheduler();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
