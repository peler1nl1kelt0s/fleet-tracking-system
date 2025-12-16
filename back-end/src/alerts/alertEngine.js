import { getConfig } from '../config/alertConfig.js';
import { getIO } from '../ws/socket.js';

// Araçların coğrafi çit durumlarını takip etmek için (Giriş/Çıkış kontrolü)
const vehicleGeofenceStates = {};

/**
 * @param {string} aircraftId 
 * @param {object} data 
 */
export function processAlerts(aircraftId, data) {
  const io = getIO();
  const config = getConfig();

  const alerts = checkThresholds(data, config);
  
  alerts.forEach(alert => {
    io.emit('alert', {
      aircraftId,
      ...alert,
      timestamp: Date.now()
    });
  });

  if (config.geofence) {
    for (const fenceKey in config.geofence) {
      const fence = config.geofence[fenceKey];
      if (fence.enabled) {
        checkGeofence(aircraftId, data, fence, io);
      }
    }
  }
}

function checkThresholds(telemetry, config) {
  const alerts = [];
  const { speed_threshold, altitude_threshold} = config;

  if (speed_threshold?.enabled && telemetry.speed > speed_threshold.max_speed_kmh) {
    alerts.push({ type: 'SPEED', message: `Speed limit exceeded: ${telemetry.speed} km/h` });
  }

  if (altitude_threshold?.enabled && telemetry.altitude < altitude_threshold.min_altitude_ft) {
    alerts.push({ type: 'ALTITUDE', message: `Low altitude: ${telemetry.altitude} ft` });
  }

  return alerts;
}

function checkGeofence(vehicleId, data, geofence, io) {
  const isInside = (
    data.lat >= geofence.lamin &&
    data.lat <= geofence.lamax &&
    data.lng >= geofence.lomin &&
    data.lng <= geofence.lomax
  );

  const currentState = isInside ? 'inside' : 'outside';

  if (!vehicleGeofenceStates[vehicleId]) {
    vehicleGeofenceStates[vehicleId] = {};
  }

  const lastState = vehicleGeofenceStates[vehicleId][geofence.name];

  // Sadece durum değiştiğinde uyarı ver (State Change)
  if (lastState && currentState !== lastState) {
    const alertType = currentState === 'inside' ? 'GEOFENCE_ENTRY' : 'GEOFENCE_EXIT';
    const message = `Aircraft ${currentState === 'inside' ? 'entered' : 'left'} ${geofence.name}`;
    
    io.emit('alert', {
      aircraftId: vehicleId,
      type: alertType,
      message: message,
      timestamp: Date.now()
    });
  }

  vehicleGeofenceStates[vehicleId][geofence.name] = currentState;
}