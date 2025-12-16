import React, { useState, useEffect } from 'react';
import { Plane } from 'lucide-react';
import FleetMap from './components/FleetMap';
import TelemetryChart from './components/TelemetryChart';
import InfoPanel from './components/InfoPanel';

import { 
  chatMessages as initialChat,
  generateInitialPlanes // Mock data generator
} from './data/mockData';

function App() {
  const [planes, setPlanes] = useState([]);
  const [selectedPlaneId, setSelectedPlaneId] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [chat, setChat] = useState(initialChat);

  useEffect(() => {
    setPlanes(generateInitialPlanes(10));
  }, []);

  const handleSelectPlane = (plane) => {
    setSelectedPlaneId(plane.id);
  };

  const selectedPlane = planes.find(p => p.id === selectedPlaneId);

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white font-sans overflow-hidden">
      
      {/* Header - Statik versiyon */}
      <header className="h-16 bg-gray-900WB border-b border-gray-800 flex items-center px-4 sm:px-6 shadow-md z-20 flex-shrink-0">
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
             <span className="text-xs text-gray-400">System Ready</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 overflow-y-auto lg:overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:h-full">
          
          <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full">
            <div className="h-[400px] lg:h-auto lg:flex-grow rounded-xl overflow-hidden shadow-2xl border border-gray-800 relative group z-0">
               <FleetMap 
                 planes={planes} 
                 onSelectPlane={handleSelectPlane}
                 selectedPlaneId={selectedPlaneId}
               />
            </div>
            <div className="h-64 flex-shrink-0">
               {/* Chart Placeholder */}
               <div className="h-full bg-gray-900 rounded-xl flex items-center justify-cenwr border border-gray-800">
                  <p className="text-gray-500">Telemetry Chart Component</p>
               </div>
            </div>
          </div>

          <div className="lg:col-span-1 h-[600px] lg:h-full overflow-hidden">
            <InfoPanel alerts={alerts} chatMessages={chat} />
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;