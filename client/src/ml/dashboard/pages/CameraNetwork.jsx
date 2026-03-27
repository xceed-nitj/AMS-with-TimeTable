import PageHeader from '../components/PageHeader'
import useApi, { LoadingSkeleton, ErrorState } from '../hooks/useApi'
import { getCameras, getCameraStats, getCameraBuildings, getEdgeNodes, getNetworkHealth, restartCamera } from '../services/dashboardApi'

// Fallback data
const FALLBACK_STATS = { online: 19, degraded: 4, offline: 1, total: 24 }

const FALLBACK_CAMERAS = [
  { _id: '1', id: 'CAM-001', block: 'Block A', loc: 'Floor 1 · 101', type: 'CORRIDOR', status: 'degraded', res: '1920×1080', fps: 19, det: 123, uptime: 96 },
  { _id: '2', id: 'CAM-002', block: 'Block A', loc: 'Floor 3 · 104', type: 'PARKING', status: 'online', res: '1920×1080', fps: 30, det: 100, uptime: 96 },
  { _id: '3', id: 'CAM-003', block: 'Block A', loc: 'Floor 3 · 103', type: 'CANTEEN', status: 'online', res: '1920×1080', fps: 17, det: 138, uptime: 98 },
  { _id: '4', id: 'CAM-004', block: 'Block A', loc: 'Floor 3 · 102', type: 'ENTRY GATE', status: 'online', res: '1920×1080', fps: 17, det: 86, uptime: 100 },
  { _id: '5', id: 'CAM-005', block: 'Block A', loc: 'Floor 3 · 102', type: 'CLASSROOM', status: 'online', res: '2560×1440', fps: 21, det: 150, uptime: 98 },
  { _id: '6', id: 'CAM-006', block: 'Block A', loc: 'Floor 3 · Lab A2', type: 'SEMINAR HALL', status: 'offline', res: '1920×1080', fps: 18, det: 0, uptime: 0 },
  { _id: '7', id: 'CAM-007', block: 'Block B', loc: 'Floor 3 · Lab B1', type: 'CORRIDOR', status: 'online', res: '1280×720', fps: 14, det: 70, uptime: 98 },
]

const FALLBACK_BUILDINGS = [
  { name: 'Block A', cams: '6 cameras · 4 floors', online: '4/6' },
  { name: 'Block B', cams: '6 cameras · 3 floors', online: '5/6' },
  { name: 'Block C', cams: '6 cameras · 3 floors', online: '5/6' },
  { name: 'Main Building', cams: '4 cameras · 2 floors', online: '4/4' },
  { name: 'Library Complex', cams: '2 cameras · 1 floors', online: '1/2' },
]

const FALLBACK_NODES = [
  { name: 'Edge Node 1', loc: 'NVIDIA Jetson · Block A' },
  { name: 'Edge Node 2', loc: 'NVIDIA Jetson · Block B' },
  { name: 'Edge Node 3', loc: 'NVIDIA Jetson · Block C' },
  { name: 'Edge Node 4', loc: 'NVIDIA Jetson · Block Main' },
]

const FALLBACK_NETWORK = { avgLatency: '12ms', packetLoss: '0.02%', throughput: '420 Mbps', rtspStreams: 'Active' }

function getTypeColor(type) {
  const colors = {
    'CORRIDOR': '#A0522D', 'PARKING': '#2E8B57', 'CANTEEN': '#4682B4',
    'ENTRY GATE': '#8B4513', 'CLASSROOM': '#6B5B95', 'SEMINAR HALL': '#708090'
  }
  return colors[type] || '#6B5B95'
}

