import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import useApi, { LoadingSkeleton } from '../hooks/useApi'
import { getAttendanceRecords, getAttendanceStats, overrideAttendance, exportAttendance } from '../services/dashboardApi'

const FALLBACK_STATS = { present: 26, absent: 0, late: 14, unknown: 4 }

const FALLBACK_RECORDS = [
  { _id: '1', studentName: 'Amit Chauhan', rollNo: 'CE/2023/014', dept: 'CE', status: 'LATE', detectedAt: '12:47:02', confidence: 86, cameraId: 'CAM-003', subject: 'Structural Analysis' },
  { _id: '2', studentName: 'Suresh Babu', rollNo: 'CE/2022/024', dept: 'CE', status: 'PRESENT', detectedAt: '12:46:51', confidence: 94, cameraId: 'CAM-021', subject: 'Geotechnical Engg.' },
  { _id: '3', studentName: 'Pooja Iyer', rollNo: 'ME/2023/013', dept: 'ME', status: 'LATE', detectedAt: '12:46:27', confidence: 93, cameraId: 'CAM-010', subject: 'Strength of Materials' },
  { _id: '4', studentName: 'Pooja Iyer', rollNo: 'ME/2023/013', dept: 'ME', status: 'LATE', detectedAt: '12:46:09', confidence: 94, cameraId: 'CAM-012', subject: 'Manufacturing Proc.' },
  { _id: '5', studentName: 'Lakshmi Devi', rollNo: 'IT/2022/025', dept: 'IT', status: 'LATE', detectedAt: '12:44:44', confidence: 94, cameraId: 'CAM-002', subject: 'Internet of Things' },
  { _id: '6', studentName: 'Divya Mishra', rollNo: 'IT/2023/015', dept: 'IT', status: 'PRESENT', detectedAt: '12:38:15', confidence: 95, cameraId: 'CAM-017', subject: 'Web Technologies' },
  { _id: '7', studentName: 'Vineet Singh', rollNo: 'ECE/2021/032', dept: 'ECE', status: 'PRESENT', detectedAt: '12:29:54', confidence: 86, cameraId: 'CAM-018', subject: 'VLSI Design' },
  { _id: '8', studentName: 'Siddharth Roy', rollNo: 'ME/2021/028', dept: 'ME', status: 'UNKNOWN', detectedAt: '12:21:45', confidence: 27, cameraId: 'CAM-018', subject: 'Strength of Materials' },
  { _id: '9', studentName: 'Siddharth Roy', rollNo: 'ME/2021/028', dept: 'ME', status: 'LATE', detectedAt: '12:17:02', confidence: 86, cameraId: 'CAM-017', subject: 'Manufacturing Proc.' },
  { _id: '10', studentName: 'Swati Agarwal', rollNo: 'IT/2021/035', dept: 'IT', status: 'PRESENT', detectedAt: '12:09:25', confidence: 97, cameraId: 'CAM-004', subject: 'Internet of Things' },
  { _id: '11', studentName: 'Ankita Jain', rollNo: 'ME/2021/033', dept: 'ME', status: 'PRESENT', detectedAt: '12:01:09', confidence: 98, cameraId: 'CAM-009', subject: 'Thermodynamics' },
  { _id: '12', studentName: 'Siddharth Roy', rollNo: 'ME/2021/028', dept: 'ME', status: 'UNKNOWN', detectedAt: '11:55:10', confidence: 42, cameraId: 'CAM-002', subject: 'Fluid Mechanics' },
  { _id: '13', studentName: 'Pallavi Das', rollNo: 'CE/2021/029', dept: 'CE', status: 'PRESENT', detectedAt: '11:46:31', confidence: 83, cameraId: 'CAM-011', subject: 'Fluid Mechanics' },
  { _id: '14', studentName: 'Kavya Reddy', rollNo: 'CE/2024/009', dept: 'CE', status: 'UNKNOWN', detectedAt: '11:39:10', confidence: 40, cameraId: 'CAM-017', subject: 'Surveying' },
]

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase()
}

function getStatusColor(status) {
  if (status === 'PRESENT') return 'green'
  if (status === 'LATE') return 'orange'
  return 'red'
}

