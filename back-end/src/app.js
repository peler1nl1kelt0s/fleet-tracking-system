import express from 'express';
import cors from 'cors';
import { getConfig, updateConfig } from './config/alertConfig.js';
import redis from './redis/redisClient.js';

const app = express();

app.use(cors());
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
