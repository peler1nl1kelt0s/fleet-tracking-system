import React, { useState, useEffect, useRef } from 'react';
import { Plane } from 'lucide-react';
import io from 'socket.io-client';
import FleetMap from './components/FleetMap';
import TelemetryChart from './components/TelemetryChart';
import InfoPanel from './components/InfoPanel';

import { 
  chatMessages as initialChat
} from './data/mockData';

const SOCKET_URL = 'http://localhost:3000';

function App() {
  const [planes, setPlanes] = useState([]);
  const [selectedPlaneId, setSelectedPlaneId] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [chat, setChat] = useState(initialChat);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef(null);

  useEffect(() => {
    // Socket.IO Connection
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('connect', () => {
      console.log('Connected to WebSocket');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      setIsConnected(false);
    });

    socketRef.current.on('telemetry', (data) => {
      setPlanes(prevPlanes => {
        const index = prevPlanes.findIndex(p => p.id === data.icao24);
        
        const mappedPlane = {
          id: data.icao24,
          callsign: data.callsign || data.icao24,
          lat: data.lat,
          lng: data.lng,
          heading: data.true_track,
          speed: data.speed || 0,
          altitude: data.altitude || 0,
          status: 'normal', // Default status
          type: 'Unknown', // Backend doesn't provide type yet
          lastUpdate: Date.now()
        };

        if (index > -1) {
          // Update existing
          const newPlanes = [...prevPlanes];
          newPlanes[index] = { ...newPlanes[index], ...mappedPlane };
          return newPlanes;
        } else {
          // Add new
          return [...prevPlanes, mappedPlane];
        }
      });
    });

    socketRef.current.on('alert', (alert) => {
      setAlerts(prev => [{
        type: alert.type === 'SPEED' || alert.type === 'ALTITUDE' ? 'warning' : 'info',
        message: `${alert.message} - ${alert.aircraftId}`,
        timestamp: alert.timestamp
      }, ...prev].slice(0, 50));
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // Fetch history when plane selected
  useEffect(() => {
    if (!selectedPlaneId) return;

    // Clear previous history
    setHistoryData([]);

    fetch(`http://localhost:3000/api/telemetry/${selectedPlaneId}?limit=20`)
      .then(res => res.json())
      .then(data => {
        // Map API data to Chart format
        // API returns { time: Date, ... }
        // Chart expects { time: "HH:mm", speed: number, altitude: number }
        const mappedHistory = data.map(d => ({
          time: new Date(d.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          speed: d.speed,
          altitude: d.altitude
        })).reverse(); // API returns newest first (LIFO via lrange 0..N), chart usually L->R time
        
        setHistoryData(mappedHistory);
      })
      .catch(err => console.error("History fetch failed", err));

  }, [selectedPlaneId]);

  const handleSelectPlane = (plane) => {
    setSelectedPlaneId(plane.id);
  };

  const selectedPlane = planes.find(p => p.id === selectedPlaneId);

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white font-sans overflow-hidden">
      
      {/* Header */}
      <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center px-4 sm:px-6 shadow-md z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Plane size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">SkyWatcher <span className="text-blue-500">Fleet</span></h1>
            <p className="text-xs text-gray-400 hidden sm:block">Live Fleet Tracking System v1.0</p>
          </div>
        </div>
        
        <div className="ml-auto flex items-center gap-4 sm:gap-6">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${isConnected ? 'bg-gray-800 border-gray-700' : 'bg-red-900/50 border-red-800'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-300">{isConnected ? 'Online' : 'Disconnected'}</span>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-sm font-mono text-gray-300">{new Date().toLocaleDateString()}</p>
            <p className="text-xs text-gray-500">Istanbul ACC</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 overflow-y-auto lg:overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:h-full">
          
          {/* Left Column (Map + Chart) */}
          <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full">
            {/* Map Area */}
            <div className="h-[400px] lg:h-auto lg:flex-grow rounded-xl overflow-hidden shadow-2xl border border-gray-800 relative group z-0">
               <FleetMap 
                 planes={planes} 
                 onSelectPlane={handleSelectPlane}
                 selectedPlaneId={selectedPlaneId}
               />
               {!selectedPlaneId && (
                 <div className="absolute top-4 left-4 sm:left-16 bg-black/60 backdrop-blur-sm px-4 py-2 rounded text-sm text-white pointer-events-none z-[400]">
                   Select a plane for details
                 </div>
               )}
            </div>

            {/* Chart Area */}
            <div className="h-64 flex-shrink-0">
               <TelemetryChart data={historyData} selectedPlane={selectedPlane} />
            </div>
          </div>

          {/* Right Column (Info Panel) */}
          <div className="lg:col-span-1 h-[600px] lg:h-full overflow-hidden">
            <InfoPanel alerts={alerts} chatMessages={chat} />
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;