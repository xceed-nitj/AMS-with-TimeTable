import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { theme, styles, cssReset } from './config';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();

function Toast({ toast }) {
  if (!toast) return null;
  const isErr = toast.type === 'error';
  return (
    <div style={{
      position: 'fixed', top: 20, right: 20, zIndex: 9999,
      padding: '12px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700,
      background: isErr ? theme.dangerDim : theme.successDim,
      color:      isErr ? theme.danger     : theme.success,
      border: `1px solid ${isErr ? theme.danger : theme.success}`,
      animation: 'fadeIn .3s', maxWidth: 420,
    }}>{toast.msg}</div>
  );
}

function SectionHead({ title, sub, color }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 3, height: 18, borderRadius: 2, background: color || theme.accent }} />
        <span style={{ fontWeight: 700, fontSize: 15, color: theme.text }}>{title}</span>
      </div>
      {sub && <div style={{ fontSize: 11, color: theme.textMuted, paddingLeft: 11, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

const PERIOD_KEYS = [
  'period1','period2','period3','period4',
  'period5','period6','period7','period8'
];

const SLOT_LABELS = {
  period1: 'Period 1 — 08:30',
  period2: 'Period 2 — 09:30',
  period3: 'Period 3 — 10:30',
  period4: 'Period 4 — 11:30',
  period5: 'Period 5 — 13:30',
  period6: 'Period 6 — 14:30',
  period7: 'Period 7 — 15:30',
  period8: 'Period 8 — 16:30',
};

function todayStr() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
}

export default function LiveReportPage() {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [acquisitionActive, setAcquisitionActive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeSlot, setActiveSlot] = useState(null);
  const [activeDate, setActiveDate] = useState(null);

  const fetchLiveStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/attendancemodule/scheduler/live-status?_t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch live status');
      }
      const data = await res.json();
      setRooms(data.rooms || []);
      setAcquisitionActive(data.acquisitionActive);
      setActiveSlot(data.slot);
      setActiveDate(data.date);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchLiveStatus]);

  const handleCardClick = (roomData) => {
    navigate(`/attendance/reports`, { 
      state: { 
        prefillDate: activeDate, 
        prefillSlot: activeSlot,
        prefillRoom: roomData.room 
      }
    });
  };

  return (
    <div style={{ ...styles.page, position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: cssReset }} />
      <Toast toast={toast} />

      <div className="ams-page-header">
        <div>
          <div style={styles.heading}>Live Attendance Dashboard</div>
          <div style={styles.subheading}>
            Monitor active attendance runs in real-time across all classrooms.
            {activeSlot && activeDate && (
              <span style={{ marginLeft: 8, fontWeight: 600, color: theme.primary }}>
                ({SLOT_LABELS[activeSlot] || activeSlot} - {activeDate})
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: theme.textMuted }}>
                Last updated: {lastUpdated || 'Never'}
            </span>
            <button
              onClick={fetchLiveStatus}
              style={{
                  ...styles.btnGhost,
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
              }}
            >
              ↻ Refresh
            </button>
        </div>
      </div>

      {!acquisitionActive && (
        <div style={{
          background: theme.dangerDim, color: theme.danger, padding: '12px 16px',
          borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 24, border: `1px solid ${theme.danger}40`
        }}>
          ⚠️ Global Acquisition is currently OFF. No new ML runs will be executed.
        </div>
      )}

      {!activeSlot && !loading && (
        <div style={{ textAlign: 'center', padding: 40, color: theme.textMuted, fontSize: 14 }}>
          No active lecture period at this time.
        </div>
      )}

      {activeSlot && rooms.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: 40, color: theme.textMuted, fontSize: 14 }}>
          No enabled classrooms found or no active cameras available.
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 16
      }}>
        {rooms.map((r, i) => {
          const isSkipped = r.status === 'skipped';
          const hasCtx = !!r.ctx;
          const isCompleted = hasCtx && r.runsCompleted >= r.targetRuns;
          const statusText = isSkipped 
            ? 'Skipped' 
            : r.status === 'finalized' 
                ? 'Finalized'
                : isCompleted
                    ? 'Completed'
                    : 'Running / Draft';
                
          const pct = r.lastRecord ? r.lastRecord.attendancePct : 0;
          
          return (
            <div 
              key={i} 
              onClick={() => hasCtx && !isSkipped ? handleCardClick(r) : null}
              style={{
                ...styles.card, 
                padding: '16px 20px',
                cursor: (hasCtx && !isSkipped) ? 'pointer' : 'default',
                opacity: isSkipped ? 0.6 : 1,
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: theme.text }}>
                    {r.room}
                  </div>
                  {hasCtx && (
                    <div style={{ fontSize: 12, color: theme.accent, fontWeight: 600, marginTop: 4, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                      {r.ctx.subject} • {r.ctx.batch}
                    </div>
                  )}
                </div>
                
                <div style={{
                  flexShrink: 0,
                  fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 4,
                  background: isSkipped ? theme.border : (r.status === 'finalized' || isCompleted ? theme.successDim : theme.accent + '20'),
                  color: isSkipped ? theme.textMuted : (r.status === 'finalized' || isCompleted ? theme.success : theme.accent)
                }}>
                  {statusText}
                </div>
              </div>

              {isSkipped ? (
                <div style={{ fontSize: 13, color: theme.danger }}>{r.reason || 'No Class Scheduled'}</div>
              ) : hasCtx ? (
                <div>
                  <div style={{ fontSize: 13, color: theme.text, marginBottom: 12 }}>
                    Faculty: {r.ctx.faculty || 'Unknown'}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: theme.textMuted }}>
                      Runs: <strong style={{ color: theme.text }}>{r.runsCompleted}</strong> / {r.targetRuns}
                    </div>
                    {r.lastRecord && (
                      <div style={{ fontSize: 12, display: 'flex', gap: 12 }}>
                        <span style={{ color: theme.success }}>P: {r.lastRecord.present}</span>
                        <span style={{ color: theme.danger }}>A: {r.lastRecord.absent}</span>
                        <span style={{ fontWeight: 600, color: theme.text }}>{pct}%</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Progress bar */}
                  <div style={{ width: '100%', height: 4, background: theme.border, borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${Math.min(100, (r.runsCompleted / (r.targetRuns || 1)) * 100)}%`, 
                      height: '100%', 
                      background: r.status === 'finalized' ? theme.success : theme.accent,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: theme.textMuted }}>Initializing...</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
