import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();
export const HealthContext = createContext(null);

const T = {
  surface:    '#ffffff',
  border:     '#e4e8f5',
  text:       '#1a1f3c',
  emerald: '#10b981', 
  red:     '#ef4444',
};

export function HealthProvider({ children }) {
  const [healthData, setHealthData] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);
  const [clientStatus, setClientStatus] = useState('checking');
  const [alerts, setAlerts] = useState([]);
  const prevStatusRef = useRef({});
  const [directMlStatus, setDirectMlStatus] = useState('unknown');

  // Fallback direct check for ML service when Node is offline
  useEffect(() => {
    let interval;
    const checkDirectML = async () => {
      try {
        const res = await fetch('http://localhost:8500/health');
        if (res.ok) setDirectMlStatus('online');
        else setDirectMlStatus('offline');
      } catch (err) {
        setDirectMlStatus('offline');
      }
    };

    if (clientStatus === 'offline') {
      checkDirectML();
      interval = setInterval(checkDirectML, 5000);
    } else {
      setDirectMlStatus('unknown');
    }
    return () => clearInterval(interval);
  }, [clientStatus]);

  // Reactive alert system
  useEffect(() => {
    const newStatus = {
      backend: clientStatus === 'online' ? (healthData?.services?.server?.status || 'offline') : 'offline',
      database: clientStatus === 'online' ? (healthData?.services?.database?.status || 'offline') : 'unknown',
      ml: clientStatus === 'online' ? (healthData?.services?.ml?.status || 'offline') : directMlStatus,
      tunnel: clientStatus === 'online' ? (healthData?.services?.tunnel?.status || 'offline') : 'unknown'
    };

    const prev = prevStatusRef.current;
    const newAlerts = [];

    const serviceNames = {
      backend: 'Node.js Backend',
      database: 'MongoDB Database',
      ml: 'ML Service (Python)',
      tunnel: 'H100 Tunnel'
    };

    if (Object.keys(prev).length > 0) {
      for (const [key, name] of Object.entries(serviceNames)) {
        if (key === 'tunnel' && newStatus[key] === 'not_configured') continue;

        if (prev[key] && prev[key] !== newStatus[key]) {
          if (newStatus[key] === 'offline') {
            newAlerts.push({
              id: Date.now() + Math.random(),
              type: 'error',
              message: `⚠ ${name} disconnected. Attempting automatic reconnection...`
            });
          } else if (newStatus[key] === 'online') {
            newAlerts.push({
              id: Date.now() + Math.random(),
              type: 'success',
              message: `✓ ${name} reconnected successfully.`
            });
          }
        }
      }
    }

    if (newAlerts.length > 0) {
      setAlerts(curr => [...newAlerts, ...curr].slice(0, 3));
      newAlerts.forEach(alert => {
        setTimeout(() => {
          setAlerts(curr => curr.filter(a => a.id !== alert.id));
        }, 5000);
      });
    }

    prevStatusRef.current = newStatus;
  }, [clientStatus, healthData, directMlStatus]);

  useEffect(() => {
    const sse = new EventSource(`${apiUrl}/attendancemodule/health/stream`, { withCredentials: true });

    sse.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setHealthData(data);
        setLastCheck(new Date().toLocaleTimeString());
        setClientStatus('online');
      } catch (err) {}
    };

    sse.onerror = () => {
      setClientStatus('offline');
    };

    return () => sse.close();
  }, []);

  return (
    <HealthContext.Provider value={{ healthData, lastCheck, clientStatus, directMlStatus }}>
      {children}
      
      {/* Alerts Area - Now as floating pop-up toasts using Portals */}
      {alerts.length > 0 && typeof document !== 'undefined' && createPortal(
        <div style={{ 
          position: 'fixed', 
          bottom: 32, 
          right: 32, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 12, 
          zIndex: 2147483647 
        }}>
          {alerts.map(alert => (
            <div key={alert.id} style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderLeft: `4px solid ${alert.type === 'success' ? T.emerald : T.red}`,
              color: T.text,
              padding: '14px 20px', 
              borderRadius: 8, 
              fontSize: 14, 
              fontWeight: 600,
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              animation: 'fadeUp .3s ease both',
              minWidth: '300px',
              overflow: 'hidden',
              fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif"
            }}>
              <div style={{ color: alert.type === 'success' ? T.emerald : T.red, marginBottom: 4, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {alert.type === 'success' ? 'Connected' : 'Disconnected'}
              </div>
              {alert.message}
            </div>
          ))}
        </div>,
        document.body
      )}
    </HealthContext.Provider>
  );
}

export const useHealth = () => useContext(HealthContext);
