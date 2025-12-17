import React, { useState, useEffect, useRef } from 'react';
import Button from '../components/Button';
import { Plane, Moon, Sun, Settings } from 'lucide-react';
import io from 'socket.io-client';
import { Link } from 'react-router-dom';
import FleetMap from '../components/FleetMap';
import TelemetryChart from '../components/TelemetryChart';
import InfoPanel from '../components/InfoPanel';

import {
  chatMessages as initialChat,
  generateInitialPlanes,
  updatePlanePositions,
  alertTypes,
  chatMessages as mockChatMessages,
  generateTelemetryHistory
} from '../data/mockData';

const SOCKET_URL = import.meta.env.PROD ? '/' : 'http://localhost:3000';

function FleetView() {
  const [planes, setPlanes] = useState([]);
  const [selectedPlaneId, setSelectedPlaneId] = useState(null);
  const selectedPlaneIdRef = useRef(null); // Ref for access in socket callback
  const [historyData, setHistoryData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [chat, setChat] = useState(initialChat);
  const [isConnected, setIsConnected] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

  const useMockData = localStorage.getItem('useMockData') === 'true';

  // Theme State
  const [theme, setTheme] = useState(() => {
    if (localStorage.getItem('theme')) {
      return localStorage.getItem('theme');
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock Timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const socketRef = useRef(null);

  // Apply Theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    if (useMockData) {
      console.log('Mock Data Enabled');
      setPlanes(generateInitialPlanes(20));
      setIsConnected(true);

      // Simulation Interval
      const simulationInterval = setInterval(() => {
        setPlanes(prevPlanes => updatePlanePositions(prevPlanes));
      }, 2000);

      // Random Alerts
      const alertInterval = setInterval(() => {
        if (Math.random() > 0.7) {
          const randomAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
          setAlerts(prev => [{
            type: randomAlert.type,
            message: randomAlert.message,
            timestamp: Date.now()
          }, ...prev].slice(0, 50));
        }
      }, 8000);

      // Random Chat
      const chatInterval = setInterval(() => {
        if (Math.random() > 0.6) {
          const randomMsg = mockChatMessages[Math.floor(Math.random() * mockChatMessages.length)];
          setChat(prev => [...prev, {
            ...randomMsg,
            text: `${randomMsg.text} [${new Date().toLocaleTimeString()}]` 
          }]);
        }
      }, 12000);

      return () => {
        clearInterval(simulationInterval);
        clearInterval(alertInterval);
        clearInterval(chatInterval);
      };
    } else {
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
            status: 'normal',
            type: 'Unknown',
            lastUpdate: Date.now()
          };

          if (index > -1) {
            const newPlanes = [...prevPlanes];
            newPlanes[index] = { ...newPlanes[index], ...mappedPlane };
            return newPlanes;
          } else {
            return [...prevPlanes, mappedPlane];
          }
        });

        // Update History if Selected (Throttled to 5 mins)
        if (selectedPlaneIdRef.current && data.icao24 === selectedPlaneIdRef.current) {
          setHistoryData(prev => {
             const now = Date.now();
             // Use data timestamp if available, otherwise fallback to now
             const dataTs = data.timestamp ? new Date(data.timestamp).getTime() : (data.time_position ? data.time_position * 1000 : now);
             
             const lastPoint = prev[prev.length - 1];
             
             if (lastPoint && lastPoint.rawTimestamp) {
                if (dataTs - lastPoint.rawTimestamp < 30000) { // Throttled to 30 seconds
                   return prev; // Not enough time passed
                }
             }
             
             const newDataPoint = {
               time: new Date(dataTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
               speed: data.speed || 0,
               altitude: data.altitude || 0,
               rawTimestamp: dataTs
             };
             
             // Keep last ~7-10 points (30 mins / 5 mins = 6 points)
             return [...prev, newDataPoint].slice(-10);
          });
        }
      });

      socketRef.current.on('alert', (alert) => {
        setAlerts(prev => [{
          type: alert.type === 'SPEED' || alert.type === 'ALTITUDE' ? 'warning' : 'info',
          message: `${alert.message} - ${alert.aircraftId}`,
          timestamp: alert.timestamp
        }, ...prev].slice(0, 50));
      });
      
      // Listen for announcements
      socketRef.current.on('announcement', (announcement) => {
         setChat(prev => [...prev, {
           id: Date.now(),
           sender: 'ADMIN',
           message: announcement.message,
           text: announcement.message, // Add text property for InfoPanel
           timestamp: announcement.timestamp,
           isSystem: true
         }]);
      });

      return () => {
        if (socketRef.current) socketRef.current.disconnect();
      };
    }
  }, [useMockData]);

  // Fetch history when plane selected
  useEffect(() => {
    if (!selectedPlaneId) return;

    // Clear previous history
    setHistoryData([]);

    if (useMockData) {
      // Mock History
      const mockHistory = generateTelemetryHistory(20).map(d => ({
        ...d,
        // Ensure format matches chart expectation if needed, although generateTelemetryHistory already returns { time, speed, altitude }
      }));
      setHistoryData(mockHistory);
    } else {
      fetch(`http://localhost:3000/api/telemetry/${selectedPlaneId}?duration=1800&step=300`)
        .then(res => res.json())
        .then(data => {
          // Map API data to Chart format
          // API returns objects with timestamp, time_position etc.
          const mappedHistory = data.map(d => {
            const ts = d.timestamp || d.time_position * 1000 || Date.now();
            return {
              time: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              speed: d.speed,
              altitude: d.altitude,
              rawTimestamp: ts
            };
          }).reverse(); // API returns newest first (LIFO via lrange 0..N), chart usually L->R time

          setHistoryData(mappedHistory);
        })
        .catch(err => console.error("History fetch failed", err));
    }

  }, [selectedPlaneId, useMockData]);

  const handleSelectPlane = (plane) => {
    setSelectedPlaneId(plane.id);
    selectedPlaneIdRef.current = plane.id; // Update Ref
  };

  const selectedPlane = planes.find(p => p.id === selectedPlaneId);

  return (
    <main className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 overflow-hidden font-[family-name:var(--font-main)]">
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          role="button"
          aria-label="Kenar çubuğunu kapat"
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar Navigation */}
      <aside role="navigation" className={`fixed inset-y-0 left-0 bg-[var(--bg-secondary)]/80 backdrop-blur-xl border-r border-[var(--border-color)] flex flex-col transition-all duration-300 transform ${isSidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full w-0'} lg:relative lg:translate-x-0 lg:w-80 z-30 shadow-xl lg:${isSidebarOpen ? 'w-80' : 'w-16'}`}>
        <div className="h-16 flex items-center px-4 border-b border-[var(--border-color)] justify-between">
          <div className={`flex items-center gap-3 ${!isSidebarOpen && 'justify-center w-full'}`}>
            <div className="p-2 rounded-lg text-white bg-[var(--accent-color)]">
              <Plane size={20} />
            </div>
            {isSidebarOpen && <span className="font-bold text-lg tracking-tight">SkyWatcher</span>}
          </div>
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hidden lg:block"
            aria-label={isSidebarOpen ? 'Kenar çubuğunu kapat' : 'Kenar çubuğunu aç'}
            aria-expanded={isSidebarOpen}
          >
            <div className="w-1 h-4 bg-[var(--border-color)] rounded-full hover:bg-[var(--accent-color)] transition-colors"></div>
          </button>
        </div>

        {/* Status & Theme Toggle */}
        <div className={`px-4 py-4 flex flex-col gap-4 border-b border-[var(--border-color)] ${!isSidebarOpen && 'items-center'}`}>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className={`relative flex h-2.5 w-2.5`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              </span>
              {isSidebarOpen && <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)]">{isConnected ? 'Online' : 'Offline'}</span>}
            </div>

            <div className="flex gap-2">
              <Link to="/admin" className="p-1.5 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title="Admin Panel" aria-label="Admin Paneli">
                <Settings size={16} />
              </Link>
              <Button
                onClick={toggleTheme}
                className="p-1.5 rounded-md"
                title="Toggle Theme"
                variant="outline"
                aria-label={theme === 'dark' ? 'Koyu temayı aç' : 'Açık temayı aç'}
                aria-live="polite"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </Button>
            </div>
          </div>
        </div>

        {/* Info Panel Integration in Sidebar */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2">
          {isSidebarOpen ? (
            <InfoPanel alerts={alerts} chatMessages={chat} />
          ) : (
            <div className="flex flex-col gap-4 items-center mt-4">
              {/* Minimal Icons if needed */}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative">
        {/* Top Overlay Header for Map */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between pointer-events-none">
          <div className="pointer-events-auto"></div>
          <div className="bg-[var(--bg-secondary)]/90 backdrop-blur-md border border-[var(--border-color)] rounded-xl px-3 py-2 md:px-5 md:py-3 pointer-events-auto shadow-lg flex flex-col md:flex-row items-center md:gap-6 gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold">Active Aircraft</p>
              <p className="text-2xl font-black leading-none text-[var(--text-primary)]" aria-live="polite">{planes.length}</p>
            </div>
            <div className="h-8 w-px bg-[var(--border-color)]"></div>
            <div className="text-right">
              <p className="text-sm font-mono text-[var(--text-secondary)]">{currentTime.toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative z-0 bg-[var(--bg-tertiary)] w-full h-full">
          <FleetMap
            planes={planes}
            onSelectPlane={handleSelectPlane}
            selectedPlaneId={selectedPlaneId}
            theme={theme}
          />

          {/* Bottom Overlay for Telemetry */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-20 pointer-events-none">
            <div className="bg-[var(--bg-secondary)]/95 backdrop-blur-xl border border-[var(--border-color)] shadow-2xl rounded-2xl p-2 sm:p-4 pointer-events-auto max-w-full sm:max-w-xl md:max-w-3xl lg:max-w-5xl mx-auto transition-transform duration-300">
              <div className="flex justify-between items-center mb-2">
                <h3 id="telemetry-chart-title" className="text-sm font-bold text-[var(--text-secondary)] flex items-center gap-2 uppercase tracking-wide">
                  {selectedPlane ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-[var(--accent-color)]"></span>
                      {selectedPlane.callsign} Telemetry
                    </>
                  ) : 'Select an aircraft to view telemetry'}
                </h3>
              </div>
              {selectedPlane && (
                <div className="h-32 sm:h-40 md:h-48 mt-0 w-full">
                  <TelemetryChart data={historyData} selectedPlane={selectedPlane} theme={theme} />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </main>
  );
}

export default FleetView;
