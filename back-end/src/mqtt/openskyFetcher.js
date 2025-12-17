import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { getSystemConfig } from '../config/configManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../.env') });
import mqtt from 'mqtt';

if (!process.env.MQTT_BROKER_URL) {
  console.error('Hata: MQTT_BROKER_URL ortam değişkeni ayarlanmamış.');
  process.exit(1);
}

const client = mqtt.connect(process.env.MQTT_BROKER_URL);
const MQTT_TOPIC_BASE = 'fleet/aircraft';

// OpenSky Auth Configuration
const OPENSKY_AUTH_URL = 'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token';
const CLIENT_ID = process.env.OPENSKY_CLIENT_ID;
const CLIENT_SECRET = process.env.OPENSKY_CLIENT_SECRET;

let accessToken = null;
let tokenExpiry = 0;

// Initial Load
let systemConfig = getSystemConfig();

// Default if config fails
let BOUNDS = systemConfig.bounds || {
  lamin: 35.5,
  lomin: 25.0,
  lamax: 42.5,
  lomax: 45.0
};
// Fetch from API every 10 seconds to respect rate limits
const FETCH_INTERVAL = 10000;

// Refresh config periodically
setInterval(() => {
  systemConfig = getSystemConfig();
  if (systemConfig.bounds) BOUNDS = systemConfig.bounds;
  // Note: we ignore systemConfig.apiRefreshRate to enforce 10s for OpenSky friendliness
}, 10000);

let lastStates = []; // Array of { ...stateData, lastUpdated: timestamp }
let messageQueue = [];

client.on('connect', () => {
  console.log('MQTT Broker bağlantısı başarılı.');
  while (messageQueue.length > 0) {
    const { topic, payload } = messageQueue.shift();
    client.publish(topic, payload, {}, (err) => {
      if (err) console.error('Kuyruktaki mesaj gönderilemedi:', err);
    });
  }
});

client.on('close', () => {
  console.warn('MQTT Broker bağlantısı kesildi. Mesajlar kuyruğa alınıyor.');
});

