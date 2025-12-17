import mqtt from 'mqtt';
import redis from '../redis/redisClient.js';
import pool from '../db/db.js';
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

    // Handle Pulse Chat Lifecycle (Airborne/Landed logic)
    await handlePulseChat(aircraftId, data);

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

/**
 * Manages the temporary chat lifecycle based on aircraft status.
 */
async function handlePulseChat(aircraftId, data) {
  try {
    // Determine on_ground status (default to true if missing for safety)
    const onGround = data.on_ground ?? data.metadata?.on_ground ?? true;
    const stateKey = `aircraft:${aircraftId}:status`;
    const lastState = await redis.get(stateKey);

    // 1. Transition: Takeoff (Landed -> Airborne)
    if (!onGround && lastState !== 'airborne') {
      await redis.set(stateKey, 'airborne');
      
      const callsign = await getCallsign(aircraftId);
      if (callsign) {
        const roomId = await ensureChatRoom(callsign, aircraftId);
        
        // Post System Message: Airborne
        await postSystemMessage(roomId, 'Aircraft is currently airborne.');

        // Calculate and Post ETA
        if (data.speed > 0 && data.altitude > 0) {
           // Simplified heuristic for ETA (e.g., assuming 45 mins flight for demo)
           const etaMsg = `Estimated landing time: ${calculateETA(data)}`;
           await postSystemMessage(roomId, etaMsg);
        }
      }
    }
    // 2. Transition: Landing (Airborne -> Landed)
    else if (onGround && lastState === 'airborne') {
      await redis.set(stateKey, 'landed');

      const callsign = await getCallsign(aircraftId);
      if (callsign) {
        const roomId = await ensureChatRoom(callsign, aircraftId);
        
        // Post System Message: Landed
        await postSystemMessage(roomId, 'Aircraft has landed. Chat closed.');

        // Cleanup: Delete all messages for this flight session
        await pool.query('DELETE FROM chat_messages WHERE room_id = $1', [roomId]);
        // Optional: Delete the room itself if strictly temporary
        await pool.query('DELETE FROM chat_rooms WHERE id = $1', [roomId]);
      }
    }
  } catch (err) {
    console.error(`Pulse Chat Error for ${aircraftId}:`, err);
  }
}

async function getCallsign(aircraftId) {
  // Try cache first
  const cached = await redis.get(`callsign:${aircraftId}`);
  if (cached) return cached;

  // DB Lookup
  const res = await pool.query('SELECT plate_number FROM vehicles WHERE id = $1', [aircraftId]);
  if (res.rows.length > 0) {
    const callsign = res.rows[0].plate_number;
    await redis.set(`callsign:${aircraftId}`, callsign);
    return callsign;
  }
  return null;
}

async function ensureChatRoom(callsign, vehicleId) {
  // Find or create a chat room for this aircraft
  const roomName = `aircraft:${callsign}`;
  let res = await pool.query("SELECT id FROM chat_rooms WHERE name = $1 AND type = 'vehicle'", [roomName]);
  
  if (res.rows.length === 0) {
    res = await pool.query(
      "INSERT INTO chat_rooms (name, type, related_vehicle_id) VALUES ($1, 'vehicle', $2) RETURNING id",
      [roomName, vehicleId]
    );
  }
  return res.rows[0].id;
}

async function postSystemMessage(roomId, content) {
  await pool.query('INSERT INTO chat_messages (room_id, content) VALUES ($1, $2)', [roomId, content]);
}

function calculateETA(data) {
  // Placeholder heuristic: Current time + 45 mins
  const date = new Date();
  date.setMinutes(date.getMinutes() + 45);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
