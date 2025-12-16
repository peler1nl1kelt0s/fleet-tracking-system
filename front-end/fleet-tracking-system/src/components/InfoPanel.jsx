import React, { useRef, useEffect } from 'react';
import { MessageSquare, AlertTriangle, Activity } from 'lucide-react';

const InfoPanel = ({ alerts, chatMessages }) => {
  const chatEndRef = useRef(null);

  // Auto-Scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <div className="grid grid-rows-2 gap-4 h-full">
      
      {/* Live Warns */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 flex flex-col shadow-lg overflow-hidden">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700">
          <AlertTriangle className="text-amber-500" size={20} />
          <h2 className="text-lg font-bold text-white">Live Warns</h2>
          <span className="ml-auto flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </div>
        
        <div className="overflow-y-auto pr-2 space-y-2 flex-grow custom-scrollbar">
          {alerts.map((alert, idx) => (
            <div key={idx} className={`p-3 rounded-md border-l-4 ${
              alert.type === 'critical' ? 'bg-red-900/20 border-red-500 text-red-200' :
              alert.type === 'warning' ? 'bg-amber-900/20 border-amber-500 text-amber-200' :
              'bg-blue-900/20 border-blue-500 text-blue-200'
            }`}>
              <div className="flex justify-between items-start">
                <span className="font-medium text-sm">{alert.message}</span>
                <span className="text-xs opacity-70 whitespace-nowrap ml-2">
                  {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          ))}
          {alerts.length === 0 && <div className="text-gray-500 text-center py-4">Sistem normal. Uyarı yok.</div>}
        </div>
      </div>

      {/* Nabız Sohbet */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 flex flex-col shadow-lg overflow-hidden">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700">
          <MessageSquare className="text-blue-400" size={20} />
          <h2 className="text-lg font-bold text-white">Nabız Sohbet</h2>
          <Activity className="ml-auto text-green-500 animate-pulse" size={16} />
        </div>

        <div className="overflow-y-auto pr-2 space-y-3 flex-grow custom-scrollbar">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className={`text-xs font-bold ${
                  msg.user === 'Kule' ? 'text-yellow-400' : 
                  msg.user === 'Sistem' ? 'text-red-400' : 'text-blue-400'
                }`}>
                  {msg.user}
                </span>
                <span className="text-[10px] text-gray-500">
                  {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <p className="text-sm text-gray-300 bg-gray-800/50 p-2 rounded mt-1">
                {msg.text}
              </p>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>

    </div>
  );
};

export default InfoPanel;