export default function Attendance() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [filters, setFilters] = useState({ dept: '', status: '' })

  const records = useApi(() => getAttendanceRecords({ date, ...filters }), {
    fallback: { total: 44, records: FALLBACK_RECORDS },
    deps: [date, filters.dept, filters.status],
  })
  const stats = useApi(() => getAttendanceStats({ date }), {
    fallback: FALLBACK_STATS,
    deps: [date],
  })

  const s = stats.data || FALLBACK_STATS
  const recs = records.data?.records?.length ? records.data.records : FALLBACK_RECORDS

  const handleOverride = async (id) => {
    try {
      await overrideAttendance(id, { status: 'PRESENT', note: 'Manual override' })
      records.refresh()
    } catch (e) { console.error(e) }
  }

  const handleExport = async (format) => {
    try {
      const blob = await exportAttendance({ date, format })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance_${date}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) { console.error(e) }
  }

  const dateDisplay = new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <>
      <PageHeader title="Attendance" />
      <div className="page-content">
        <div className="flex-between mb-16">
          <div className="flex gap-8 items-center">
            <input type="date" className="filter-input" value={date} onChange={e => setDate(e.target.value)} style={{ minWidth: 140 }} />
            <select className="filter-select" value={filters.dept} onChange={e => setFilters(f => ({ ...f, dept: e.target.value }))}>
              <option value="">All Depts</option>
              <option value="CSE">CSE</option><option value="ECE">ECE</option>
              <option value="ME">ME</option><option value="CE">CE</option><option value="IT">IT</option>
            </select>
            <select className="filter-select"><option>All Section</option></select>
            <select className="filter-select" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
              <option value="">All Status</option>
              <option value="PRESENT">Present</option><option value="LATE">Late</option>
              <option value="ABSENT">Absent</option><option value="UNKNOWN">Unknown</option>
            </select>
            <span className="filter-count">{records.data?.total || 44} records</span>
          </div>
          <div className="flex gap-8">
            <button className="btn btn-outline" onClick={() => handleExport('csv')}>Export CSV</button>
            <button className="btn btn-outline" onClick={() => handleExport('pdf')}>Export PDF</button>
            <button className="btn btn-outline" onClick={() => handleExport('xlsx')}>Export Excel</button>
            <button className="btn btn-primary">Manual Entry</button>
          </div>
        </div>

        <div className="stat-cards" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card green"><div className="stat-value">{s.present}</div><div className="stat-label">Present</div></div>
          <div className="stat-card"><div className="stat-value">{s.absent}</div><div className="stat-label">Absent</div></div>
          <div className="stat-card orange"><div className="stat-value">{s.late}</div><div className="stat-label">Late</div></div>
          <div className="stat-card red"><div className="stat-value">{s.unknown}</div><div className="stat-label">Unknown</div></div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="flex-between" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Attendance Records — {dateDisplay}
            </span>
            <div className="flex gap-8 items-center">
              <label className="flex gap-8 items-center" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                <input type="checkbox" className="checkbox" /> Select all
              </label>
              <button className="btn btn-outline" style={{ fontSize: 11 }}>Export Selected</button>
            </div>
          </div>
          {records.loading && !recs.length ? <div style={{ padding: 20 }}><LoadingSkeleton rows={8} /></div> : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 30 }}></th><th>#</th><th>Student</th><th>Roll No</th>
                  <th>Department</th><th>Status</th><th>Detected At</th><th>Confidence</th>
                  <th>Camera</th><th>Subject</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recs.map((r, i) => (
                  <tr key={r._id || i}>
                    <td><input type="checkbox" className="checkbox" /></td>
                    <td className="text-muted">{String(i + 1).padStart(2, '0')}</td>
                    <td>
                      <div className="flex gap-8 items-center">
                        <div className={`avatar ${getStatusColor(r.status)}`} style={{ width: 26, height: 26, fontSize: 9 }}>{getInitials(r.studentName)}</div>
                        <span style={{ fontWeight: 500 }}>{r.studentName}</span>
                      </div>
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>{r.rollNo}</td>
                    <td><span className="badge dept">{r.dept}</span></td>
                    <td><span className={`badge ${r.status.toLowerCase()}`}>{r.status}</span></td>
                    <td className="mono" style={{ fontSize: 12 }}>{r.detectedAt}</td>
                    <td>
                      <div className="flex gap-8 items-center">
                        <div className="progress-bar-track" style={{ width: 50 }}>
                          <div className={`progress-bar-fill ${r.confidence >= 80 ? 'green' : r.confidence >= 50 ? 'orange' : 'red'}`} style={{ width: `${r.confidence}%` }} />
                        </div>
                        <span className="mono" style={{ fontSize: 12 }}>{r.confidence}%</span>
                      </div>
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>{r.cameraId}</td>
                    <td style={{ fontSize: 12 }}>{r.subject}</td>
                    <td>
                      <div className="flex gap-8">
                        <button className="btn btn-outline" style={{ fontSize: 10, padding: '4px 8px' }} onClick={() => handleOverride(r._id)}>Override</button>
                        <button className="btn btn-ghost" style={{ fontSize: 10, padding: '4px 8px' }}>Note</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
