import mqtt from 'mqtt';
import redis from '../redis/redisClient.js';
import { getIO } from '../ws/socket.js';
import { checkAlerts } from '../alerts/alertEngine.js';
import {
  writeToDisk,
  readFromDisk,
  clearDiskBuffer
} from '../buffer/diskBuffer.js';

const client = mqtt.connect(process.env.MQTT_BROKER_URL);

const RULES = {
  maxSpeed: 250,
  minAltitude: 1000
};

const GEOFENCE = {
  minLat: 35.5,
  maxLat: 42.5,
  minLng: 25.0,
  maxLng: 45.0
};

client.on('connect', () => {
  console.log('MQTT connected');
  client.subscribe('fleet/aircraft/+/telemetry');
});

client.on('message', async (topic, message) => {
  const io = getIO();

  const aircraftId = topic.split('/')[2];
  const data = JSON.parse(message.toString());

  // Redis varsa → Redis
  try {
    await redis.lpush(
      `telemetry:${aircraftId}`,
      JSON.stringify(data)
    );

    // Diskten replay (varsa)
    const buffered = readFromDisk(aircraftId);
    if (buffered.length > 0) {
      for (const item of buffered) {
        await redis.lpush(
          `telemetry:${aircraftId}`,
          JSON.stringify(item)
        );
      }
      clearDiskBuffer(aircraftId);
      console.log(`♻️ Replayed disk buffer for ${aircraftId}`);
    }

  } catch {
    // Redis yok → disk
    writeToDisk(aircraftId, data);
  }

  // Alerts
  const alerts = checkAlerts(data, RULES);
  alerts.forEach(alert => {
    io.emit('alert', {
      aircraftId,
      ...alert,
      timestamp: Date.now()
    });
  });

  if (isOutsideGeofence(data.lat, data.lng, GEOFENCE)) {
    io.emit('alert', {
      aircraftId,
      type: 'GEOFENCE',
      message: 'Aircraft left allowed airspace',
      timestamp: Date.now()
    });
  }
});

function isOutsideGeofence(lat, lng, g) {
  return (
    lat < g.minLat ||
    lat > g.maxLat ||
    lng < g.minLng ||
    lng > g.maxLng
  );
}
