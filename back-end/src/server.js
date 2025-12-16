import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { initSocket } from './ws/socket.js';

const PORT = process.env.API_PORT || 3000;

const server = http.createServer(app);

initSocket(server);

server.listen(PORT, async () => {
  console.log(`🚀 Backend running on port ${PORT}`);

  await import('./mqtt/broker.js');
  await import('./mqtt/mqttClient.js');
  await import('./mqtt/openskyFetcher.js');

  const { startWorker } = await import('./worker/telemetryProcessor.js');
  startWorker();
});
