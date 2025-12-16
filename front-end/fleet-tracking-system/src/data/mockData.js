import { addMinutes, subMinutes } from 'date-fns';

// utils
const getRandomInRange = (min, max) => Math.random() * (max - min) + min;
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Fake plane datas for starting (Türkiye)
export const generateInitialPlanes = (count = 20) => {
  const planes = [];
  for (let i = 0; i < count; i++) {
    planes.push({
      id: `FLT-${1000 + i}`,
      callsign: `THY${getRandomInt(100, 999)}`,
      lat: getRandomInRange(36.0, 42.0), // Türkiye latitude
      lng: getRandomInRange(26.0, 45.0), // Türkiye longtitude
      heading: getRandomInt(0, 360),
      speed: getRandomInt(400, 900), // km/h
      altitude: getRandomInt(10000, 35000), // ft
      status: Math.random() > 0.9 ? 'warning' : 'normal', // %10 chance warninga
      type: Math.random() > 0.5 ? 'Boeing 737' : 'Airbus A320',
    });
  }
  return planes;
};

// Simulate aircraft movements
export const updatePlanePositions = (planes) => {
  return planes.map(plane => {
    // Basit movement : move a little toward the heading
    const moveFactor = 0.05; 
    const radianHeading = (plane.heading * Math.PI) / 180;
    
    let newLat = plane.lat + (Math.cos(radianHeading) * moveFactor * 0.1);
    let newLng = plane.lng + (Math.sin(radianHeading) * moveFactor * 0.1);

    // (Basit bounce) If the plane was out of range, go back
    if (newLat < 36 || newLat > 42) plane.heading = (plane.heading + 180) % 360;
    if (newLng < 26 || newLng > 45) plane.heading = (plane.heading + 180) % 360;

    return {
      ...plane,
      lat: newLat,
      lng: newLng,
      speed: Math.max(400, Math.min(950, plane.speed + getRandomInt(-10, 10))), // Hız değişimi
      altitude: Math.max(5000, Math.min(40000, plane.altitude + getRandomInt(-100, 100))), // İrtifa değişimi
    };
  });
};

// Create a past chart data for the selected plane
export const generateTelemetryHistory = (minutes = 30) => {
  const history = [];
  const now = new Date();
  let baseSpeed = 750;
  let baseAlt = 28000;

  for (let i = minutes; i >= 0; i--) {
    baseSpeed += getRandomInt(-20, 20);
    baseAlt += getRandomInt(-200, 200);
    
    history.push({
      time: subMinutes(now, i).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      speed: baseSpeed,
      altitude: baseAlt,
    });
  }
  return history;
};

// Random chat messages
export const chatMessages = [
  { user: 'Tower', text: 'TK105, set the altitude to 32000' },
  { user: 'Pilot_TK105', text: 'Roger Tower, 32000 feet.' },
  { user: 'Ops_Central', text: 'Area 4\'te Is there a weather update?' },
  { user: 'Meteorology', text: 'Area 4\'te severe turbulanca is expected.' },
  { user: 'System', text: 'FLT-1012 disconnected.' },
];

// Random warns
export const alertTypes = [
  { type: 'critical', message: 'Engine 2 Pressure Drop - FLT-1004' },
  { type: 'warning', message: 'Fuel is low - FLT-1019' },
  { type: 'info', message: 'The new toute is being created - FLT-1002' },
  { type: 'warning', message: 'Communication Delay - Area 1' },
];
