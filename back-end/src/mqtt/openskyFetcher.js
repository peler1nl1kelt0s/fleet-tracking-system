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
let FETCH_INTERVAL = systemConfig.apiRefreshRate || 20000;

// Refresh config periodically
setInterval(() => {
  systemConfig = getSystemConfig();
  if (systemConfig.bounds) BOUNDS = systemConfig.bounds;
  if (systemConfig.apiRefreshRate) FETCH_INTERVAL = systemConfig.apiRefreshRate;
}, 10000);

let lastStates = [];
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

    // console.log('OpenSky fetch...');

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

    lastStates = json.states.filter(s => s[5] && s[6]);

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

function replayEverySecond() {
  if (lastStates.length === 0) return;

  for (const state of lastStates) {
    const [
      icao24,
      callsign,
      origin_country,
      time_position,
      ,
      lon,
      lat,
      altitude,
      on_ground,
      speed,
      true_track,
      ,
      ,
      ,
      squawk
    ] = state;

    const payload = {
      timestamp: Date.now(),
      icao24,
      lat,
      lng: lon,
      speed,
      altitude,
      callsign: callsign?.trim(),
      origin_country,
      time_position,
      on_ground,
      true_track,
      squawk
    };

    const topic = `${MQTT_TOPIC_BASE}/${icao24}/telemetry`;
    const payloadString = JSON.stringify(payload);
    publishOrQueue(topic, payloadString);
  }
}

// Use a recursive timeout pattern to allow interval changes to take effect immediately after the next fetch
function scheduleNextFetch() {
  setTimeout(async () => {
    await fetchOpenSky();
    scheduleNextFetch();
  }, FETCH_INTERVAL);
}

// Start the loop
scheduleNextFetch();

setInterval(replayEverySecond, 1_000);

fetchOpenSky();
