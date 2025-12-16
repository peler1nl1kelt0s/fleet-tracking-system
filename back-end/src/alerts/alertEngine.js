export function checkAlerts(telemetry, rules) {
  const alerts = [];

  if (telemetry.speed > rules.maxSpeed) {
    alerts.push({
      type: 'SPEED',
      message: `Speed limit exceeded: ${telemetry.speed}`
    });
  }

  if (telemetry.altitude < rules.minAltitude) {
    alerts.push({
      type: 'ALTITUDE',
      message: `Low altitude: ${telemetry.altitude}`
    });
  }

  return alerts;
}
