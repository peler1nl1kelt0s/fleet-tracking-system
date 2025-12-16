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

const FleetMap = ({ planes, onSelectPlane, selectedPlaneId }) => {
  return (
    <div className="h-full w-full rounded-lg overflow-hidden shadow-lg border border-gray-700 bg-gray-900">
      <MapContainer 
        center={[39.0, 35.0]} 
        zoom={6} 
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        <MarkerClusterGroup
          chunkedLoading
          polygonOptions={{
            fillColor: '#3b82f6',
            color: '#3b82f6',
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
                <div className="text-gray-800">
                  <h3 className="font-bold">{plane.callsign}</h3>
                  <p className="text-sm">Type: {plane.type}</p>
                  <p className="text-sm">Speed: {plane.speed} km/h</p>
                  <p className="text-sm">Altitued: {plane.altitude} ft</p>
                  <button 
                    onClick={() => onSelectPlane(plane)}
                    className="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition"
                  >
                    See Details
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
