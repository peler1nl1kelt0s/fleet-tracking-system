import React, { useState, useEffect, useRef } from 'react';
import { Plane } from 'lucide-react';
import { io } from 'socket.io-client';
import FleetMap from './components/FleetMap';
import TelemetryChart from './components/TelemetryChart';
import InfoPanel from './components/InfoPanel';

import { 
  generateTelemetryHistory, 
  chatMessages as initialChat,
  alertTypes
} from './data/mockData';

function App() {
  const [planes, setPlanes] = useState([]);
  const [selectedPlaneId, setSelectedPlaneId] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [chat, setChat] = useState(initialChat);

  const selectedPlaneIdRef = useRef(selectedPlaneId);

  useEffect(() => {
    selectedPlaneIdRef.current = selectedPlaneId;
  }, [selectedPlaneId]);

  useEffect(() => {
    const socket = io('http://localhost:3000', {
      withCredentials: true
    });

    socket.on('connect', () => {
      console.log('✅ Connected to backend');
    });

    socket.on('telemetry', (data) => {
      setPlanes(prev => {
        const index = prev.findIndex(p => p.id === data.aircraftId);
        if (index > -1) {
          const oldPlane = prev[index];
          // Simple heading calculation
          let newHeading = oldPlane.heading;
          if (data.lat !== oldPlane.lat || data.lng !== oldPlane.lng) {
             const dLon = (data.lng - oldPlane.lng);
             const y = Math.sin(dLon) * Math.cos(data.lat);
             const x = Math.cos(oldPlane.lat) * Math.sin(data.lat) - Math.sin(oldPlane.lat) * Math.cos(data.lat) * Math.cos(dLon);
             const brng = Math.atan2(y, x) * 180 / Math.PI;
             // This calculation is rough for small diffs but better than 0.
             // Actually, for very small updates, keeping old heading is safer to avoid jitter.
             // Let's just use data.heading if backend sends it, else keep old.
          }

          const updatedPlane = {
            ...oldPlane,
            lat: data.lat,
            lng: data.lng,
            speed: data.speed,
            altitude: data.altitude,
            // If backend provides heading later, use it. For now maintain old or random.
            heading: data.heading ?? oldPlane.heading, 
          };

          const newPlanes = [...prev];
          newPlanes[index] = updatedPlane;
          
          // Update history if selected
          if (data.aircraftId === selectedPlaneIdRef.current) {
            setHistoryData(h => {
               const newPoint = {
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                  speed: data.speed,
                  altitude: data.altitude
               };
               return [...h.slice(1), newPoint];
            });
          }

          return newPlanes;
        } else {
          // New plane
          return [...prev, {
            id: data.aircraftId,
            callsign: data.callsign || 'N/A',
            lat: data.lat,
            lng: data.lng,
            speed: data.speed,
            altitude: data.altitude,
            type: 'Unknown',
            heading: Math.floor(Math.random() * 360) // Initial random heading
          }];
        }
      });
    });

    socket.on('alert', (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 50));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

// Random sit. simulation (Chat only)
  useEffect(() => {
    const interval = setInterval(() => {
      const rand = Math.random();
      
      // %30 ihtimalle yeni sohbet
      if (rand < 0.3) {
        const newMsg = {
          user: Math.random() > 0.5 ? 'Pilot_XXX' : 'Operation',
          text: 'Location update received. Route is being confirmed',
          timestamp: new Date()
        };
        setChat(prev => [...prev, newMsg]);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectPlane = (plane) => {
    setSelectedPlaneId(plane.id);
    setHistoryData(generateTelemetryHistory(20)); // Create 20 minutes of past data
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
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full border border-gray-700">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs text-gray-300">Online</span>
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