import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../.env') });
import mqtt from 'mqtt';

if (!process.env.MQTT_BROKER_URL) {
  console.error('Hata: MQTT_BROKER_URL ortam değişkeni ayarlanmamış.');
  process.exit(1);
}

const client = mqtt.connect(process.env.MQTT_BROKER_URL);
const MQTT_TOPIC_BASE = 'fleet/aircraft';

const BOUNDS = {
  lamin: 35.5,
  lomin: 25.0,
  lamax: 42.5,
  lomax: 45.0
};

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

async function fetchOpenSky() {
  try {
    // console.log('OpenSky fetch...');

    const url =
      `${process.env.OPENSKY_BASE_URL}` +
      `?lamin=${BOUNDS.lamin}&lomin=${BOUNDS.lomin}` +
      `&lamax=${BOUNDS.lamax}&lomax=${BOUNDS.lomax}`;

    const res = await fetch(url);

    if (!res.ok) {
      console.warn(`OpenSky ${res.status}`);
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
      true_track
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
      true_track
    };

    const topic = `${MQTT_TOPIC_BASE}/${icao24}/telemetry`;
    const payloadString = JSON.stringify(payload);
    publishOrQueue(topic, payloadString);
  }
}

setInterval(fetchOpenSky, 20_000);

setInterval(replayEverySecond, 1_000);

fetchOpenSky();
