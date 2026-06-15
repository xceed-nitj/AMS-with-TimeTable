import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useHealth } from './HealthContext';

const T = {
  surface:   '#ffffff',
  border:    '#e4e8f5',
  text:      '#1a1f3c',
  textMuted: '#7b84ab',
  fontMono:  "'IBM Plex Mono', monospace",
  fontBody:  "'IBM Plex Sans', 'Segoe UI', sans-serif",
  emerald: '#10b981', emeraldDim: 'rgba(16,185,129,0.09)',
  red:     '#ef4444', redDim:     'rgba(239,68,68,0.09)',
  amber:   '#f59e0b', amberDim:   'rgba(245,158,11,0.09)',
  gray:    '#9ca3af', grayDim:    'rgba(156,163,175,0.09)',
};

function StatusDot({ status, size = 7 }) {
  let color = T.gray;
  if (status === 'online')   color = T.emerald;
  if (status === 'offline')  color = T.red;
  if (status === 'checking') color = T.amber;

  return (
    <span style={{
      display: 'inline-block', width: size, height: size, borderRadius: '50%',
      background: color, flexShrink: 0,
      boxShadow: status === 'online' ? `0 0 6px ${color}80` : 'none',
      animation: status === 'checking' ? 'pulse 1.5s ease-in-out infinite' : 'none',
    }} />
  );
}

function ServiceButton({ label, status, details }) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);
  const dropId = `health-drop-${label}`;

  const handleClick = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    }
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      const drop = document.querySelector(`[data-health-drop="${dropId}"]`);
      if (
        (btnRef.current && btnRef.current.contains(e.target)) ||
        (drop && drop.contains(e.target))
      ) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, dropId]);

  let statusColor = T.gray;
  let statusText  = 'Unknown';
  let dimColor    = T.grayDim;

  if (status === 'online')          { statusColor = T.emerald; statusText = 'Online';        dimColor = T.emeraldDim; }
  else if (status === 'offline')    { statusColor = T.red;     statusText = 'Offline';       dimColor = T.redDim;     }
  else if (status === 'checking')   { statusColor = T.amber;   statusText = 'Checking…';    dimColor = T.amberDim;   }
  else if (status === 'not_configured') { statusText = 'Not Configured'; }

  const validDetails = details.filter(Boolean);

  return (
    <div style={{ flexShrink: 0 }}>
      <button
        ref={btnRef}
        onClick={handleClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: T.surface,
          border: `1px solid ${open ? '#c7cde8' : T.border}`,
          borderRadius: 9, padding: '7px 11px',
          boxShadow: '0 1px 4px rgba(26,31,60,0.06)',
          cursor: 'pointer', fontFamily: T.fontBody,
          transition: 'border-color .15s',
        }}
      >
        <StatusDot status={status} />
        <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{label}</span>
        <span style={{
          fontSize: 9, color: T.textMuted, lineHeight: 1,
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s',
        }}>▾</span>
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          data-health-drop={dropId}
          style={{
            position: 'fixed',
            top: dropPos.top,
            right: dropPos.right,
            width: 220,
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(26,31,60,0.12)',
            zIndex: 2147483647,
            animation: 'dropDown .18s ease both',
            overflow: 'hidden',
            fontFamily: T.fontBody,
          }}
        >
          <div style={{
            padding: '9px 14px',
            borderBottom: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <StatusDot status={status} size={8} />
              <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{label}</span>
            </div>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 4,
              background: dimColor, color: statusColor,
              textTransform: 'uppercase', letterSpacing: '.05em',
            }}>
              {statusText}
            </span>
          </div>

          {validDetails.map((d, i) => (
            <div key={i} style={{
              padding: '8px 14px',
              borderBottom: i < validDetails.length - 1 ? `1px solid ${T.border}` : 'none',
              fontSize: 11, color: T.textMuted, fontFamily: T.fontMono,
            }}>
              {d}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

export default function HealthDashboard() {
  const { healthData, lastCheck, clientStatus, directMlStatus } = useHealth();
  const clientVersion = 'v1.0.4';

  const svc = {
    server:   clientStatus === 'online' ? (healthData?.services?.server?.status   || 'offline') : 'offline',
    ml:       clientStatus === 'online' ? (healthData?.services?.ml?.status       || 'offline') : directMlStatus,
    database: clientStatus === 'online' ? (healthData?.services?.database?.status || 'offline') : 'unknown',
    tunnel:   clientStatus === 'online' ? (healthData?.services?.tunnel?.status   || 'unknown') : 'unknown',
  };

  const formatUptime = (s) => {
    if (!s) return '0s';
    const d = Math.floor(s / (3600 * 24));
    const h = Math.floor(s % (3600 * 24) / 3600);
    const m = Math.floor(s % 3600 / 60);
    return `${d > 0 ? d + 'd ' : ''}${h}h ${m}m`;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

      <ServiceButton
        label="Client"
        status="online"
        details={[
          `Version ${clientVersion}`,
          lastCheck ? `Last check: ${lastCheck}` : null,
        ]}
      />

      <ServiceButton
        label="Server"
        status={svc.server}
        details={[
          clientStatus === 'online'
            ? `Uptime: ${formatUptime(healthData?.services?.server?.uptime)}`
            : 'Backend unreachable',
        ]}
      />

      <ServiceButton
        label="ML"
        status={svc.ml}
        details={[
          clientStatus === 'online'
            ? `Latency: ${healthData?.services?.ml?.latency ? healthData.services.ml.latency + 'ms' : '—'}`
            : '—',
        ]}
      />

      <ServiceButton
        label="MongoDB"
        status={svc.database}
        details={[
          clientStatus === 'online' && healthData?.services?.database?.status === 'online'
            ? 'Connected'
            : 'Unreachable',
        ]}
      />

      <ServiceButton
        label="H100"
        status={svc.tunnel}
        details={[
          svc.tunnel === 'not_configured' ? 'Not configured' : 'Proxy active',
        ]}
      />

    </div>
  );
}
