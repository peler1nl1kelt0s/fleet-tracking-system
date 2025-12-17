import express from 'express';
import cors from 'cors';
import { getConfig, updateConfig } from './config/alertConfig.js';
import { getSystemConfig, updateSystemConfig, getChatConfig, updateChatConfig } from './config/configManager.js';
import { getIO } from './ws/socket.js';
import redis from './redis/redisClient.js';

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
  exposedHeaders: ['X-Total-Count']
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/alerts/config', (req, res) => {
  res.json(getConfig());
});

app.post('/api/alerts/config', (req, res) => {
  try {
    const newConfig = updateConfig(req.body);
    res.json(newConfig);
  } catch (error) {
    res.status(500).json({ message: 'Yapılandırma güncellenirken bir hata oluştu.', error: error.message });
  }
});

// Admin API Routes
app.get('/api/admin/system-config', (req, res) => {
  res.json(getSystemConfig());
});

app.post('/api/admin/system-config', (req, res) => {
  try {
    const newConfig = updateSystemConfig(req.body);
    res.json(newConfig);
  } catch (error) {
    res.status(500).json({ message: 'Sistem yapılandırması güncellenemedi.', error: error.message });
  }
});

app.get('/api/admin/chat-config', (req, res) => {
  const config = getChatConfig();
  // React Admin expects an array with 'id' for lists.
  // We should ensure we send specific headers for pagination if needed, 
  // but for small config, simple array is fine.
  // React Admin 'getList' often expects { data: [], total: count } or X-Total-Count header.
  res.set('X-Total-Count', config.length.toString());
  res.json(config);
});

app.post('/api/admin/chat-config', (req, res) => {
  try {
    // If body is an array, replace all. If object, maybe update one? 
    // React Admin might send POST to create one item.
    // For simplicity, let's assume we handle 'bulk' update via a special endpoint or 
    // just treat this as "save all". 
    // BUT React Admin default Data Provider sends POST /resource for create.
    // Let's support standard REST for chat-config if possible, OR just a single "save all" blob 
    // if we treat it as a singleton resource.
    // The user requirement implies "managing scenarios", so a list is better.
    // Let's implement standard REST (GET list, POST create, PUT update, DELETE).
    
    // For now, to keep it simple with the file storage, let's assume the client sends the WHOLE list
    // or we can handle individual items if we read/write the whole file every time.
    
    // Actually, let's stick to the "singleton" pattern for now if the frontend sends the whole object, 
    // OR if the frontend uses a standard Data Provider, we need GET /:id, PUT /:id, etc.
    // Let's implement full CRUD for chat-scenarios.
    
    // Wait, let's keep it simple first: /api/admin/chat-config returns the array.
    // We'll add specific routes for CRUD below.
    res.status(405).send("Use specific ID routes for CRUD or PUT for full update");
  } catch (error) {
     res.status(500).send(error.message);
  }
});

// React Admin Data Provider compatible routes for 'chat-scenarios'
app.get('/api/admin/chat-scenarios', (req, res) => {
  const config = getChatConfig();
  res.set('X-Total-Count', config.length.toString());
  res.json(config);
});

app.get('/api/admin/chat-scenarios/:id', (req, res) => {
  const config = getChatConfig();
  const item = config.find(c => c.id === req.params.id);
  if (item) res.json(item);
  else res.status(404).send('Not found');
});

app.post('/api/admin/chat-scenarios', (req, res) => {
  const config = getChatConfig();
  const newItem = { ...req.body, id: req.body.id || Date.now().toString() };
  config.push(newItem);
  updateChatConfig(config);
  res.json(newItem);
});

app.put('/api/admin/chat-scenarios/:id', (req, res) => {
  const config = getChatConfig();
  const index = config.findIndex(c => c.id === req.params.id);
  if (index > -1) {
    config[index] = { ...config[index], ...req.body };
    updateChatConfig(config);
    res.json(config[index]);
  } else {
    res.status(404).send('Not found');
  }
});

app.delete('/api/admin/chat-scenarios/:id', (req, res) => {
  let config = getChatConfig();
  const newConfig = config.filter(c => c.id !== req.params.id);
  updateChatConfig(newConfig);
  res.json({ id: req.params.id });
});


app.post('/api/admin/announcements', (req, res) => {
  const { message, type } = req.body; // type: info, warning, error
  try {
    const io = getIO();
    io.emit('announcement', { message, type: type || 'info', timestamp: Date.now() });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Duyuru gönderilemedi', error: error.message });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    // Active planes (keys in redis or just count from a set if we had one)
    // For now, we can only guess or use a counter if we maintain one.
    // Or we can check queue size?
    // Let's Mock for now, or use Redis keys if available.
    // Redis 'keys fleet/aircraft/*' might be slow.
    // Let's just return mock stats + system health.
    res.json({
      activeUsers: 1, // Mock
      trackedAircraft: 42, // Mock or fetch from Redis length if feasible
      apiStatus: 'Healthy'
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/api/telemetry/:aircraftId', async (req, res) => {
  try {
    const { aircraftId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const rawData = await redis.lrange(`telemetry:${aircraftId}`, 0, limit - 1);
    const data = rawData.map(item => JSON.parse(item));
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Telemetri verisi alınamadı.', error: error.message });
  }
});

export default app;
