import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Plane icon (SVG) - Rotable according to direction
const createPlaneIcon = (heading) => {
  return L.divIcon({
    className: 'custom-plane-icon',
    html: `<div style="transform: rotate(${heading}deg); width: 32px; height: 32px; display: flex; justify-content: center; align-items: center;">
      <svg viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" width="32" height="32">
        <path d="M2 12h20 M12 2l10 10-10 10" transform="rotate(-45 12 12)" />
        <path d="M12 2 L22 12 L12 22 M2 12 L22 12" opacity="0"/> 
        <path d="M22 2L2 22" stroke="none" fill="none"/>
        <polygon points="12 2 20 20 12 16 4 20 12 2" /> 
      </svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -10],
  });
};

const FleetMap = ({ planes, onSelectPlane, selectedPlaneId, theme }) => {
  const tileUrl = theme === 'dark'
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  const attribution = theme === 'dark'
    ? '&copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://carto.com/attributions">CARTO</a>';

  const clusterColor = theme === 'dark' ? '#6366f1' : '#3b82f6';

  return (
    <div className="h-full w-full">
      <MapContainer
        center={[39.0, 35.0]}
        zoom={6}
        style={{ height: '100%', width: '100%', background: 'var(--bg-tertiary)' }}
        attributionControl={false}
      >
        <TileLayer
          key={theme} // Force re-render on theme change
          url={tileUrl}
          attribution={attribution}
        />

        <MarkerClusterGroup
          chunkedLoading
          polygonOptions={{
            fillColor: clusterColor,
            color: clusterColor,
            weight: 2,
            opacity: 1,
            fillOpacity: 0.5
          }}
        >
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
                <div className="p-1" style={{ color: '#1e293b' }}>
                  <h3 className="font-bold text-base">{plane.callsign}</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
                    <span className="text-gray-500">Type</span>
                    <span className="font-medium">{plane.type}</span>
                    <span className="text-gray-500">Speed</span>
                    <span className="font-medium">{plane.speed} km/h</span>
                    <span className="text-gray-500">Altitude</span>
                    <span className="font-medium">{plane.altitude} ft</span>
                  </div>
                  <button
                    onClick={() => onSelectPlane(plane)}
                    className="mt-3 w-full text-xs text-white px-2 py-1.5 rounded transition font-medium"
                    style={{ backgroundColor: 'var(--accent-color)' }}
                  >
                    Track Output
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};

export default FleetMap;
