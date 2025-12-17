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
    
    // START FIX: Resolve vehicle UUID using icao24 (aircraftId)
    // We treat aircraftId as icao24. We need the UUID for relation.
    // data.callsign might be available.
    const icao24 = aircraftId;
    const callsign = data.callsign || aircraftId; // Fallback

    const vehicleId = await ensureVehicleExists(icao24, callsign);
    if (!vehicleId) {
       console.warn(`Could not resolve vehicle UUID for ${icao24}`);
       return;
    }
    // END FIX

    const roomId = await ensureChatRoom(callsign, vehicleId);

    // Helper to process a scenario
    const processScenario = async (scenario) => {
      // Pick a random message
      const msgs = scenario.messages || [];
      if (msgs.length === 0) return;
      const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
      
      await postSystemMessage(roomId, randomMsg.text);
    };

    // 1. Check Squawk Triggers
    if (squawk) {
       const squawkScenario = scenarios.find(s => s.squawkRules && s.squawkRules.includes(squawk));
       if (squawkScenario) {
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

/**
 * Finds vehicle by icao24. If not found, creates it. Returns UUID.
 */
async function ensureVehicleExists(icao24, callsign) {
    // Try cache (mapping icao24 -> uuid)
    const cacheKey = `vehicle:uuid:${icao24}`;
    const cachedUuid = await redis.get(cacheKey);
    if (cachedUuid) return cachedUuid;

    // DB Lookup
    try {
        let res = await pool.query('SELECT id FROM vehicles WHERE icao24 = $1', [icao24]);
        
        if (res.rows.length === 0) {
            // Register new vehicle
            // plate_number must be unique. keys: icao24 is unique too.
            // Use icao24 as plate_number fallback if callsign is not unique or present?
            // Actually callsign changes for the same airframe (icao24). 
            // For this system, let's use icao24 as plate_number if we must, or a combination.
            // Simplified: Use icao24 as plate_number for now, or generated.
            const safePlate = callsign && callsign.length > 0 ? callsign : icao24;
            
            // Handle duplicate plate_number issue: upsert or retry?
            // We use ON CONFLICT DO NOTHING for safety, but we need the ID.
            // Let's try inserting.
            res = await pool.query(
                `INSERT INTO vehicles (plate_number, icao24, vehicle_type, status) 
                 VALUES ($1, $2, 'aircraft', 'active') 
                 ON CONFLICT (icao24) DO UPDATE SET updated_at = NOW() 
                 RETURNING id`,
                [safePlate, icao24]
            );
            
            // If conflict on plate_number, it might fail. 
            // If that happens, select again.
        }
        
        // If insert didn't return (e.g. conflict ignored but not updated?), select again
        if (res.rows.length === 0) {
             res = await pool.query('SELECT id FROM vehicles WHERE icao24 = $1', [icao24]);
        }

        if (res.rows.length > 0) {
            const id = res.rows[0].id;
            await redis.set(cacheKey, id); // Cache it
            return id;
        }
    } catch (err) {
        console.error('Error ensuring vehicle exists:', err);
        // Fallback: try finding by plate_number?? 
        // Or just fail.
    }
    return null;
}

// getCallsign removed - we use ensureVehicleExists now.

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
