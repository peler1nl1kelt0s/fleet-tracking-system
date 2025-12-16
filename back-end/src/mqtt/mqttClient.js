import mqtt from 'mqtt';
import redis from '../redis/redisClient.js';
import io from '../ws/socket.js';

const client = mqtt.connect(process.env.MQTT_BROKER_URL);

client.on('connect', () => {
  console.log('MQTT connected');
  client.subscribe('fleet/aircraft/+/telemetry');
});

client.on('message', async (topic, message) => {
  const aircraftId = topic.split('/')[2];
  const data = JSON.parse(message.toString());

  console.log('MQTT:', aircraftId, data);

  io.emit('telemetry', {
    aircraftId,
    data
  });

  try {
    await redis.lpush(
      `telemetry:${aircraftId}`,
      JSON.stringify(data)
    );
  } catch (err) {
    console.error('Redis down, skipping...');
  }
});

export default client;
