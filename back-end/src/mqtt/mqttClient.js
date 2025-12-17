import mqtt from 'mqtt';
import redis from '../redis/redisClient.js';
import pool from '../db/index.js';
import { processAlerts } from '../alerts/alertEngine.js';
import { getIO } from '../ws/socket.js';
import { getChatConfig } from '../config/configManager.js';
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
    const onGround = data.on_ground ?? data.metadata?.on_ground ?? true;
    const stateKey = `aircraft:${aircraftId}:status`;
    const lastState = await redis.get(stateKey);
    const squawk = data.squawk;

    const scenarios = getChatConfig();
    const callsign = await getCallsign(aircraftId);
    if (!callsign) return;

    const roomId = await ensureChatRoom(callsign, aircraftId);

    // Helper to process a scenario
    const processScenario = async (scenario) => {
      // Pick a random message
      const msgs = scenario.messages || [];
      if (msgs.length === 0) return;
      const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
      
      // Determine language (Mock logic: default to EN, or maybe check origin_country)
      // For now, let's just send the text. Ideally we'd match user pref, but here we broadcast.
      // We can send JSON with lang variants? Or just the text. 
      // Let's send the text of the random variant.
      await postSystemMessage(roomId, randomMsg.text);
    };

    // 1. Check Squawk Triggers
    if (squawk) {
       const squawkScenario = scenarios.find(s => s.squawkRules && s.squawkRules.includes(squawk));
       // Prevent spamming squawk alert? Maybe check if we already alerted for this squawk session?
       // For simplicity, let's assume specific unique event or throttle elsewhere.
       // Let's only trigger if we haven't recently? 
       // For this demo, we'll trigger. 
       if (squawkScenario) {
          // Check if we already triggered this squawk recently to avoid spam
          const squawkKey = `aircraft:${aircraftId}:squawk:${squawk}`;
          const alreadyAlerted = await redis.get(squawkKey);
          if (!alreadyAlerted) {
             await processScenario(squawkScenario);
             await redis.setex(squawkKey, 300, 'alerted'); // 5 mins cooldown
          }
       }
    }

    // 2. Transition: Takeoff (Landed -> Airborne)
    if (!onGround && lastState !== 'airborne') {
      await redis.set(stateKey, 'airborne');
      
      const takeoffScenario = scenarios.find(s => s.trigger === 'Take-off');
      if (takeoffScenario) {
        await processScenario(takeoffScenario);
      } else {
        // Fallback default
        await postSystemMessage(roomId, 'Aircraft is currently airborne.');
      }
    }
    // 3. Transition: Landing (Airborne -> Landed)
    else if (onGround && lastState === 'airborne') {
      await redis.set(stateKey, 'landed');

      const landingScenario = scenarios.find(s => s.trigger === 'Landing');
      if (landingScenario) {
         await processScenario(landingScenario);
      } else {
         await postSystemMessage(roomId, 'Aircraft has landed.');
      }

      // Cleanup: Delete all messages for this flight session
      // Wait a bit or immediate?
      await pool.query('DELETE FROM chat_messages WHERE room_id = $1', [roomId]);
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
