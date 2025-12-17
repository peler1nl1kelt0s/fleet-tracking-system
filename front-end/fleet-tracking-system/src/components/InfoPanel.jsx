import React, { useRef, useEffect } from 'react';
import { MessageSquare, AlertTriangle, Activity } from 'lucide-react';

const InfoPanel = ({ alerts, chatMessages }) => {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* Alerts Section */}
      <div className="flex-1 min-h-[200px] flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="text-[var(--warning-color)]" size={16} />
          <h2 className="text-sm font-semibold text-[var(--text-secondary)]">System Alerts</h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar bg-[var(--bg-tertiary)] rounded-lg p-2 border border-[var(--border-color)]">
          {alerts.length === 0 ? (
            <div className="text-[var(--text-muted)] text-xs text-center py-4">No active alerts</div>
          ) : (
            alerts.map((alert, idx) => {
              const isCritical = /EMERGENCY|HIJACK|7700|7500/.test(alert.message?.toUpperCase());
              
              return (
                <div key={idx} className={`p-2 rounded border-l-4 text-xs ${
                  isCritical 
                    ? 'border-red-600 bg-red-500/10' 
                    : 'border-[var(--border-color)] bg-[var(--bg-primary)]'
                }`}>
                  <div className="flex justify-between items-start gap-2">
                    <span className={`font-medium ${isCritical ? 'text-red-500 font-bold uppercase animate-pulse' : 'text-[var(--text-primary)]'}`}>
                      {alert.message}
                    </span>
                    <span className="text-[10px] opacity-70 whitespace-nowrap text-[var(--text-muted)]">
                      {new Date(alert.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat/Log Section */}
      <div className="flex-1 min-h-[250px] flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="text-[var(--accent-color)]" size={16} />
          <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Live Comms</h2>
          <Activity className="ml-auto text-[var(--success-color)] animate-pulse" size={14} />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar bg-[var(--bg-tertiary)] rounded-lg p-2 border border-[var(--border-color)]">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className="flex flex-col">
              <div className="flex items-baseline justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${msg.user === 'Kule' ? 'text-[var(--warning-color)]' :
                    msg.user === 'Sistem' ? 'text-[var(--danger-color)]' : 'text-[var(--accent-color)]'
                  }`}>
                  {msg.user}
                </span>
                <span className="text-[9px] text-[var(--text-muted)]">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
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
