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
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
      setSummary(null);
      setMarkedStudents({});
      setStreamLog([]);
      setLiveFrame(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a video file first.");
      return;
    }

    setProcessing(true);
    setStreamLog([{ type: 'info', message: 'Starting video upload and processing...' }]);
    setMarkedStudents({});
    setSummary(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // We will manually fetch and read the stream
      const response = await fetch(`${GATE_API}/identify-video`, {
        method: 'POST',
        body: formData,
        // include credentials if required
        credentials: 'omit'
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
                setStreamLog(prev => [...prev, { type: 'info', message: data.message }]);
              } else if (data.type === 'marked') {
                setMarkedStudents(prev => ({
                  ...prev,
                  [data.roll]: { score: data.score, time: data.time, evidence: data.evidence }
                }));
                setStreamLog(prev => [...prev, { type: 'success', message: `Recognized ${data.roll} (${data.score})` }]);
              } else if (data.type === 'frame_image') {
                if (data.image) {
                  setLiveFrame(`data:image/jpeg;base64,${data.image}`);
                }
              } else if (data.type === 'error') {
                setError(data.message);
                setProcessing(false);
              } else if (data.type === 'done') {
                setSummary(data.result.summary);
                if (data.result.marked) {
                   setMarkedStudents(data.result.marked);
                }
                setProcessing(false);
                setStreamLog(prev => [...prev, { type: 'info', message: 'Processing complete.' }]);
              }
            } catch (err) {
              console.error("Error parsing SSE chunk", err, chunk);
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred during processing.");
      setProcessing(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: T.text, marginBottom: '8px' }}>Institute Gate Identification</h1>
      <p style={{ color: T.textMuted, marginBottom: '24px' }}>Upload a video stream from the institute entry gate to identify students using the FAISS model.</p>

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
                  <div style={{ fontWeight: '500', color: T.accent }}>{file.name}</div>
                  <div style={{ fontSize: '12px', color: T.textMuted }}>{(file.size / (1024*1024)).toFixed(2)} MB</div>
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
                    [{new Date().toLocaleTimeString()}] {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live View and Results */}
        <div style={{ flex: '2 1 600px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Live Frame Preview */}
          <div style={{ background: '#0f172a', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${T.border}`, position: 'relative', minHeight: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {liveFrame ? (
              <img src={liveFrame} alt="Live Tracking" style={{ width: '100%', height: 'auto', display: 'block' }} />
            ) : (
              <div style={{ color: '#475569', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <svg style={{ width: '48px', height: '48px', marginBottom: '8px', opacity: 0.5 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                <span>Live processing feed will appear here</span>
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
    </div>
  );
}
