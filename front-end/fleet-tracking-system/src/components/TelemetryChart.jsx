import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TelemetryChart = ({ data, selectedPlane }) => {
  if (!selectedPlane) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 bg-gray-900/50 rounded-lg border border-gray-700">
        <p>To see datas please select a plane from the map.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-lg h-full flex flex-col">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">{selectedPlane.callsign} Telemetri</h2>
          <span className="text-xs text-gray-400">{selectedPlane.type} - {selectedPlane.status.toUpperCase()}</span>
        </div>
        <div className="text-right">
           <div className="text-sm text-blue-400 font-mono">Hız: {selectedPlane.speed} km/h</div>
           <div className="text-sm text-emerald-400 font-mono">Altitude: {selectedPlane.altitude} ft</div>
        </div>
      </div>
      
      <div className="flex-grow min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorAlt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="time" stroke="#9ca3af" tick={{fontSize: 12}} />
            <YAxis yAxisId="left" stroke="#3b82f6" tick={{fontSize: 12}} label={{ value: 'Hız (km/h)', angle: -90, position: 'insideLeft', fill: '#3b82f6' }} />
            <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{fontSize: 12}} label={{ value: 'İrtifa (ft)', angle: 90, position: 'insideRight', fill: '#10b981' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
            />
            <Area yAxisId="left" type="monotone" dataKey="speed" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSpeed)" name="Hız" animationDuration={500} />
            <Area yAxisId="right" type="monotone" dataKey="altitude" stroke="#10b981" fillOpacity={1} fill="url(#colorAlt)" name="İrtifa" animationDuration={500} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TelemetryChart;
