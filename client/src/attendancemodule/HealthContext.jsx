import React, { createContext, useContext, useState, useEffect } from 'react';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();
export const HealthContext = createContext(null);

export function HealthProvider({ children }) {
  const [healthData, setHealthData] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);
  const [clientStatus, setClientStatus] = useState('checking');
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
    </HealthContext.Provider>
  );
}

export const useHealth = () => useContext(HealthContext);
