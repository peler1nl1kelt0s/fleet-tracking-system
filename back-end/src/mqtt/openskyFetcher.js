import 'dotenv/config';
import fetch from 'node-fetch';
import mqtt from 'mqtt';

const client = mqtt.connect(process.env.MQTT_BROKER_URL);
const MQTT_TOPIC_BASE = 'fleet/aircraft';

const BOUNDS = {
  lamin: 35.5,
  lomin: 25.0,
  lamax: 42.5,
  lomax: 45.0
};

let lastStates = [];

async function fetchOpenSky() {
  try {
    console.log('OpenSky fetch...');

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

    client.publish(
      `${MQTT_TOPIC_BASE}/${icao24}/telemetry`,
      JSON.stringify(payload)
    );
  }
}

setInterval(fetchOpenSky, 10_000);

setInterval(replayEverySecond, 1_000);

fetchOpenSky();
