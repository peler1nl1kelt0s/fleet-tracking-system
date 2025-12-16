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

async function fetchOpenSky() {
  try {
    const url =
      `${process.env.OPENSKY_BASE_URL}` +
      `?lamin=${BOUNDS.lamin}&lomin=${BOUNDS.lomin}` +
      `&lamax=${BOUNDS.lamax}&lomax=${BOUNDS.lomax}`;

    const res = await fetch(url);
    const json = await res.json();

    if (!json.states) return;

    json.states.forEach(state => {
      const [
        icao24,
        callsign,
        origin_country,
        time_position,
        last_contact,
        longitude,
        latitude,
        baro_altitude,
        on_ground,
        velocity
      ] = state;

      if (!latitude || !longitude) return;

      const payload = {
        timestamp: Date.now(),
        lat: latitude,
        lng: longitude,
        speed: velocity,
        altitude: baro_altitude,
        callsign,
        origin_country
      };

      client.publish(
        `${MQTT_TOPIC_BASE}/${icao24}/telemetry`,
        JSON.stringify(payload)
      );
    });

  } catch (err) {
    console.error('OpenSky error:', err.message);
  }
}

setInterval(fetchOpenSky, 1000);
