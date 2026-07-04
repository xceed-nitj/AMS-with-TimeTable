import React, { useState, useRef } from 'react';
import { theme } from './config';
import getEnvironment from '../getenvironment';

const T = theme;
const apiUrl = getEnvironment();
const GATE_API = `${apiUrl}/attendancemodule/institute`;

export default function InstituteGateIdentification() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [streamLog, setStreamLog] = useState([]);
  const [liveFrame, setLiveFrame] = useState(null);
  const [markedStudents, setMarkedStudents] = useState({});
  const [runsCompleted, setRunsCompleted] = useState(0);
  const [totalRuns, setTotalRuns] = useState(0);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [zoomSnapshot, setZoomSnapshot] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setProcessing(false);
      setStreamLog(prev => [...prev, { type: 'error', message: 'Processing stopped by user.', time: new Date().toLocaleTimeString() }]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
      setSummary(null);
      setMarkedStudents({});
      setStreamLog([]);
      setLiveFrame(null);
      setRunsCompleted(0);
      setTotalRuns(0);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a video file first.");
      return;
    }

    setProcessing(true);
    setStreamLog([{ type: 'info', message: 'Starting video upload and processing...', time: new Date().toLocaleTimeString() }]);
    setMarkedStudents({});
    setSummary(null);
    setError(null);
    setRunsCompleted(0);
    setTotalRuns(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      abortControllerRef.current = new AbortController();
      
      // We will manually fetch and read the stream directly from Python ML service to bypass any node proxy buffering
      const response = await fetch(`http://127.0.0.1:8500/identify-institute-video`, {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
          const chunk = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 2);
          boundary = buffer.indexOf('\n\n');

          if (chunk.startsWith('data: ')) {
            try {
              const data = JSON.parse(chunk.substring(6));
              
              if (data.type === 'stage') {
                setStreamLog(prev => [...prev, { type: 'info', message: data.message, time: new Date().toLocaleTimeString() }]);
              } else if (data.type === 'marked') {
                setMarkedStudents(prev => ({
                  ...prev,
                  [data.roll]: { score: data.score, time: data.time, evidence: data.evidence }
                }));
                setStreamLog(prev => [...prev, { type: 'success', message: `Recognized ${data.roll} (${data.score})`, time: new Date().toLocaleTimeString() }]);
              } else if (data.type === 'snapshot') {
                if (data.image) {
                  setLiveFrame(`data:image/jpeg;base64,${data.image}`);
                }
                setRunsCompleted(data.run);
                if (data.total_runs) setTotalRuns(data.total_runs);
                if (data.marked) {
                  setMarkedStudents(data.marked);
                }
                setStreamLog(prev => [...prev, { type: 'success', message: `Processed snapshot ${data.run}`, time: new Date().toLocaleTimeString() }]);
              } else if (data.type === 'error') {
                setError(data.message);
                setProcessing(false);
              } else if (data.type === 'done') {
                setSummary(data.result.summary);
                if (data.result.marked) {
                   setMarkedStudents(data.result.marked);
                }
                setProcessing(false);
                setStreamLog(prev => [...prev, { type: 'info', message: 'Processing complete.', time: new Date().toLocaleTimeString() }]);
                abortControllerRef.current = null;
              }
            } catch (err) {
              console.error("Error parsing SSE chunk", err, chunk);
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log("Fetch aborted");
        return;
      }
      console.error(err);
      setError(err.message || "An error occurred during processing.");
      setProcessing(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: T.text, marginBottom: '8px' }}>Institute Identification</h1>
      <p style={{ color: T.textMuted, marginBottom: '24px' }}>Identify students using the FAISS model.</p>

      {error && (
        <div style={{ padding: '12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Left Column: Upload and Log */}
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Upload Card */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: `1px solid ${T.border}`, boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Video Source</h2>
            
            <input 
              type="file" 
              accept="video/*" 
              onChange={handleFileChange}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
            
            <div 
              onClick={() => !processing && fileInputRef.current.click()}
              style={{ 
                border: `2px dashed ${file ? T.accent : T.border}`,
                borderRadius: '8px',
                padding: '32px 16px',
                textAlign: 'center',
                cursor: processing ? 'not-allowed' : 'pointer',
                background: processing ? '#f8fafc' : '#fafafa',
                transition: 'all 0.2s'
              }}
            >
              {file ? (
                <div>
                  <div style={{ fontWeight: '500', color: T.accent, marginBottom: '8px' }}>{file.name}</div>
                  <div style={{ fontSize: '12px', color: T.textMuted }}>{(file.size / (1024*1024)).toFixed(2)} MB</div>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowPreview(true); }}
                      style={{ padding: '6px 12px', background: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'opacity 0.2s' }}
                    >
                      Preview Video
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      disabled={processing}
                      style={{ padding: '6px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: processing ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s' }}
                    >
                      Delete Video
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}
                      disabled={processing}
                      style={{ padding: '6px 12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: processing ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s' }}
                    >
                      Choose Another Video
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ color: T.textMuted }}>
                  <svg style={{ width: '32px', height: '32px', margin: '0 auto 8px', color: '#94a3b8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                  Click to browse or drag video file here
                </div>
              )}
            </div>

            <button 
              onClick={handleUpload}
              disabled={!file || processing}
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '10px 16px',
                background: (!file || processing) ? '#cbd5e1' : T.accent,
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: (!file || processing) ? 'not-allowed' : 'pointer'
              }}
            >
              {processing ? 'Processing Video...' : 'Identify Students'}
            </button>
            {processing && (
              <button 
                onClick={handleStop}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '10px 16px',
                  background: 'transparent',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#fee2e2'}
                onMouseOut={(e) => e.target.style.background = 'transparent'}
              >
                Stop Processing
              </button>
            )}
          </div>

          {/* Activity Log */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: `1px solid ${T.border}`, flex: 1, minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: T.textMuted }}>Activity Log</h2>
            <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc', borderRadius: '6px', padding: '12px', fontFamily: 'monospace', fontSize: '12px' }}>
              {streamLog.length === 0 ? (
                <span style={{ color: '#cbd5e1' }}>Waiting to start...</span>
              ) : (
                streamLog.map((log, i) => (
                  <div key={i} style={{ color: log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#10b981' : '#64748b', marginBottom: '4px' }}>
                    [{log.time}] {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live View and Results */}
        <div style={{ flex: '2 1 600px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ background: '#0f172a', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${T.border}`, position: 'relative', minHeight: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {liveFrame ? (
              <div style={{ position: 'relative', width: '100%' }}>
                <img src={liveFrame} alt="Live Tracking" style={{ width: '100%', height: 'auto', display: 'block' }} />
                <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: '8px', zIndex: 10 }}>
                  <button onClick={() => { setZoomLevel(1); setZoomSnapshot(true); }} style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', color: '#000', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    🔍 Zoom
                  </button>
                  <a href={liveFrame} download={`snapshot_run_${runsCompleted}.jpg`} style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', color: '#000', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    ⬇️ Download
                  </a>
                </div>
              </div>
            ) : (
              <div style={{ color: '#475569', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px' }}>
                <svg style={{ width: '48px', height: '48px', marginBottom: '8px', opacity: 0.5 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                <span>Latest Identification Snapshot will appear here</span>
              </div>
            )}
            
            {(processing || totalRuns > 0) && (
              <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '20px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>
                Runs Completed: {runsCompleted}
              </div>
            )}

            {processing && (
              <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '20px', color: '#fff', fontSize: '12px' }}>
                <div style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                PROCESSING
              </div>
            )}
          </div>

          {/* Results Section */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Identified Students ({Object.keys(markedStudents).length})</h2>
              {summary && (
                <div style={{ fontSize: '12px', color: T.textMuted }}>
                  Processed {summary.frames_processed} frames in {summary.duration_sec}s
                </div>
              )}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {Object.keys(markedStudents).length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '32px', textAlign: 'center', color: T.textMuted, background: '#f8fafc', borderRadius: '8px' }}>
                  No students identified yet.
                </div>
              ) : (
                Object.entries(markedStudents).map(([roll, data]) => (
                  <div key={roll} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: `1px solid ${T.border}`, borderRadius: '8px', background: '#f8fafc' }}>
                    {data.evidence ? (
                       <img src={`data:image/jpeg;base64,${data.evidence}`} alt={roll} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                    ) : (
                       <div style={{ width: '48px', height: '48px', background: '#e2e8f0', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '20px', fontWeight: 'bold' }}>?</div>
                    )}
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px', color: T.text }}>{roll}</div>
                      <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '500' }}>Match: {(data.score * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
      `}} />

      {showPreview && file && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', width: '100%', maxWidth: '800px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: `1px solid ${T.border}` }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Video Preview</h3>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowPreview(false); }}
                style={{ background: 'transparent', border: 'none', fontSize: '24px', lineHeight: 1, cursor: 'pointer', color: '#64748b' }}
              >&times;</button>
            </div>
            <div style={{ padding: '16px' }}>
              <video 
                src={URL.createObjectURL(file)} 
                controls
                style={{ width: '100%', borderRadius: '8px', background: '#000' }} 
              />
            </div>
          </div>
        </div>
      )}

      {zoomSnapshot && liveFrame && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          
          <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '12px', zIndex: 10000 }}>
             <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>- Zoom Out</button>
             <button onClick={() => setZoomLevel(z => Math.min(4, z + 0.25))} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>+ Zoom In</button>
             <button onClick={() => setZoomSnapshot(false)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>Close</button>
          </div>

          <div style={{ overflow: 'auto', width: '100%', height: '100%', display: 'flex', alignItems: zoomLevel > 1 ? 'flex-start' : 'center', justifyContent: zoomLevel > 1 ? 'flex-start' : 'center', padding: '24px' }}>
            <img src={liveFrame} alt="Zoomed Snapshot" style={{ width: `${zoomLevel * 100}%`, minWidth: `${zoomLevel * 100}%`, transition: 'width 0.2s, min-width 0.2s', objectFit: 'contain' }} />
          </div>

        </div>
      )}
    </div>
  );
}
