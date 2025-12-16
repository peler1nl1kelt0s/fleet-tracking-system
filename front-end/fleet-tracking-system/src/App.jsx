import React, { useState, useEffect } from 'react';
// import { Plane } from 'lucide-react'; // İkonları sonra ekleyeceğiz
// Component importlarını henüz yapmadık, her şey burada
// import FleetMap from './components/FleetMap'; 
// import TelemetryChart from './components/TelemetryChart';
// import InfoPanel from './components/InfoPanel';
import './App.css'

// Mock Data importları (Data logic hazır kabul ediyoruz)
import { 
  generateInitialPlanes, 
  updatePlanePositions, 
  generateTelemetryHistory, 
  chatMessages as initialChat,
  alertTypes
} from './data/mockData';

function App() {
  const [planes, setPlanes] = useState([]);
  const [selectedPlaneId, setSelectedPlaneId] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  // Alert ve Chat state'lerini henüz UI'da kullanmıyoruz ama logic hazır
  const [alerts, setAlerts] = useState([]);
  const [chat, setChat] = useState(initialChat);

  useEffect(() => {
    // İlk yükleme
    setPlanes(generateInitialPlanes(30));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlanes(currentPlanes => updatePlanePositions(currentPlanes));
      
      // Basit veri simülasyonu
      if (selectedPlaneId) {
        setHistoryData(prev => {
          const last = prev[prev.length - 1];
          const newPoint = {
            time: new Date().toLocaleTimeString(),
            speed: last ? last.speed + (Math.random() * 20 - 10) : 800,
            altitude: last ? last.altitude + (Math.random() * 100 - 50) : 30000
          };
          return [...prev.slice(1), newPoint]; // Array'i sınırlamayı unuttuk (kasıtlı hata/eksik)
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedPlaneId]);

  const handleSelectPlane = (plane) => {
    setSelectedPlaneId(plane.id);
    console.log("Plane selected:", plane.id); // Debug için log bıraktık
    setHistoryData(generateTelemetryHistory(20));
  };

  return (
    <div className="p-5 bg-gray-800 text-white min-h-screen">
      <h1 className="text-2xl mb-4">SkyWatcher Dev Build v0.1</h1>
      
      <div className="grid grid-cols-2 gap-4">
        {/* MAP PLACEHOLDER */}
        <div className="border border-white p-4 h-[400px] bg-gray-700">
          <h2 className="font-bold">Map Component Will Be Here</h2>
          <p>Active Planes: {planes.length}</p>
          <ul className="h-64 overflow-auto mt-4 text-xs font-mono">
            {planes.map(p => (
              <li 
                key={p.id} 
                onClick={() => handleSelectPlane(p)}
                className={`cursor-pointer hover:text-blue-300 ${selectedPlaneId === p.id ? 'text-green-400' : ''}`}
              >
                [{p.id}] Lat: {p.lat.toFixed(2)}, Lng: {p.lng.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>

        {/* INFO & CHART PLACEHOLDER */}
        <div className="flex flex-col gap-4">
          <div className="border border-white p-4 h-[200px] bg-gray-700">
             <h2 className="font-bold">Telemetry Chart Area</h2>
             {selectedPlaneId ? (
               <div>
                 <p>Monitoring: {selectedPlaneId}</p>
                 <p>Data Points: {historyData.length}</p>
               </div>
             ) : <p>Select a plane to view data</p>}
          </div>

          <div className="border border-white p-4 h-[200px] bg-gray-700">
            <h2 className="font-bold">System Logs (Chat/Alerts)</h2>
            <div className="text-xs text-gray-400">
              {chat.length} messages loaded.
              <br/>
              UI implementation pending...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;