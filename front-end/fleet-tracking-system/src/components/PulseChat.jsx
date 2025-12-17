import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';
import Button from './Button';
import Input from './Input';
import './PulseChat.css';

const PulseChat = () => {
  const { showToast } = useToast();
  // UI State
  const [callsign, setCallsign] = useState('');
  const [activeCallsign, setActiveCallsign] = useState(null);
  const [status, setStatus] = useState('IDLE'); // IDLE, LOADING, ACTIVE, LANDED, ERROR
    
  // Data State
  const [telemetry, setTelemetry] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  // Refs for polling intervals
  const telemetryInterval = useRef(null);
  const chatInterval = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, []);

  const stopPolling = () => {
    if (telemetryInterval.current) clearInterval(telemetryInterval.current);
    if (chatInterval.current) clearInterval(chatInterval.current);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!callsign.trim()) return;

    setStatus('LOADING');
    stopPolling();

    try {
      // Initial fetch to verify aircraft exists and get status
      const response = await fetch(`/api/telemetry/${callsign}`);
      if (!response.ok) throw new Error('Aircraft not found or not active');
      
      const data = await response.json();
      
      if (data.on_ground) {
        setStatus('ERROR');
        showToast('Aircraft is currently on the ground. Chat is not active.', 'error');
      } else {
        setActiveCallsign(callsign);
        setTelemetry(data);
        setStatus('ACTIVE');
        startPolling(callsign);
      }
    } catch (err) {
      setStatus('ERROR');
      showToast(err.message, 'error');
    }
  };

  const startPolling = (targetCallsign) => {
    // Poll Telemetry (e.g., every 2 seconds)
    telemetryInterval.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/telemetry/${targetCallsign}`);
        if (res.ok) {
          const data = await res.json();
          setTelemetry(data);

          // Auto-Cleanup Logic: Check if landed
          if (data.on_ground) {
            handleLanding();
          }
        }
      } catch (error) {
        console.warn('Telemetry poll failed', error);
      }
    }, 2000);

    // Poll Messages (e.g., every 1 second)
    chatInterval.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/${targetCallsign}/messages`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (error) {
        console.warn('Chat poll failed', error);
      }
    }, 1000);
  };

  const handleLanding = () => {
    stopPolling();
    setStatus('LANDED');
    // Add a local system message for immediate feedback
    setMessages(prev => [
      ...prev, 
      { type: 'system', content: 'Aircraft has landed. Chat closed.', timestamp: new Date().toISOString() }
    ]);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || status !== 'ACTIVE') return;

    try {
      await fetch(`/api/chat/${activeCallsign}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: inputText })
      });
      setInputText('');
      // Optimistic update or wait for next poll
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  // --- RENDER HELPERS ---

  const renderContextPanel = () => {
    if (!telemetry) return null;
    return (
      <div className="pulse-context-panel">
        <div className="panel-item">
          <span className="label">CALLSIGN</span>
          <span className="value">{activeCallsign}</span>
        </div>
        <div className="panel-item">
          <span className="label">SPEED</span>
          <span className="value">{Math.round(telemetry.speed)} kts</span>
        </div>
        <div className="panel-item">
          <span className="label">ALTITUDE</span>
          <span className="value">{Math.round(telemetry.altitude)} ft</span>
        </div>
        <div className="panel-item">
          <span className="label">STATUS</span>
          <span className={`value status-${telemetry.on_ground ? 'ground' : 'air'}`}>
            {telemetry.on_ground ? 'ON GROUND' : 'AIRBORNE'}
          </span>
        </div>
        {!telemetry.on_ground && (
          <div className="panel-item">
            <span className="label">EST. LANDING</span>
            <span className="value">{telemetry.eta || '--:--'}</span>
          </div>
        )}
      </div>
    );
  };

  if (status === 'IDLE' || status === 'ERROR') {
    return (
      <div className="pulse-chat-container centered">
        <div className="pulse-entry">
          <h2>Pulse Chat</h2>
          <p>Enter aircraft callsign to join the live stream.</p>
          <form onSubmit={handleSearch}>
            <Input 
              type="text" 
              placeholder="e.g. TK202" 
              value={callsign}
              onChange={(e) => setCallsign(e.target.value.toUpperCase())}
              className="mb-2"
            />
            <Button type="submit" disabled={status === 'LOADING'} variant="primary">
              {status === 'LOADING' ? 'Searching...' : 'Connect'}
            </Button>
          </form>

        </div>
      </div>
    );
  }

  return (
    <div className="pulse-chat-container">
      {/* CONTEXT PANEL */}
      {renderContextPanel()}

      {/* CHAT WINDOW */}
      <div className="pulse-chat-window">
        <div className="messages-list">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message-row ${msg.type === 'system' ? 'system-msg' : 'user-msg'}`}>
              {msg.type !== 'system' && <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
              <span className="content">{msg.content}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT AREA */}
        <div className="input-area">
          {status === 'LANDED' ? (
            <div className="system-banner">
              Aircraft has landed. Chat closed.
            </div>
          ) : (
            <form onSubmit={sendMessage} className="flex gap-2">
              <Input 
                type="text" 
                placeholder="Type a message..." 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                autoFocus
                className="flex-grow"
              />
              <Button type="submit" variant="primary">Send</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PulseChat;