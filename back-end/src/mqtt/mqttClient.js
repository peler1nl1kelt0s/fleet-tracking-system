import mqtt from 'mqtt';
import redis from '../redis/redisClient.js';
import { processAlerts } from '../alerts/alertEngine.js';
import { getIO } from '../ws/socket.js';
import {
  writeToDisk,
  readFromDisk,
  clearDiskBuffer
} from '../buffer/diskBuffer.js';

const client = mqtt.connect(process.env.MQTT_BROKER_URL);

client.on('connect', () => {
  console.log('MQTT connected (Main Client)');
  client.subscribe('fleet/aircraft/+/telemetry');
});

client.on('message', async (topic, message) => {
  const aircraftId = topic.split('/')[2];
  const data = JSON.parse(message.toString());

  try {
    getIO().emit('telemetry', data);
    await redis.lpush(
      `telemetry:${aircraftId}`,
      JSON.stringify(data)
    );

    // Diskten replay
    const buffered = readFromDisk(aircraftId);
    if (buffered.length > 0) {
      for (const item of buffered) {
        await redis.lpush(
          `telemetry:${aircraftId}`,
          JSON.stringify(item)
        );
      }
      clearDiskBuffer(aircraftId);
      console.log(`Replayed disk buffer for ${aircraftId}`);
    }

  } 
  catch 
  {
    writeToDisk(aircraftId, data);
  }

  // Alert Engine servisine veriyi gönder
  processAlerts(aircraftId, data);
});
