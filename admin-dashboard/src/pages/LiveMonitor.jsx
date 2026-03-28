import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import useApi, { LoadingSkeleton, ErrorState } from '../hooks/useApi'
import { getLiveDetections, getEngineStatus, getCameraFeeds } from '../services/dashboardApi'

// Fallback data
const FALLBACK_CAMERAS = [
  { id: 'CAM-001', name: 'Corridor', floor: 'Floor 1 / 101', res: '1920×1080', fps: 19, status: 'degraded' },
  { id: 'CAM-002', name: 'Parking', floor: 'Floor 3 / 104', res: '1920×1080', fps: 30, status: 'online' },
  { id: 'CAM-003', name: 'Canteen', floor: 'Floor 3 / 103', res: '1920×1080', fps: 17, status: 'online' },
  { id: 'CAM-004', name: 'Entry Gate', floor: 'Floor 3 / 102', res: '1920×1080', fps: 17, status: 'online' },
]

const FALLBACK_DETECTIONS = {
  totalEvents: 42,
  detections: [
    { studentName: 'Pooja Iyer', rollNo: 'ME/2023/013', cameraId: 'CAM-010', status: 'LATE', confidence: 93, timestamp: '12:46:27' },
    { studentName: 'Pooja Iyer', rollNo: 'ME/2023/013', cameraId: 'CAM-012', status: 'LATE', confidence: 94, timestamp: '12:46:09' },
    { studentName: 'Lakshmi Devi', rollNo: 'IT/2022/025', cameraId: 'CAM-002', status: 'LATE', confidence: 94, timestamp: '12:44:44' },
    { studentName: 'Divya Mishra', rollNo: 'IT/2023/015', cameraId: 'CAM-017', status: 'PRESENT', confidence: 95, timestamp: '12:38:15' },
    { studentName: 'Vineet Singh', rollNo: 'ECE/2021/032', cameraId: 'CAM-018', status: 'PRESENT', confidence: 86, timestamp: '12:29:54' },
    { studentName: 'Siddharth Roy', rollNo: 'ME/2021/028', cameraId: 'CAM-018', status: 'UNKNOWN', confidence: 27, timestamp: '12:21:45' },
    { studentName: 'Siddharth Roy', rollNo: 'ME/2021/028', cameraId: 'CAM-017', status: 'LATE', confidence: 86, timestamp: '12:17:02' },
  ],
}

const FALLBACK_ENGINE = {
  model: 'InsightFace buffalo_l', antiSpoof: true, threshold: 0.78,
  processingFps: 15, edgeNodes: 4, accuracy: 98.7,
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase()
}

function getStatusColor(status) {
  if (status === 'PRESENT') return 'green'
  if (status === 'LATE') return 'orange'
  return 'red'
}

