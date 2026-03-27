import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import useApi, { LoadingSkeleton } from '../hooks/useApi'
import {
  getEngineConfig, updateEngineConfig, getModelInfo,
  backupDatabase, rebuildEmbeddings, exportArchive, resetTodayRecords
} from '../services/dashboardApi'

const settingTabs = ['Model & Engine', 'Integrations', 'Notifications', 'User Management', 'Compliance & Privacy']

const FALLBACK_ENGINE = {
  antiSpoofing: true, multiCameraThreading: true,
  asyncAttendanceLogging: true, edgeProcessing: false,
  confidenceThreshold: 78, processingFps: 15,
}

const FALLBACK_MODEL = {
  model: 'InsightFace buffalo_l', architecture: 'ResNet-100 ArcFace',
  embeddingDim: 512, lfwBenchmark: '99.77%', ijbcBenchmark: '97.3%',
  license: 'MIT Open Source', lastUpdated: 'Oct 2024', inferenceTime: '~38ms/frame',
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('Model & Engine')
  const [actionMsg, setActionMsg] = useState(null)

  const engine = useApi(getEngineConfig, { fallback: FALLBACK_ENGINE })
  const model = useApi(getModelInfo, { fallback: FALLBACK_MODEL })

  const cfg = engine.data || FALLBACK_ENGINE
  const mdl = model.data || FALLBACK_MODEL

  const [threshold, setThreshold] = useState(cfg.confidenceThreshold || 78)
  const [fps, setFps] = useState(cfg.processingFps || 15)

  const handleSaveConfig = async () => {
    try {
      await updateEngineConfig({ ...cfg, confidenceThreshold: threshold, processingFps: fps })
      setActionMsg('Configuration saved!')
      setTimeout(() => setActionMsg(null), 3000)
    } catch (e) { console.error(e) }
  }

  const handleAction = async (fn, msg) => {
    try {
      setActionMsg(msg + '...')
      await fn()
      setActionMsg(msg + ' — done!')
      setTimeout(() => setActionMsg(null), 3000)
    } catch (e) {
      setActionMsg('Error: ' + e.message)
      setTimeout(() => setActionMsg(null), 5000)
    }
  }

  const toggles = [
    { key: 'antiSpoofing', name: 'Anti-Spoofing (Liveness Detection)', desc: 'Blocks photo and video replay attacks using depth cues and eye-blink analysis' },
    { key: 'multiCameraThreading', name: 'Multi-Camera Threading', desc: 'Process all camera streams in parallel across edge nodes' },
    { key: 'asyncAttendanceLogging', name: 'Async Attendance Logging', desc: 'Non-blocking database writes via Redis queue — prevents recognition delay' },
    { key: 'edgeProcessing', name: 'Edge Processing (NVIDIA Jetson)', desc: 'Run inference on edge nodes instead of central server for lower latency' },
  ]

  const modelRows = [
    { label: 'Model', value: mdl.model },
    { label: 'Architecture', value: mdl.architecture },
    { label: 'Embedding Dim', value: `${mdl.embeddingDim}-dimensional` },
    { label: 'LFW Benchmark', value: mdl.lfwBenchmark },
    { label: 'IJB-C Benchmark', value: mdl.ijbcBenchmark },
    { label: 'License', value: mdl.license },
    { label: 'Last Updated', value: mdl.lastUpdated },
    { label: 'Inference Time', value: mdl.inferenceTime },
  ]

  return (
    <>
      <PageHeader title="Settings" />
      <div className="page-content">
        {actionMsg && (
          <div style={{
            background: 'var(--accent-bg)', color: 'var(--accent)', padding: '10px 16px',
            borderRadius: 'var(--radius-sm)', marginBottom: 16, fontSize: 13, fontWeight: 500
          }}>
            {actionMsg}
          </div>
        )}

        <div className="tab-group">
          {settingTabs.map(t => (
            <div key={t} className={`tab-item ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</div>
          ))}
        </div>

        {activeTab === 'Model & Engine' && (
          <div className="grid-2-1">
            <div className="card">
              <div className="flex-between mb-8">
                <div className="card-title" style={{ margin: 0 }}>Recognition Engine</div>
                <button className="btn btn-primary" style={{ fontSize: 11 }} onClick={handleSaveConfig}>Save Changes</button>
              </div>
              {engine.loading ? <LoadingSkeleton rows={6} /> : (
                <>
                  {toggles.map((t, i) => (
                    <div key={i} className="setting-row">
                      <div>
                        <div className="setting-label">{t.name}</div>
                        <div className="setting-desc">{t.desc}</div>
                      </div>
                      <label className="toggle">
                        <input type="checkbox" defaultChecked={cfg[t.key]} />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  ))}

                  <div className="setting-row">
                    <div>
                      <div className="setting-label">Confidence Threshold</div>
                      <div className="setting-desc">Minimum cosine similarity score required to confirm identity</div>
                    </div>
                    <div className="flex gap-8 items-center">
                      <input type="range" className="range-slider" min="50" max="100"
                        value={threshold} onChange={e => setThreshold(Number(e.target.value))} />
                      <span className="mono" style={{ fontWeight: 600, minWidth: 35 }}>{threshold}%</span>
                    </div>
                  </div>

                  <div className="setting-row">
                    <div>
                      <div className="setting-label">Processing FPS</div>
                      <div className="setting-desc">Frames per second per camera — balance accuracy vs server load</div>
                    </div>
                    <div className="flex gap-8 items-center">
                      <input type="range" className="range-slider" min="1" max="30"
                        value={fps} onChange={e => setFps(Number(e.target.value))} />
                      <span className="mono" style={{ fontWeight: 600, minWidth: 50 }}>{fps} fps</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div>
              <div className="card mb-16">
                <div className="card-title">Model Information</div>
                {model.loading ? <LoadingSkeleton rows={8} /> : (
                  modelRows.map((m, i) => (
                    <div key={i} className="info-row">
                      <span className="info-label">{m.label}</span>
                      <span className="info-value">{m.value}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="card">
                <div className="card-title">Data Management</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12 }}
                    onClick={() => handleAction(backupDatabase, 'Backup initiated')}>
                    Backup Database Now
                  </button>
                  <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', padding: 12 }}
                    onClick={() => handleAction(rebuildEmbeddings, 'Rebuilding embeddings')}>
                    Rebuild All Embeddings
                  </button>
                  <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', padding: 12 }}
                    onClick={() => handleAction(exportArchive, 'Exporting archive')}>
                    Export Full Attendance Archive
                  </button>
                  <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'center', padding: 12 }}
                    onClick={() => { if (confirm('Are you sure? This will delete all attendance records for today.')) handleAction(resetTodayRecords, 'Resetting records') }}>
                    Reset Today's Records
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'Model & Engine' && (
          <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 16, marginBottom: 8 }}>{activeTab}</p>
            <p style={{ fontSize: 13 }}>Configuration panel coming soon.</p>
          </div>
        )}
      </div>
    </>
  )
}
