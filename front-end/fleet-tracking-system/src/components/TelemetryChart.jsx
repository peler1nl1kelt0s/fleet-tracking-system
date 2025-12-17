import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TelemetryChart = ({ data, selectedPlane, theme }) => {
  if (!selectedPlane) return null;

  // Dynamic colors based on theme
  const axisColor = theme === 'dark' ? '#a1a1aa' : '#64748b'; // Zinc 400 : Slate 500
  const gridColor = theme === 'dark' ? '#27272a' : '#e2e8f0'; // Zinc 800 : Slate 200
  const tooltipBg = theme === 'dark' ? '#18181b' : '#ffffff';
  const tooltipBorder = theme === 'dark' ? '#27272a' : '#e2e8f0';
  const tooltipText = theme === 'dark' ? '#fafafa' : '#0f172a';

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-grow min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: -20,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme === 'dark' ? '#818cf8' : '#3b82f6'} stopOpacity={0.3} />
                <stop offset="95%" stopColor={theme === 'dark' ? '#818cf8' : '#3b82f6'} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorAlt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="time" stroke={axisColor} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="left" stroke={theme === 'dark' ? '#818cf8' : '#3b82f6'} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText, fontSize: '12px', borderRadius: '8px' }}
              itemStyle={{ fontSize: '12px' }}
            />
            <Area yAxisId="left" type="monotone" dataKey="speed" stroke={theme === 'dark' ? '#818cf8' : '#3b82f6'} strokeWidth={2} fillOpacity={1} fill="url(#colorSpeed)" name="Speed" animationDuration={500} />
            <Area yAxisId="right" type="monotone" dataKey="altitude" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorAlt)" name="Altitude" animationDuration={500} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TelemetryChart;
