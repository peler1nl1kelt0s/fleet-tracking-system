import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });
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