export default function CameraNetwork() {
  const camStats = useApi(getCameraStats, { fallback: FALLBACK_STATS })
  const cameras = useApi(getCameras, { fallback: { total: 7, cameras: FALLBACK_CAMERAS } })
  const buildings = useApi(getCameraBuildings, { fallback: { buildings: FALLBACK_BUILDINGS } })
  const nodes = useApi(getEdgeNodes, { fallback: { nodes: FALLBACK_NODES } })
  const network = useApi(getNetworkHealth, { fallback: FALLBACK_NETWORK })

  const s = camStats.data || FALLBACK_STATS
  const camList = cameras.data?.cameras?.length ? cameras.data.cameras : FALLBACK_CAMERAS
  const buildList = buildings.data?.buildings?.length ? buildings.data.buildings : FALLBACK_BUILDINGS
  const nodeList = nodes.data?.nodes?.length ? nodes.data.nodes : FALLBACK_NODES
  const net = network.data || FALLBACK_NETWORK

  const handleRestart = async (id) => {
    try {
      await restartCamera(id)
      cameras.refresh()
    } catch (e) { console.error(e) }
  }

  return (
    <>
      <PageHeader title="Camera Network" />
      <div className="page-content">
        <div className="stat-cards" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card green"><div className="stat-value">{s.online}</div><div className="stat-label">Online</div></div>
          <div className="stat-card orange"><div className="stat-value">{s.degraded}</div><div className="stat-label">Degraded</div></div>
          <div className="stat-card red"><div className="stat-value">{s.offline}</div><div className="stat-label">Offline</div></div>
          <div className="stat-card accent"><div className="stat-value">{s.total}</div><div className="stat-label">Total Cameras</div></div>
        </div>

        <div className="grid-2-1">
          <div className="card">
            <div className="flex-between mb-16">
              <span className="card-title" style={{ margin: 0 }}>Camera Registry</span>
              <div className="flex gap-8 items-center">
                <input className="filter-input" placeholder="Search ID, name, location..." style={{ minWidth: 180 }} />
                <select className="filter-select"><option>All Status</option></select>
                <span className="filter-count">{s.total} cameras</span>
                <button className="btn btn-outline">Test All</button>
                <button className="btn btn-primary">+ Add Camera</button>
              </div>
            </div>
            {cameras.loading && !camList.length ? <LoadingSkeleton rows={5} /> : (
              <table className="data-table">
                <thead>
                  <tr><th>Camera ID</th><th>Location</th><th>Type</th><th>Status</th><th>Resolution</th><th>FPS</th><th>Detections</th><th>Uptime</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {camList.map((cam, i) => (
                    <tr key={cam._id || i}>
                      <td className="mono" style={{ fontWeight: 600 }}>{cam.id}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{cam.block}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>{cam.loc}</div>
                      </td>
                      <td><span className="badge" style={{ background: getTypeColor(cam.type), color: 'white', fontSize: 9 }}>{cam.type}</span></td>
                      <td>
                        <span className="flex gap-8 items-center">
                          <span className={`status-dot ${cam.status === 'online' ? 'green' : cam.status === 'degraded' ? 'orange' : 'red'}`} />
                          <span>{cam.status}</span>
                        </span>
                      </td>
                      <td className="mono">{cam.res}</td>
                      <td className="mono">{cam.fps}</td>
                      <td className="mono">{cam.det}</td>
                      <td>
                        <div className="flex gap-8 items-center">
                          <div className="progress-bar-track" style={{ width: 60 }}>
                            <div className={`progress-bar-fill ${cam.uptime >= 90 ? 'green' : 'red'}`} style={{ width: `${cam.uptime}%` }} />
                          </div>
                          <span className="mono" style={{ fontSize: 12 }}>{cam.uptime}%</span>
                        </div>
                      </td>
                      <td><button className="btn btn-ghost" style={{ fontSize: 11 }} onClick={() => handleRestart(cam._id || cam.id)}>Restart</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div>
            <div className="card mb-16">
              <div className="card-title">By Building</div>
              {buildList.map((b, i) => (
                <div key={i} className="info-row">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{b.name}</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>{b.cams}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="mono" style={{ fontWeight: 600, color: 'var(--accent)' }}>{b.online}</span>
                    <div className="text-muted" style={{ fontSize: 10 }}>online</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card mb-16">
              <div className="card-title">Edge Nodes</div>
              {nodeList.map((n, i) => (
                <div key={i} className="info-row">
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{n.name}</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>{n.loc}</div>
                  </div>
                  <span className="badge online">ONLINE</span>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-title">Network Health</div>
              {[
                { label: 'Avg Latency', value: net.avgLatency },
                { label: 'Packet Loss', value: net.packetLoss },
                { label: 'Throughput', value: net.throughput },
                { label: 'RTSP Streams', value: net.rtspStreams },
              ].map((n, i) => (
                <div key={i} className="info-row">
                  <span className="info-label">{n.label}</span>
                  <span className="info-value">{n.value || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
