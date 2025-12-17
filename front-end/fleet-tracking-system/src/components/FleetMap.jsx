import React from 'react';
import Button from './Button';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Plane icon (SVG) - Rotable according to direction
const createPlaneIcon = (heading) => {
  return L.divIcon({
    className: 'custom-plane-icon',
    html: `<div style="transform: rotate(${heading}deg); width: 32px; height: 32px; display: flex; justify-content: center; align-items: center;">
      <!-- Main Plane Body -->
      <svg viewBox="0 0 512 512" width="32" height="32" fill="#3b82f6" stroke="white" stroke-width="15" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
         <path d="M428.3 331.3l-28-56.9L262.8 191.1v-88.7c0-23.7-19.1-42.9-42.8-42.9-23.7 0-42.8 19.1-42.8 42.9v88.7L40.1 274.4l-28 56.9c-2.4 4.9-1.3 10.9 2.6 14.8 3.9 3.9 9.9 5.2 14.8 2.6L164.8 288v94.8l-37.4 37.4c-4 4-5.2 10.1-2.9 15.2 2.3 5.2 7.4 8.5 13.1 8.5h164.9c5.6 0 10.8-3.3 13.1-8.5 2.3-5.2 1.1-11.2-2.9-15.2L275.2 382.8V288l135.3 60.7c4.9 2.6 10.9 1.3 14.8-2.6 3.9-4.1 5-10 2.6-14.8z"/>
      </svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const FleetMap = ({ planes, onSelectPlane, selectedPlaneId, theme }) => {
  const tileUrl = theme === 'dark'
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  const attribution = theme === 'dark'
    ? '&copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://carto.com/attributions">CARTO</a>';

  return (
    <div className="h-full w-full">
      <MapContainer
        center={[39.0, 35.0]}
        zoom={6}
        className="h-full w-full bg-[var(--bg-tertiary)]"
        attributionControl={false}
      >
        <TileLayer
          key={theme} // Force re-render on theme change
          url={tileUrl}
          attribution={attribution}
        />

        {planes.map((plane) => (
          <Marker
            key={plane.id}
            position={[plane.lat, plane.lng]}
            icon={createPlaneIcon(plane.heading)}
            eventHandlers={{
              click: () => onSelectPlane(plane),
            }}
          >
            <Popup className="glass-popup">
              <div className="p-1 text-[var(--text-primary)]">
                <h3 className="font-bold text-base">{plane.callsign}</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
                  <span className="text-gray-500">Type</span>
                  <span className="font-medium">{plane.type}</span>
                  <span className="text-gray-500">Speed</span>
                  <span className="font-medium">{plane.speed} km/h</span>
                  <span className="text-gray-500">Altitude</span>
                  <span className="font-medium">{plane.altitude} ft</span>
                </div>
                <Button
                  onClick={() => onSelectPlane(plane)}
                  className="mt-3 w-full text-xs"
                  variant="primary"
                >
                  Track Output
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default FleetMap;
