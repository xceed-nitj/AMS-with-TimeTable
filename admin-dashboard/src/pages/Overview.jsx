import { useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import { Users, UserX, Clock, Camera, Bell, ScanFace } from 'lucide-react'
import useApi, { LoadingSkeleton, ErrorState } from '../hooks/useApi'
import {
  getOverviewStats, getTodaySchedule, getSystemHealth,
  getLiveRecognitionFeed
} from '../services/dashboardApi'

// ─── Fallback data (shown when server is offline) ─────────────
const FALLBACK_STATS = {
  present: 47, absent: 11, late: 7, totalStudents: 65,
  camerasOnline: 19, camerasTotal: 24, activeAlerts: 11,
  criticalAlerts: 3, recognitionAccuracy: 98.7, modelName: 'ArcFace buffalo_l',
}

const FALLBACK_SCHEDULE = {
  schedule: [
    { time: '09:00–10:00', subject: 'Data Structures', faculty: 'Dr. Rajesh Kumar', room: '101', attendancePercent: 95 },
    { time: '10:00–11:00', subject: 'VLSI Design', faculty: 'Prof. Meena Iyer', room: '201', attendancePercent: 76 },
    { time: '11:00–12:00', subject: 'Thermodynamics', faculty: 'Dr. Suresh Nair', room: '301', attendancePercent: 84 },
    { time: '12:00–13:00', subject: 'Machine Learning', faculty: 'Dr. Priya Kapoor', room: 'Lab A1', attendancePercent: 100 },
  ],
}

const FALLBACK_HEALTH = {
  services: [
    { name: 'ArcFace Model', status: 'ONLINE' },
    { name: 'Redis Cache', status: 'ONLINE' },
    { name: 'PostgreSQL DB', status: 'ONLINE' },
    { name: 'REST API / SIS', status: 'ONLINE' },
    { name: 'SMS Gateway', status: 'ONLINE' },
    { name: 'Email Server', status: 'ONLINE' },
    { name: 'Edge Nodes (4/4)', status: 'ONLINE' },
    { name: 'Last Backup', status: '2H AGO', statusType: 'info' },
  ],
}

const FALLBACK_FEED = {
  totalEvents: 40,
  events: [
    { studentName: 'Lakshmi Devi', rollNo: 'IT/2022/025', cameraId: 'CAM-002', status: 'LATE', confidence: 94, timestamp: '12:44:44' },
    { studentName: 'Divya Mishra', rollNo: 'IT/2023/015', cameraId: 'CAM-017', status: 'PRESENT', confidence: 95, timestamp: '12:38:15' },
    { studentName: 'Vineet Singh', rollNo: 'ECE/2021/032', cameraId: 'CAM-018', status: 'PRESENT', confidence: 86, timestamp: '12:29:54' },
    { studentName: 'Siddharth Roy', rollNo: 'ME/2021/028', cameraId: 'CAM-018', status: 'UNKNOWN', confidence: 27, timestamp: '12:21:45' },
    { studentName: 'Siddharth Roy', rollNo: 'ME/2021/028', cameraId: 'CAM-017', status: 'LATE', confidence: 86, timestamp: '12:17:02' },
    { studentName: 'Swati Agarwal', rollNo: 'IT/2021/035', cameraId: 'CAM-004', status: 'PRESENT', confidence: 97, timestamp: '12:09:25' },
  ],
}

const FALLBACK_RISK = [
  { name: 'Shreya Pandey', rollNo: 'CE/2022/019', pct: '63%', color: 'red' },
  { name: 'Nisha Yadav', rollNo: 'CSE/2022/021', pct: '62%', color: 'red' },
  { name: 'Lakshmi Devi', rollNo: 'IT/2022/025', pct: '60%', color: 'red' },
  { name: 'Harsh Trivedi', rollNo: 'CSE/2021/036', pct: '64%', color: 'orange' },
]

const FALLBACK_BUILDINGS = [
  { name: 'Block A', pct: 91 },
  { name: 'Block B', pct: 83 },
  { name: 'Block C', pct: 76 },
  { name: 'Main Building', pct: 88 },
]

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase()
}

function getAttColor(pct) {
  const n = typeof pct === 'string' ? parseInt(pct) : pct
  if (n >= 90) return 'green'
  if (n >= 75) return 'accent'
  return 'orange'
}