export default function LiveMonitor() {
  const [grid, setGrid] = useState('2x2')

  const detections = useApi(getLiveDetections, { fallback: FALLBACK_DETECTIONS, refreshInterval: 5000 })
  const engine = useApi(getEngineStatus, { fallback: FALLBACK_ENGINE })
  const feeds = useApi(getCameraFeeds, { fallback: { feeds: FALLBACK_CAMERAS } })

  const detectData = detections.data || FALLBACK_DETECTIONS
  const engineData = engine.data || FALLBACK_ENGINE
  const cameras = feeds.data?.feeds?.length ? feeds.data.feeds : FALLBACK_CAMERAS

  const engineRows = [
    { label: 'Model', value: engineData.model },
    { label: 'Anti-spoof', value: engineData.antiSpoof ? 'ACTIVE' : 'INACTIVE', badge: true },
    { label: 'Threshold', value: `${Math.round(engineData.threshold * 100)}% cosine` },
    { label: 'Processing', value: `${engineData.processingFps}fps · 38ms/frame` },
    { label: 'Edge nodes', value: `${engineData.edgeNodes} active` },
    { label: 'Accuracy', value: `${engineData.accuracy}%`, highlight: true },
  ]

  return (
    <>
      <PageHeader title="Live Monitor" />
      <div className="page-content">
        <div className="grid-2-1">
          <div>
            <div className="flex-between mb-16">
              <div className="card-title" style={{ margin: 0 }}>Camera Grid</div>
              <div className="flex gap-8">
                {['1×1', '2×2', '3×3'].map(g => (
                  <button key={g} className={`btn ${grid === g.replace('×', 'x') ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setGrid(g.replace('×', 'x'))}>{g}</button>
                ))}
                <button className="btn btn-outline">Pause All</button>
                <button className="btn btn-outline">Snapshot</button>
              </div>
            </div>
            <div className={`camera-grid g${grid}`}>
              {cameras.map((cam, i) => (
                <div key={i}>
                  <div className="camera-cell">
                    <div className="cam-sim-feed" />
                    {i === 1 && (
                      <>
                        <div className="cam-sim-box" style={{ width: 60, height: 80, top: '30%', left: '55%' }}>
                          <span className="cam-sim-box-label">IT202301 91%</span>
                        </div>
                        <div className="cam-sim-box" style={{ width: 55, height: 75, top: '25%', left: '40%' }}>
                          <span className="cam-sim-box-label">IT202302 97%</span>
                        </div>
                      </>
                    )}
                    {i === 2 && (
                      <div className="cam-sim-box" style={{ width: 50, height: 70, top: '35%', left: '30%' }}>
                        <span className="cam-sim-box-label">CE202400 93%</span>
                      </div>
                    )}
                    {i === 3 && (
                      <div className="cam-sim-box" style={{ width: 50, height: 70, top: '30%', left: '60%' }}>
                        <span className="cam-sim-box-label">ME202102 91%</span>
                      </div>
                    )}
                    <div className="cam-overlay">
                      <div className="cam-top">
                        <span>{cam.id} · {cam.name}</span>
                        <span className="cam-rec">● REC &nbsp; {new Date().toLocaleTimeString('en-IN', { hour12: false })}</span>
                      </div>
                      <div className="cam-bottom">
                        <span>{cam.fps}fps ↔ {cam.res}</span>
                      </div>
                    </div>
                  </div>
                  <div className="cam-label">
                    <span>Block A {cam.name}</span>
                    <span className={`badge ${cam.status === 'online' ? 'online' : cam.status === 'degraded' ? 'degraded' : 'critical'}`}>
                      {cam.status?.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="card mb-16">
              <div className="flex-between mb-8">
                <span className="card-title" style={{ margin: 0 }}>Live Detections</span>
                <span className="text-muted" style={{ fontSize: 12 }}>{detectData.totalEvents} events</span>
              </div>
              {detections.loading && !detectData.detections?.length ? <LoadingSkeleton rows={5} /> : (
                detectData.detections?.map((d, i) => (
                  <div key={i} className="feed-item">
                    <div className={`avatar ${getStatusColor(d.status)}`}>{getInitials(d.studentName)}</div>
                    <div className="feed-item-content">
                      <div className="feed-item-name">{d.studentName}</div>
                      <div className="feed-item-sub">{d.rollNo} · {d.cameraId}</div>
                    </div>
                    <div className="feed-item-right">
                      <span className={`badge ${d.status.toLowerCase()}`}>{d.status}</span>
                      <div className="feed-time">{d.confidence}% · {d.timestamp}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <div className="card-title">Engine Status</div>
              {engine.loading ? <LoadingSkeleton rows={6} /> : (
                engineRows.map((e, i) => (
                  <div key={i} className="info-row">
                    <span className="info-label">{e.label}</span>
                    {e.badge ? (
                      <span className="badge online">{e.value}</span>
                    ) : (
                      <span className={`info-value ${e.highlight ? 'text-accent' : ''}`}>{e.value}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