async function getAccessToken() {
  // Return cached token if valid (with 60s buffer)
  if (accessToken && Date.now() < tokenExpiry - 60000) {
    return accessToken;
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.warn('OPENSKY_CLIENT_ID veya OPENSKY_CLIENT_SECRET eksik. Anonim erişim deneniyor (kısıtlı).');
    return null;
  }

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);

    const res = await fetch(OPENSKY_AUTH_URL, {
      method: 'POST',
      body: params
    });

    if (!res.ok) {
      console.error(`OpenSky Auth Failed: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.error('Response:', text);
      return null;
    }

    const data = await res.json();
    accessToken = data.access_token;
    // expires_in is in seconds, convert to ms and set absolute expiry time
    tokenExpiry = Date.now() + (data.expires_in * 1000);
    console.log('OpenSky Access Token başarıyla alındı.');
    return accessToken;
  } catch (error) {
    console.error('OpenSky Token Hatası:', error);
    return null;
  }
}

async function fetchOpenSky() {
  try {
    const token = await getAccessToken();

    const url =
      `${process.env.OPENSKY_BASE_URL}` +
      `?lamin=${BOUNDS.lamin}&lomin=${BOUNDS.lomin}` +
      `&lamax=${BOUNDS.lamax}&lomax=${BOUNDS.lomax}`;

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, { headers });

    if (!res.ok) {
      console.warn(`OpenSky ${res.status} - ${res.statusText}`);
      if (res.status === 401 || res.status === 403) {
        console.log('Token geçersiz veya yetkisiz, tokenı sıfırlıyorum...');
        accessToken = null; // Force refresh next time
      }
      return;
    }

    const json = await res.json();
    if (!json.states) return;

    // We only take valid states
    const newStates = json.states.filter(s => s[5] && s[6]).map(s => {
      // Convert raw array to object for easier handling
      const [
        icao24,
        callsign,
        origin_country,
        time_position,
        last_contact,
        lon,
        lat,
        altitude,
        on_ground,
        speed,
        true_track,
        vertical_rate,
        sensors,
        geo_altitude,
        squawk,
        spi,
        position_source
      ] = s;

      return {
        icao24,
        callsign: callsign?.trim(),
        origin_country,
        time_position,
        lon,
        lat,
        altitude,
        on_ground,
        speed,
        true_track,
        squawk,
        // Internal tracking for interpolation
        lastUpdated: Date.now()
      };
    });

    // Update global state, but merge if we want to keep some smoothness? 
    // Actually, straight replace is safer to avoid ghosts.
    lastStates = newStates;

    console.log(`OpenSky updated | aircraft: ${lastStates.length}`);

  } catch (err) {
    console.error('OpenSky error:', err.message);
  }
}

function publishOrQueue(topic, payload) {
  if (client.connected) {
    client.publish(topic, payload);
  } else {
    messageQueue.push({ topic, payload });
  }
}

/**
 * Calculates the next position based on current position, speed, and heading.
 * Returns { lat, lon }
 * speed is in m/s
 * timeDelta is in seconds
 */
function calculateNextPosition(lat, lon, speed, heading, timeDelta) {
  if (!speed || speed < 0) return { lat, lon };

  // Distance traveled in meters
  const distance = speed * timeDelta;

  // Earth radius in meters
  const R = 6371e3;

  const angDist = distance / R;
  const radLat = lat * (Math.PI / 180);
  const radLon = lon * (Math.PI / 180);
  const radHeading = heading * (Math.PI / 180);

  let nextLat = Math.asin(Math.sin(radLat) * Math.cos(angDist) +
    Math.cos(radLat) * Math.sin(angDist) * Math.cos(radHeading));

  let nextLon = radLon + Math.atan2(Math.sin(radHeading) * Math.sin(angDist) * Math.cos(radLat),
    Math.cos(angDist) - Math.sin(radLat) * Math.sin(nextLat));

  // Convert back to degrees
  nextLat = nextLat * (180 / Math.PI);
  nextLon = nextLon * (180 / Math.PI);

  return { lat: nextLat, lon: nextLon };
}

function processAndInterpolate() {
  if (lastStates.length === 0) return;

  const now = Date.now();

  for (let i = 0; i < lastStates.length; i++) {
    const aircraft = lastStates[i];

    // Calculate time since last update in seconds
    // Since we run this loop every 1s, we arguably just advance 1s worth of distance.
    // However, tracking real elapsed time is robust against loop drift.
    // Ideally we update 'aircraft.lastUpdated' after calculation.

    const timeDelta = (now - aircraft.lastUpdated) / 1000;

    // Only interpolate if airborne and moving
    if (!aircraft.on_ground && aircraft.speed > 0) {
      const { lat, lon } = calculateNextPosition(
        aircraft.lat,
        aircraft.lon,
        aircraft.speed,
        aircraft.true_track,
        timeDelta
      );

      // Update state in memory
      aircraft.lat = lat;
      aircraft.lon = lon;
    }

    // Reset timestamp so next loop calculates 1s delta approx
    aircraft.lastUpdated = now;

    const payload = {
      timestamp: now,
      icao24: aircraft.icao24,
      lat: aircraft.lat,
      lng: aircraft.lon,
      speed: aircraft.speed,
      altitude: aircraft.altitude,
      callsign: aircraft.callsign,
      origin_country: aircraft.origin_country,
      time_position: aircraft.time_position, // Keep original source time? Or update? usually source time.
      on_ground: aircraft.on_ground,
      true_track: aircraft.true_track,
      squawk: aircraft.squawk
    };

    const topic = `${MQTT_TOPIC_BASE}/${aircraft.icao24}/telemetry`;
    const payloadString = JSON.stringify(payload);
    publishOrQueue(topic, payloadString);
  }
}

// Loop OpenSky Fetch every 10 seconds
setInterval(fetchOpenSky, FETCH_INTERVAL);

// Loop Interpolation & Publish every 1 second (1000ms)
setInterval(processAndInterpolate, 1000);

// Initial Fetch
fetchOpenSky();