function getStatusColor(status) {
  if (status === 'PRESENT') return 'green'
  if (status === 'LATE') return 'orange'
  return 'red'
}

export default function Overview() {
  const stats = useApi(getOverviewStats, { fallback: FALLBACK_STATS })
  const schedule = useApi(getTodaySchedule, { fallback: FALLBACK_SCHEDULE })
  const health = useApi(getSystemHealth, { fallback: FALLBACK_HEALTH })
  const feed = useApi(getLiveRecognitionFeed, { fallback: FALLBACK_FEED, refreshInterval: 10000 })

  const s = stats.data || FALLBACK_STATS
  const sched = schedule.data?.schedule || FALLBACK_SCHEDULE.schedule
  const healthItems = health.data?.services || FALLBACK_HEALTH.services
  const feedData = feed.data || FALLBACK_FEED

  return (
    <>
      <PageHeader title="Overview" />
      <div className="page-content">
        {/* Stat Cards */}
        <div className="stat-cards" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
          <div className="stat-card green">
            <span className="stat-icon"><Users size={20} /></span>
            <div className="stat-value">{s.present}</div>
            <div className="stat-label">Present Today</div>
            <div className="stat-sub">{s.totalStudents ? Math.round((s.present / s.totalStudents) * 100) : 72}% of enrolled</div>
          </div>
          <div className="stat-card orange">
            <span className="stat-icon"><UserX size={20} /></span>
            <div className="stat-value">{s.absent}</div>
            <div className="stat-label">Absent</div>
            <div className="stat-sub">{s.totalStudents ? Math.round((s.absent / s.totalStudents) * 100) : 17}% absent</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon"><Clock size={20} /></span>
            <div className="stat-value">{s.late}</div>
            <div className="stat-label">Late Arrival</div>
            <div className="stat-sub">After 9:15 AM</div>
          </div>
          <div className="stat-card green">
            <span className="stat-icon"><Camera size={20} /></span>
            <div className="stat-value">{s.camerasOnline}</div>
            <div className="stat-label">Cameras Online</div>
            <div className="stat-sub">{s.camerasTotal - s.camerasOnline} offline today</div>
          </div>
          <div className="stat-card red">
            <span className="stat-icon"><Bell size={20} /></span>
            <div className="stat-value">{s.activeAlerts}</div>
            <div className="stat-label">Active Alerts</div>
            <div className="stat-sub">{s.criticalAlerts} critical</div>
          </div>
          <div className="stat-card accent">
            <span className="stat-icon"><ScanFace size={20} /></span>
            <div className="stat-value">{s.recognitionAccuracy}%</div>
            <div className="stat-label">Recognition Accuracy</div>
            <div className="stat-sub mono">{s.modelName}</div>
          </div>
        </div>

        {/* 3-column grid */}
        <div className="grid-main">
          {/* Today's Class Schedule */}
          <div className="card">
            <div className="flex-between mb-8">
              <span className="card-title" style={{ margin: 0 }}>Today's Class Schedule</span>
              <button className="btn btn-outline" style={{ fontSize: 11 }}>Full Schedule</button>
            </div>
            {schedule.loading ? <LoadingSkeleton rows={4} /> : (
              <table className="data-table">
                <thead>
                  <tr><th>Time</th><th>Subject</th><th>Faculty</th><th>Room</th><th>Att.</th></tr>
                </thead>
                <tbody>
                  {sched.map((row, i) => (
                    <tr key={i}>
                      <td className="mono text-muted" style={{ fontSize: 12 }}>{row.time || row.slot}</td>
                      <td style={{ fontWeight: 500 }}>{row.subject}</td>
                      <td className="text-muted" style={{ fontSize: 12 }}>{row.faculty}</td>
                      <td><span className="badge room">{row.room}</span></td>
                      <td>
                        {row.attendancePercent != null ? (
                          <span className={`badge`} style={{
                            background: row.attendancePercent >= 90 ? 'var(--green-bg)' : row.attendancePercent >= 75 ? 'var(--accent-bg)' : 'var(--orange-bg)',
                            color: row.attendancePercent >= 90 ? 'var(--green-text)' : row.attendancePercent >= 75 ? 'var(--accent)' : 'var(--orange-text)'
                          }}>{row.attendancePercent}%</span>
                        ) : <span className="text-muted">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Campus Attendance by Building */}
          <div className="card">
            <div className="card-title">Campus Attendance by Building</div>
            {FALLBACK_BUILDINGS.map((b, i) => (
              <div key={i} className="progress-row">
                <span className="progress-label">{b.name}</span>
                <div className="progress-bar-track">
                  <div
                    className={`progress-bar-fill ${b.pct >= 85 ? 'green' : b.pct >= 75 ? 'accent' : 'orange'}`}
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
                <span className="progress-pct">{b.pct}%</span>
              </div>
            ))}
          </div>

          {/* System Health */}
          <div className="card">
            <div className="card-title">System Health</div>
            {health.loading ? <LoadingSkeleton rows={6} /> : (
              healthItems.map((item, i) => (
                <div key={i} className="info-row">
                  <span className="info-label">{item.name}</span>
                  <span className={`badge ${item.statusType === 'info' ? 'info' : item.status === 'ONLINE' ? 'online' : 'critical'}`}>
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recognition Feed + High Risk */}
        <div className="grid-2-1">
          {/* Live Recognition Feed */}
          <div className="card">
            <div className="flex-between mb-8">
              <span className="card-title" style={{ margin: 0 }}>Live Recognition Feed</span>
              <span className="text-muted" style={{ fontSize: 12 }}>
                {feedData.totalEvents} events today
                {feed.error && <span style={{ color: 'var(--accent)', marginLeft: 8 }}>● offline</span>}
              </span>
            </div>
            {feed.loading && !feedData.events?.length ? <LoadingSkeleton rows={5} /> : (
              feedData.events?.map((item, i) => (
                <div key={i} className="feed-item">
                  <div className={`avatar ${getStatusColor(item.status)}`}>{getInitials(item.studentName)}</div>
                  <div className="feed-item-content">
                    <div className="feed-item-name">{item.studentName}</div>
                    <div className="feed-item-sub">{item.rollNo} · {item.cameraId}</div>
                  </div>
                  <div className="feed-item-right">
                    <span className={`badge ${item.status.toLowerCase()}`}>{item.status}</span>
                    <div className="feed-time">{item.confidence}% · {item.timestamp}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right column */}
          <div>
            {/* High Risk Students */}
            <div className="card mb-16">
              <div className="flex-between mb-8">
                <span className="card-title" style={{ margin: 0 }}>High-Risk Students</span>
                <span className="badge critical" style={{ borderRadius: 10 }}>{FALLBACK_RISK.length}</span>
              </div>
              {FALLBACK_RISK.map((s, i) => (
                <div key={i} className="feed-item">
                  <div className={`avatar ${s.color}`}>{getInitials(s.name)}</div>
                  <div className="feed-item-content">
                    <div className="feed-item-name">{s.name}</div>
                    <div className="feed-item-sub">{s.rollNo}</div>
                  </div>
                  <span className={`badge ${s.color === 'red' ? 'critical' : 'warning'}`}>{s.pct}</span>
                </div>
              ))}
              <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
                View All Defaulters
              </button>
            </div>

            {/* Recent Alerts */}
            <div className="card">
              <div className="card-title">Recent Alerts</div>
              <div className="feed-item">
                <div className="alert-icon critical">!</div>
                <div className="feed-item-content">
                  <div className="feed-item-name" style={{ fontSize: 12 }}>Unidentified person at Main Gate</div>
                  <div className="feed-item-sub">12:38 · unknown face</div>
                </div>
              </div>
              <div className="feed-item">
                <div className="alert-icon critical">!</div>
                <div className="feed-item-content">
                  <div className="feed-item-name" style={{ fontSize: 12 }}>Spoofing attempt blocked</div>
                  <div className="feed-item-sub">12:07 · spoof attempt</div>
                </div>
              </div>
              <div className="feed-item">
                <div className="alert-icon warning">⚠</div>
                <div className="feed-item-content">
                  <div className="feed-item-name" style={{ fontSize: 12 }}>CAM-007 offline</div>
                  <div className="feed-item-sub">11:38 · cam offline</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
