import React from 'react';
import { useHealth } from './HealthContext';

const T = {
  surface:    '#ffffff',
  border:     '#e4e8f5',
  text:       '#1a1f3c',
  textMuted:  '#7b84ab',
  fontMono:   "'IBM Plex Mono', monospace",
  fontBody:   "'IBM Plex Sans', 'Segoe UI', sans-serif",
  emerald: '#10b981', emeraldDim: 'rgba(16,185,129,0.09)',
  red:     '#ef4444', redDim:     'rgba(239,68,68,0.09)',
  amber:   '#f59e0b', amberDim:   'rgba(245,158,11,0.09)',
  gray:    '#9ca3af', grayDim:    'rgba(156,163,175,0.09)',
};

function StatusIndicator({ status }) {
  let color = T.gray;
  if (status === 'online') color = T.emerald;
  else if (status === 'offline') color = T.red;
  else if (status === 'checking') color = T.amber;

  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: color, flexShrink: 0,
      boxShadow: status === 'online' ? `0 0 6px ${color}80` : 'none',
      animation: status === 'checking' ? 'pulse 1.5s ease-in-out infinite' : 'none',
    }} />
  );
}

function ServiceCard({ label, details, status }) {
  let bgColor = T.grayDim;
  let textColor = T.gray;
  let statusText = 'Not Configured';

  if (status === 'online') { bgColor = T.emeraldDim; textColor = T.emerald; statusText = 'Online'; }
  else if (status === 'offline') { bgColor = T.redDim; textColor = T.red; statusText = 'Offline'; }
  else if (status === 'checking') { bgColor = T.amberDim; textColor = T.amber; statusText = 'Checking...'; }
  else if (status === 'unknown') { bgColor = T.grayDim; textColor = T.gray; statusText = 'Unknown'; }

  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 8,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flex: 1,
      minWidth: '180px'
    }}>
      <StatusIndicator status={status} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 11, color: T.textMuted, fontFamily: T.fontMono }}>{details || '—'}</div>
      </div>
      <div style={{
        fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6,
        background: bgColor, color: textColor, textTransform: 'uppercase', letterSpacing: '.05em'
      }}>
        {statusText}
      </div>
    </div>
  );
}

export default function HealthDashboard() {
  const { healthData, lastCheck, clientStatus, directMlStatus } = useHealth();
  const clientVersion = "v1.0.4";

  const formatUptime = (seconds) => {
    if (!seconds) return '0s';
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    return `${d > 0 ? d + 'd ' : ''}${h}h ${m}m`;
  };

  return (
    <div style={{ marginBottom: 24, animation: 'fadeUp .4s ease both', fontFamily: T.fontBody }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: T.textMuted,
        textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 10
      }}>
        System Health & Monitoring
      </div>

      {/* Services Grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        
        {/* React Client */}
        <ServiceCard 
          label="Client" 
          details={`Version ${clientVersion} · Check: ${lastCheck || '—'}`}
          status={'online'}
        />

        {/* Node.js Backend */}
        <ServiceCard 
          label="Server" 
          details={clientStatus === 'online' ? `Uptime: ${formatUptime(healthData?.services?.server?.uptime)}` : 'Backend unreachable'}
          status={clientStatus === 'online' ? (healthData?.services?.server?.status || 'offline') : 'offline'}
        />

        {/* Python ML Service */}
        <ServiceCard 
          label="ML Service" 
          details={clientStatus === 'online' ? `Latency: ${healthData?.services?.ml?.latency ? healthData.services.ml.latency + 'ms' : '—'}` : '—'}
          status={clientStatus === 'online' ? (healthData?.services?.ml?.status || 'offline') : directMlStatus}
        />

        {/* MongoDB */}
        <ServiceCard 
          label="MongoDB" 
          details={clientStatus === 'online' && healthData?.services?.database?.status === 'online' ? 'Connected' : '—'}
          status={clientStatus === 'online' ? (healthData?.services?.database?.status || 'offline') : 'unknown'}
        />

        {/* H100 Tunnel */}
        <ServiceCard 
          label="H100 Tunnel" 
          details={healthData?.services?.tunnel?.status === 'not_configured' ? '' : 'Proxy status'}
          status={clientStatus === 'online' ? (healthData?.services?.tunnel?.status || 'unknown') : 'unknown'}
        />

      </div>
    </div>
  );
}
