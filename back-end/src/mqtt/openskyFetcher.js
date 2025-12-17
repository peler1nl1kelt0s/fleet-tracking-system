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
// Fetch from API every 10 seconds
const FETCH_INTERVAL = 10000;
const AIRCRAFT_TTL = 300000; // 5 minutes in ms

// Refresh config periodically
setInterval(() => {
  systemConfig = getSystemConfig();
  if (systemConfig.bounds) BOUNDS = systemConfig.bounds;
}, 10000);

// Map<icao24, AircraftObject>
// AircraftObject: { ...data, lastDataUpdate: timestamp, lastInterpolation: timestamp }
let aircraftMap = new Map();
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
      return; // If fetch fails, we simply return. Mapping logic handles persistence.
    }

    const json = await res.json();
    if (!json.states) return;

    const now = Date.now();

    // Process new states
    json.states.forEach(s => {
      const icao24 = s[0];
      // Check if we already have this aircraft
      const existing = aircraftMap.get(icao24);

      const raw = {
        icao24: s[0],
        callsign: s[1]?.trim(),
        origin_country: s[2],
        time_position: s[3],
        last_contact: s[4],
        lon: s[5],
        lat: s[6],
        // Defaults if null: use existing if available, or reasonably safe defaults
        altitude: s[7] ?? existing?.altitude ?? 0,
        on_ground: s[8],
        speed: s[9] ?? existing?.speed ?? 0,
        true_track: s[10] ?? existing?.true_track ?? 0,
        vertical_rate: s[11],
        squawk: s[14],
        lastDataUpdate: now,
        lastInterpolation: now
      };

      // If tracking missing/invalid on ground, use defaults?
      // Actually 0 speed is fine for ground. But for air, we might want to keep last speed if null?

      aircraftMap.set(icao24, raw);
    });

    // Cleanup Stale Aircraft
    for (const [key, val] of aircraftMap.entries()) {
      if (now - val.lastDataUpdate > AIRCRAFT_TTL) {
        aircraftMap.delete(key);
      }
    }

    console.log(`OpenSky updated | Active aircraft: ${aircraftMap.size}`);

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
  if (aircraftMap.size === 0) return;

  const now = Date.now();

  for (const aircraft of aircraftMap.values()) {

    // Time since last *interpolation step*
    const timeDelta = (now - aircraft.lastInterpolation) / 1000;

    // Dead Reckoning if airborne and moving
    if (!aircraft.on_ground && aircraft.speed > 0) {
      const { lat, lon } = calculateNextPosition(
        aircraft.lat,
        aircraft.lon,
        aircraft.speed,
        aircraft.true_track,
        timeDelta
      );
      aircraft.lat = lat;
      aircraft.lon = lon;
    }

    aircraft.lastInterpolation = now;

    const payload = {
      timestamp: now,
      icao24: aircraft.icao24,
      lat: aircraft.lat,
      lng: aircraft.lon,
      speed: aircraft.speed,
      altitude: aircraft.altitude,
      callsign: aircraft.callsign,
      origin_country: aircraft.origin_country,
      time_position: aircraft.time_position,
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

// Loop Interpolation & Publish every 1 second
setInterval(processAndInterpolate, 1000);

// Initial Fetch
fetchOpenSky();
