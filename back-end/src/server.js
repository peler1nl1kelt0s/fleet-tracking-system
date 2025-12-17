import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import express from 'express'; // Added explicit import if not already handled in app.js, but assuming app.js exports express app
import { getIO } from './ws/socket.js'; // Import getIO

// Global Error Handlers
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });
import app from './app.js';
import { initSocket } from './ws/socket.js';

const PORT = process.env.API_PORT || 3000;

// In-memory store for squawk codes (in a real app, use DB)
let squawkCodes = [
  { id: '7500', code: '7500', description: 'Unlawful Interference (Hijacking)', severity: 'critical', message: 'HIJACKING REPORTED', color: '#ff0000' },
  { id: '7600', code: '7600', description: 'Radio Failure', severity: 'warning', message: 'RADIO FAILURE', color: '#ffa500' },
  { id: '7700', code: '7700', description: 'General Emergency', severity: 'critical', message: 'EMERGENCY DECLARED', color: '#ff0000' }
];

try {
  const server = http.createServer(app);

  initSocket(server);

  // --- Admin API Routes ---
  // Ideally these should be in a router file, but placing here for task simplicity as requested
  
  // Announcements
  app.post('/api/admin/announcements', express.json(), (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });
    
    const io = getIO();
    const announcement = {
      message,
      timestamp: Date.now(),
      sender: 'ADMIN'
    };
    
    // Broadcast to all connected clients
    io.emit('announcement', announcement);
    console.log('[Admin] Announcement broadcasted:', message);
    
    res.json({ status: 'success', data: announcement });
  });

  // Squawk Codes
  app.get('/api/admin/squawk-codes', (req, res) => {
    // React Admin expects x-total-count for lists
    res.set('Access-Control-Expose-Headers', 'X-Total-Count');
    res.set('X-Total-Count', squawkCodes.length);
    res.json(squawkCodes);
  });

  app.get('/api/admin/squawk-codes/:id', (req, res) => {
    const code = squawkCodes.find(c => c.id === req.params.id);
    if (!code) return res.status(404).json({ error: 'Not found' });
    res.json(code);
  });

  app.post('/api/admin/squawk-codes', express.json(), (req, res) => {
    const newCode = { ...req.body, id: req.body.code }; // Use code as ID
    // Remove existing if exists to update
    squawkCodes = squawkCodes.filter(c => c.id !== newCode.id);
    squawkCodes.push(newCode);
    res.json(newCode);
  });
  
  app.put('/api/admin/squawk-codes/:id', express.json(), (req, res) => {
    const index = squawkCodes.findIndex(c => c.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Not found' });
    
    squawkCodes[index] = { ...squawkCodes[index], ...req.body };
    res.json(squawkCodes[index]);
  });

  app.delete('/api/admin/squawk-codes/:id', (req, res) => {
    squawkCodes = squawkCodes.filter(c => c.id !== req.params.id);
    res.json({ id: req.params.id });
  });

  server.listen(PORT, async () => {
    console.log(`🚀 Backend running on port ${PORT}`);

    try {
      await import('./mqtt/broker.js');
      await import('./mqtt/mqttClient.js');
      await import('./mqtt/openskyFetcher.js');

      const { startWorker } = await import('./worker/telemetryProcessor.js');
      startWorker();
    } catch (importErr) {
      console.error('Failed to start services:', importErr);
    }
  });
} catch (err) {
  console.error('Failed to create server:', err);
}
